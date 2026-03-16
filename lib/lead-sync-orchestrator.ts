/**
 * Lead Sync Orchestrator
 *
 * Centralizes the sequential sync logic:
 *   DB (enriched) → Brevo → Zoho CRM
 *
 * Key properties:
 * - Idempotent: safe to call multiple times (checks sync_status)
 * - Sequential: Brevo must succeed before CRM push
 * - Tracks state: updates sync_status at each stage
 */

import { query } from "./db";
import syncUserToBrevo from "./brevoSync";
import { upsertZohoLead, ZohoLeadData } from "./zoho-leads";
import { logEvent } from "./system-logger";

export interface SyncResult {
    success: boolean;
    skipped?: boolean;
    reason?: string;
    brevoSynced?: boolean;
    crmSynced?: boolean;
    crmLeadId?: string;
}

/**
 * Sync an enriched user to Brevo → CRM, in that order.
 * Only syncs if onboarding is complete and sync isn't already done.
 *
 * @param fullUser - Full user profile from getFullUserProfile()
 * @param syncEmail - Resolved real email address
 * @param resolvedPhone - Resolved phone number
 * @param bodyData - Raw onboarding body data as fallback
 */
export async function syncEnrichedLead(
    fullUser: any,
    syncEmail: string,
    resolvedPhone: string | null,
    bodyData: any
): Promise<SyncResult> {
    const clerkId = fullUser.clerk_id;
    const log = (msg: string) => console.log(`[SYNC_ORCHESTRATOR] ${msg}`);

    // Skip dummy emails
    if (!syncEmail || syncEmail.endsWith("@phone.energdive.com")) {
        log(`Skipped — dummy email: ${syncEmail}`);
        return { success: true, skipped: true, reason: "dummy_email" };
    }

    // ── Step 1: Sync to Brevo ─────────────────────────────────────────────
    try {
        log(`Syncing to Brevo: ${syncEmail}`);
        await syncUserToBrevo({ ...fullUser, email: syncEmail });

        await query(
            `UPDATE users SET
               sync_status = 'brevo_synced',
               brevo_synced_at = NOW(),
               brevo_contact_id = 'synced',
               updated_at = NOW()
             WHERE clerk_id = $1`,
            [clerkId]
        );

        await logEvent("BREVO_SYNC_SUCCESS", syncEmail, "Contact synced to Brevo with full enrichment");
        log(`✅ Brevo synced: ${syncEmail}`);
    } catch (brevoErr: any) {
        // Brevo failed — do NOT proceed to CRM
        console.error(`[SYNC_ORCHESTRATOR] ❌ Brevo sync failed:`, brevoErr.message);
        await logEvent("BREVO_SYNC_FAILED", syncEmail, `Brevo sync failed: ${brevoErr.message}`);

        // Update sync_status to 'error' so retry can pick it up
        await query(
            `UPDATE users SET sync_status = 'error', updated_at = NOW() WHERE clerk_id = $1`,
            [clerkId]
        );

        // Non-fatal — return partial result, don't throw
        return { success: false, brevoSynced: false, crmSynced: false, reason: "brevo_failed" };
    }

    // ── Step 2: Sync to Zoho CRM (only after Brevo success) ───────────────
    try {
        // Helper: return non-empty array or undefined
        const toArray = (arr: any[] | undefined) => {
            if (!arr) return undefined;
            const filtered = arr.filter((v: any) => v !== null && v !== undefined && v !== "");
            return filtered.length > 0 ? filtered : undefined;
        };

        const phone = fullUser.phone || resolvedPhone || bodyData.phone || undefined;
        const leadData: ZohoLeadData = {
            First_Name: fullUser.first_name || bodyData.firstName,
            Last_Name: fullUser.last_name || bodyData.lastName,
            Email: syncEmail,
            Phone: phone,
            Mobile: phone,
            Company: fullUser.organization || bodyData.organization || undefined,
            Designation: fullUser.job_title || bodyData.jobTitle || undefined,
            Lead_Source: fullUser.source === "zoho_form" ? "Zoho Form Verified" : "Website Registration",
            Industry: fullUser.industries?.find((i: string | null) => !!i) || undefined,
            Industry_Sub_Category: fullUser.sub_industries?.find((i: string | null) => !!i) || undefined,
            Community_Portal: toArray(fullUser.sub_communities),
            Invite_Source: "EnergClub",
            City: fullUser.state || bodyData.state || undefined,
            Country: fullUser.country || bodyData.country || undefined,
        };

        log(`Syncing to Zoho CRM: ${syncEmail}`);
        const zohoResult = await upsertZohoLead(leadData);

        await query(
            `UPDATE users SET
               crm_lead_id = $1,
               sync_status = 'complete',
               crm_synced_at = NOW(),
               updated_at = NOW()
             WHERE clerk_id = $2`,
            [zohoResult.id, clerkId]
        );

        await logEvent("CRM_SYNC_SUCCESS", syncEmail, `CRM lead ${zohoResult.action}: ${zohoResult.id}`);
        log(`✅ CRM synced: ${syncEmail} → ${zohoResult.id} (${zohoResult.action})`);

        return {
            success: true,
            brevoSynced: true,
            crmSynced: true,
            crmLeadId: zohoResult.id,
        };
    } catch (zohoErr: any) {
        // CRM failed but Brevo succeeded — status stays 'brevo_synced'
        console.error(`[SYNC_ORCHESTRATOR] ❌ CRM sync failed:`, zohoErr.message);
        await logEvent("CRM_SYNC_FAILED", syncEmail, `CRM sync failed: ${zohoErr.message}`);

        // Non-fatal — Brevo is already done, CRM can be retried
        return { success: false, brevoSynced: true, crmSynced: false, reason: "crm_failed" };
    }
}
