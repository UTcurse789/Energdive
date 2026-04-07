import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { saveOnboardingProfile } from "@/lib/queries";
import { getFullUserProfile } from "@/lib/getFullUserProfile";
import { query } from "@/lib/db";
import { sendWelcomeEmail, sendNewUserNotification } from "@/lib/email";
import { syncEnrichedLead } from "@/lib/lead-sync-orchestrator";
import { logConsent, extractIpAddress, updateUserConsentFields } from "@/lib/consent-logger";
import { resolveDataSource } from "@/lib/data-provenance";

/**
 * POST /api/onboarding/submit
 * Atomically saves user profile + community/industry mappings.
 * Marks onboarding as complete in both the DB and Clerk metadata.
 */
export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();

        // ── Server-side validation ──────────────────────────────────
        if (!body.firstName || !body.lastName || !body.email) {
            return NextResponse.json(
                { error: "firstName, lastName, and email are required" },
                { status: 400 }
            );
        }
        if (!body.industryId || !body.subIndustryId) {
            return NextResponse.json(
                { error: "industryId and subIndustryId are required" },
                { status: 400 }
            );
        }
        if (
            !Array.isArray(body.communitySelections) ||
            body.communitySelections.length === 0
        ) {
            return NextResponse.json(
                { error: "At least one community selection is required" },
                { status: 400 }
            );
        }

        // ── Resolve phone: prefer Clerk metadata (from verify-second) over body ──
        let resolvedPhone = body.phone?.trim() || null;
        try {
            const clerkUser = await (await clerkClient()).users.getUser(userId);
            const metaPhone = (clerkUser.publicMetadata as any)?.phone as string | undefined;
            if (metaPhone && !resolvedPhone) {
                resolvedPhone = metaPhone;
                console.log(`[ONBOARDING] Recovered phone from Clerk metadata: ${resolvedPhone}`);
            }
        } catch (_) { /* non-fatal */ }

        // ── Save to DB (atomic transaction) ─────────────────────────
        // saveOnboardingProfile also sets verification_status='verified' and
        // triggers membership_id auto-assignment via DB trigger.
        const dbUserId = await saveOnboardingProfile({
            clerkId: userId,
            email: body.email,
            firstName: body.firstName,
            lastName: body.lastName,
            salutation: body.salutation,
            phone: resolvedPhone,
            country: body.country,
            state: body.state,
            jobTitle: body.jobTitle,
            organization: body.organization,
            industryId: body.industryId,
            subIndustryId: body.subIndustryId,
            communitySelections: body.communitySelections,
            preferredFrequency: body.preferredFrequency,
            preferredFormats: body.preferredFormats,
        });

        // ── Log consent (DPDP compliance) ───────────────────────────
        const clientIp = extractIpAddress(req);
        const dataSource = resolveDataSource("website");
        const consentTimestamp = body.consentTimestamp || null;
        try {
            await logConsent({
                userId: dbUserId,
                email: body.email,
                source: dataSource,
                ipAddress: clientIp,
                consentPurpose: "registration",
                metadata: {
                    clerkId: userId,
                    consentTimestamp,
                    utm_source: body.utm_source || null,
                    utm_campaign: body.utm_campaign || null,
                },
            });
            await updateUserConsentFields(userId, "website", clientIp, consentTimestamp);
            console.log(`[ONBOARDING] Consent logged for: ${body.email}, consent at: ${consentTimestamp}`);
        } catch (consentErr: any) {
            console.warn(`[ONBOARDING] Consent log failed (non-fatal): ${consentErr.message}`);
        }

        // ── Save UTM parameters to users table ─────────────────────
        const utmSource = body.utm_source || null;
        const utmMedium = body.utm_medium || null;
        const utmCampaign = body.utm_campaign || null;
        const utmTerm = body.utm_term || null;
        const utmContent = body.utm_content || null;

        if (utmSource || utmMedium || utmCampaign || utmTerm || utmContent) {
            try {
                await query(
                    `UPDATE users SET
                        utm_source = COALESCE(utm_source, $2),
                        utm_medium = COALESCE(utm_medium, $3),
                        utm_campaign = COALESCE(utm_campaign, $4),
                        utm_term = COALESCE(utm_term, $5),
                        utm_content = COALESCE(utm_content, $6),
                        updated_at = NOW()
                     WHERE clerk_id = $1`,
                    [userId, utmSource, utmMedium, utmCampaign, utmTerm, utmContent]
                );
                console.log(`[ONBOARDING] UTM saved: src=${utmSource}, med=${utmMedium}, camp=${utmCampaign}`);
            } catch (utmErr: any) {
                console.warn(`[ONBOARDING] UTM save failed (non-fatal): ${utmErr.message}`);
            }
        }

        await (await clerkClient()).users.updateUser(userId, {
            firstName: body.firstName,
            lastName: body.lastName,
            publicMetadata: {
                onboarding_completed: true,
                ...(resolvedPhone ? { phone: resolvedPhone } : {}),
            },
        });

        // ── Fetch FULL profile ─────────────────────────────
        const fullUser = await getFullUserProfile(userId);

        // ── Resolve real email (phone-first users have dummy @phone.energdive.com) ──
        const dbEmailIsDummy = fullUser.email?.endsWith('@phone.energdive.com');
        let syncEmail = fullUser.email;

        if (dbEmailIsDummy) {
            // Try body.email first (the real email user typed in onboarding form)
            // Then try Clerk's current primary email (verify-second may have replaced dummy)
            const bodyEmail = body.email?.trim();
            if (bodyEmail && !bodyEmail.endsWith('@phone.energdive.com')) {
                syncEmail = bodyEmail;
            } else {
                try {
                    const clerkUser = await (await clerkClient()).users.getUser(userId);
                    const clerkEmail = clerkUser.primaryEmailAddress?.emailAddress;
                    if (clerkEmail && !clerkEmail.endsWith('@phone.energdive.com')) {
                        syncEmail = clerkEmail;
                    }
                } catch (_) { /* non-fatal */ }
            }

            // Update DB email from dummy → real
            if (syncEmail !== fullUser.email) {
                try {
                    await query(
                        `UPDATE users SET email = $2 WHERE clerk_id = $1`,
                        [userId, syncEmail]
                    );
                    console.log(`[ONBOARDING] Replaced dummy email with real: ${syncEmail}`);
                    fullUser.email = syncEmail; // update in-memory too
                } catch (_) { /* non-fatal */ }
            }
        }

        const isDummyEmail = syncEmail?.endsWith('@phone.energdive.com');
        const canSyncExternally = !isDummyEmail;


        if (!canSyncExternally) {
            console.warn(`[ONBOARDING] Skipping Brevo/Zoho sync — dummy email detected: ${syncEmail}`);
        } else {
            console.log(`[ONBOARDING] Syncing to external systems for: ${syncEmail}`);
        }

        // ── Send Welcome Email (only if real email) ────────────────
        if (!isDummyEmail) {
            try {
                await sendWelcomeEmail(
                    syncEmail,
                    fullUser.first_name || body.firstName,
                    fullUser.preferred_frequency || body.preferredFrequency,
                    fullUser.preferred_formats || body.preferredFormats
                );
                console.log("✅ Welcome email sent to:", syncEmail);
            } catch (emailErr) {
                // Non-fatal — don't block onboarding if email fails
                console.error("⚠️ Welcome email failed:", emailErr);
            }
        }

        // ── Sync to Brevo → CRM (sequential, enriched) ─────────────
        if (canSyncExternally) {
            try {
                const syncResult = await syncEnrichedLead(
                    { ...fullUser, email: syncEmail, clerk_id: userId },
                    syncEmail,
                    resolvedPhone,
                    body,
                    { utm_source: utmSource, utm_medium: utmMedium, utm_campaign: utmCampaign, utm_term: utmTerm, utm_content: utmContent }
                );
                console.log("✅ Sync orchestrator result:", syncResult);
            } catch (syncErr: any) {
                // Non-fatal — don't block onboarding if sync fails
                console.error("⚠️ Sync orchestrator failed:", syncErr.message);
            }
        }

        return NextResponse.json({ success: true, userId: dbUserId });
    } catch (error) {
        console.error("[ONBOARDING_SUBMIT]", error);
        const message = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack : undefined;
        return NextResponse.json(
            { error: "Internal server error", detail: message, stack },
            { status: 500 }
        );
    }
}
