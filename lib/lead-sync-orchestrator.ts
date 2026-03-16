/**
 * Lead Sync Orchestrator
 *
 * Centralizes the sequential sync logic:
 *   DB (enriched) -> Brevo -> Zoho CRM
 *
 * CRM behavior depends on lead source:
 * - Zoho Form leads -> createZohoDuplicateLead
 * - Portal-direct leads -> upsertZohoLead
 */

import { query } from "./db";
import syncUserToBrevo from "./brevoSync";
import { upsertZohoLead, createZohoDuplicateLead, ZohoLeadData } from "./zoho-leads";
import { logEvent } from "./system-logger";

export interface SyncResult {
    success: boolean;
    skipped?: boolean;
    reason?: string;
    brevoSynced?: boolean;
    crmSynced?: boolean;
    crmLeadId?: string;
}

interface SyncUserProfile {
    clerk_id: string;
    source?: string | null;
    phone?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    organization?: string | null;
    crm_lead_id?: string | null;
    membership_id?: string | null;
    communities?: Array<string | null>;
    sub_communities?: Array<string | null>;
    industries?: Array<string | null>;
    sub_industries?: Array<string | null>;
    job_title?: string | null;
    state?: string | null;
    country?: string | null;
}

interface SyncBodyData {
    phone?: string;
    firstName?: string;
    lastName?: string;
    organization?: string;
    jobTitle?: string;
    state?: string;
    country?: string;
}

async function updateUserSyncState(
    clerkId: string,
    fields: Record<string, unknown>
): Promise<void> {
    const buildSql = (payload: Record<string, unknown>) => {
        const assignments: string[] = [];
        const values: unknown[] = [];
        let index = 1;

        for (const [key, value] of Object.entries(payload)) {
            assignments.push(`${key} = $${index++}`);
            values.push(value);
        }

        assignments.push("updated_at = NOW()");
        values.push(clerkId);

        return {
            sql: `UPDATE users SET ${assignments.join(", ")} WHERE clerk_id = $${index}`,
            values,
        };
    };

    const primary = buildSql(fields);

    try {
        await query(primary.sql, primary.values);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const missingOptionalSyncColumns =
            message.includes(`column "sync_status"`) ||
            message.includes(`column "brevo_synced_at"`) ||
            message.includes(`column "crm_synced_at"`);

        if (!missingOptionalSyncColumns) {
            throw error;
        }

        const fallbackFields = Object.fromEntries(
            Object.entries(fields).filter(([key]) =>
                !["sync_status", "brevo_synced_at", "crm_synced_at"].includes(key)
            )
        );

        const fallback = buildSql(fallbackFields);
        await query(fallback.sql, fallback.values);
    }
}

function nonEmptyArray(arr: Array<string | null> | undefined): string[] | undefined {
    if (!arr) return undefined;
    const filtered = arr.filter((value): value is string => value !== null && value !== undefined && value !== "");
    return filtered.length > 0 ? filtered : undefined;
}

export async function syncEnrichedLead(
    fullUser: SyncUserProfile,
    syncEmail: string,
    resolvedPhone: string | null,
    bodyData: SyncBodyData
): Promise<SyncResult> {
    const clerkId = fullUser.clerk_id;
    const log = (msg: string) => console.log(`[SYNC_ORCHESTRATOR] ${msg}`);

    if (!syncEmail || syncEmail.endsWith("@phone.energdive.com")) {
        log(`Skipped dummy email: ${syncEmail}`);
        return { success: true, skipped: true, reason: "dummy_email" };
    }

    try {
        log(`Syncing to Brevo: ${syncEmail}`);
        await syncUserToBrevo({ ...fullUser, email: syncEmail });

        await updateUserSyncState(clerkId, {
            sync_status: "brevo_synced",
            brevo_synced_at: new Date(),
            brevo_contact_id: "synced",
        });

        await logEvent("BREVO_SYNC_SUCCESS", syncEmail, "Contact synced to Brevo with full enrichment");
    } catch (brevoError: unknown) {
        const message = brevoError instanceof Error ? brevoError.message : String(brevoError);
        console.error("[SYNC_ORCHESTRATOR] Brevo sync failed:", message);
        await logEvent("BREVO_SYNC_FAILED", syncEmail, `Brevo sync failed: ${message}`);

        await updateUserSyncState(clerkId, {
            sync_status: "error",
        });

        return { success: false, brevoSynced: false, crmSynced: false, reason: "brevo_failed" };
    }

    const isZohoFormLead = fullUser.source === "zoho_form";
    const phone = fullUser.phone || resolvedPhone || bodyData.phone || undefined;

    try {
        if (isZohoFormLead) {
            log(`Creating duplicate CRM lead for: ${syncEmail}`);

            const duplicateLeadId = await createZohoDuplicateLead({
                email: syncEmail,
                name: `${fullUser.first_name || bodyData.firstName || ""} ${fullUser.last_name || bodyData.lastName || ""}`.trim(),
                phone,
                company: fullUser.organization || bodyData.organization || undefined,
                source: "Zoho Form Verified",
                originalLeadId: fullUser.crm_lead_id || undefined,
                membershipId: fullUser.membership_id || undefined,
                communities: nonEmptyArray(fullUser.communities),
                subCommunities: nonEmptyArray(fullUser.sub_communities),
            });

            if (!duplicateLeadId) {
                throw new Error("createZohoDuplicateLead returned null");
            }

            await updateUserSyncState(clerkId, {
                crm_duplicate_lead_id: duplicateLeadId,
                crm_duplicate_id: duplicateLeadId,
                duplicate_created: true,
                sync_status: "complete",
                crm_synced_at: new Date(),
            });

            await logEvent("CRM_SYNC_SUCCESS", syncEmail, `Duplicate lead created: ${duplicateLeadId}`);

            return {
                success: true,
                brevoSynced: true,
                crmSynced: true,
                crmLeadId: duplicateLeadId,
            };
        }

        const leadData: ZohoLeadData = {
            First_Name: fullUser.first_name || bodyData.firstName || "",
            Last_Name: fullUser.last_name || bodyData.lastName || "",
            Email: syncEmail,
            Phone: phone,
            Mobile: phone,
            Company: fullUser.organization || bodyData.organization || undefined,
            Designation: fullUser.job_title || bodyData.jobTitle || undefined,
            Lead_Source: "Website Registration",
            Industry: fullUser.industries?.find(Boolean) || undefined,
            Industry_Sub_Category: fullUser.sub_industries?.find(Boolean) || undefined,
            Community_Portal: nonEmptyArray(fullUser.sub_communities),
            Invite_Source: "EnergClub",
            City: fullUser.state || bodyData.state || undefined,
            Country: fullUser.country || bodyData.country || undefined,
        };

        log(`Upserting CRM lead for: ${syncEmail}`);
        const zohoResult = await upsertZohoLead(leadData);

        await updateUserSyncState(clerkId, {
            crm_lead_id: zohoResult.id,
            sync_status: "complete",
            crm_synced_at: new Date(),
        });

        await logEvent("CRM_SYNC_SUCCESS", syncEmail, `CRM lead ${zohoResult.action}: ${zohoResult.id}`);

        return {
            success: true,
            brevoSynced: true,
            crmSynced: true,
            crmLeadId: zohoResult.id,
        };
    } catch (crmError: unknown) {
        const message = crmError instanceof Error ? crmError.message : String(crmError);
        console.error("[SYNC_ORCHESTRATOR] CRM sync failed:", message);
        await logEvent("CRM_SYNC_FAILED", syncEmail, `CRM sync failed: ${message}`);

        return { success: false, brevoSynced: true, crmSynced: false, reason: "crm_failed" };
    }
}
