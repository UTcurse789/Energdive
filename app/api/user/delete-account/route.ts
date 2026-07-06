import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { deleteUserAccount } from "@/lib/queries/users";
import { query } from "@/lib/db";
import { headers } from "next/headers";

/**
 * POST /api/user/delete-account
 * Permanently deletes the user from DB and Clerk.
 * Logs a full audit record (name, email, company, IP location, reason) to deleted_accounts.
 */
export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();

        // Require confirmation text
        if (body.confirmation !== "DELETE") {
            return NextResponse.json(
                { error: "Please type DELETE to confirm account deletion." },
                { status: 400 }
            );
        }

        // Validate reason (minimum 50 characters)
        const reason = typeof body.reason === "string" ? body.reason.trim() : "";
        if (reason.length < 50) {
            return NextResponse.json(
                { error: "Please provide a reason with at least 50 characters." },
                { status: 400 }
            );
        }

        console.log(`[DELETE_ACCOUNT] User ${userId} requested deletion. Reason: ${reason}`);

        // ── Fetch user profile for audit record ──
        let userName = "Unknown";
        let userEmail = "Unknown";
        let companyName = "";

        try {
            const profileResult = await query(
                `SELECT first_name, last_name, email, organization FROM users WHERE clerk_id = $1 LIMIT 1`,
                [userId]
            );
            if (profileResult.rows.length > 0) {
                const row = profileResult.rows[0];
                userName = [row.first_name, row.last_name].filter(Boolean).join(" ") || "Unknown";
                userEmail = row.email || "Unknown";
                companyName = row.organization || "";
            } else {
                // If DB lookup by clerk_id fails, fetch user profile from Clerk to get the email
                try {
                    const client = await clerkClient();
                    const clerkUser = await client.users.getUser(userId);
                    userEmail = clerkUser.emailAddresses[0]?.emailAddress || "Unknown";
                    userName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "Unknown";
                } catch (clerkFetchErr) {
                    console.error("[DELETE_ACCOUNT] Failed to fetch user from Clerk:", clerkFetchErr);
                }
            }
        } catch (profileErr) {
            console.error(`[DELETE_ACCOUNT] Failed to fetch profile for audit:`, profileErr);
        }

        // ── Fetch IP-based location (primary: ipinfo.io, fallback: ipapi.co) ──
        let locationStr = "Unknown";
        try {
            const headersList = await headers();
            const forwardedFor = headersList.get("x-forwarded-for");
            const realIp = headersList.get("x-real-ip");
            const clientIp = forwardedFor?.split(",")[0]?.trim() || realIp || "";
            const isLocal = !clientIp || clientIp === "127.0.0.1" || clientIp === "::1" || clientIp === "localhost";

            // Primary: ipinfo.io (50k/month free tier)
            try {
                const ipinfoUrl = isLocal
                    ? "https://ipinfo.io/json"
                    : `https://ipinfo.io/${clientIp}/json`;
                const ipinfoRes = await fetch(ipinfoUrl, {
                    signal: AbortSignal.timeout(5000),
                });
                if (ipinfoRes.ok) {
                    const ipinfoData = await ipinfoRes.json();
                    if (ipinfoData && !ipinfoData.error) {
                        const state = ipinfoData.region || "";
                        const city = ipinfoData.city || "";
                        const parts = [state, city].map((p) => p.trim()).filter(Boolean);
                        if (parts.length > 0) {
                            locationStr = parts.join(", ");
                        }
                    }
                }
            } catch {}

            // Fallback: ipapi.co
            if (locationStr === "Unknown") {
                try {
                    const ipapiUrl = isLocal
                        ? "https://ipapi.co/json/"
                        : `https://ipapi.co/${clientIp}/json/`;
                    const ipapiRes = await fetch(ipapiUrl, {
                        signal: AbortSignal.timeout(5000),
                    });
                    if (ipapiRes.ok) {
                        const ipapiData = await ipapiRes.json();
                        if (ipapiData && !ipapiData.error) {
                            const state = ipapiData.region || "";
                            const city = ipapiData.city || "";
                            const parts = [state, city].map((p) => p.trim()).filter(Boolean);
                            if (parts.length > 0) {
                                locationStr = parts.join(", ");
                            }
                        }
                    }
                } catch {}
            }
        } catch (locErr) {
            console.error(`[DELETE_ACCOUNT] Failed to fetch location:`, locErr);
        }

        // ── Insert audit record into deleted_accounts ──
        try {
            await query(
                `INSERT INTO deleted_accounts (clerk_id, name, email, company_name, location, reason)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [userId, userName, userEmail, companyName, locationStr, reason]
            );
            console.log(`[DELETE_ACCOUNT] Audit record created for ${userEmail}`);
        } catch (auditErr) {
            // Non-blocking — we still proceed with deletion even if audit fails
            console.error(`[DELETE_ACCOUNT] Failed to insert audit record:`, auditErr);
        }

        // 1. Delete from our database
        const dbDeleted = await deleteUserAccount(userId, userEmail !== "Unknown" ? userEmail : null);
        console.log(`[DELETE_ACCOUNT] DB deletion result for ${userId}: ${dbDeleted}`);

        // 2. Delete from Clerk
        try {
            await (await clerkClient()).users.deleteUser(userId);
            console.log(`[DELETE_ACCOUNT] Clerk user ${userId} deleted`);
        } catch (clerkErr) {
            console.error(`[DELETE_ACCOUNT] Clerk deletion failed:`, clerkErr);
            // DB is already deleted, return partial success
            return NextResponse.json({
                success: true,
                warning: "Account data deleted but Clerk cleanup failed. Contact support if issues persist.",
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[DELETE_ACCOUNT]", error);
        return NextResponse.json(
            { error: "Failed to delete account. Please try again." },
            { status: 500 }
        );
    }
}
