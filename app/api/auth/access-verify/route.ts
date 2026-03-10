import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { getUserByMagicToken, clearMagicToken } from "@/lib/queries";

/**
 * GET /api/auth/access-verify?token=XXXX
 *
 * Verifies a magic token from the provisioning pipeline:
 * 1. Looks up token in DB (must exist and not be expired)
 * 2. Clears token (one-time use)
 * 3. Returns user info (including phone) for OTP verification step
 *
 * NOTE: Does NOT create a Clerk sign-in token anymore.
 *       The sign-in token is created after OTP verification in /api/auth/magic-otp-verify.
 */
export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
        return NextResponse.json(
            { error: "Missing token parameter" },
            { status: 400 }
        );
    }

    try {
        // 1. Look up user by magic token
        const user = await getUserByMagicToken(token);

        if (!user) {
            console.warn(`[ACCESS_VERIFY] Invalid or expired token`);
            return NextResponse.json(
                { error: "Invalid or expired access link" },
                { status: 401 }
            );
        }

        console.log(
            `[ACCESS_VERIFY] Token valid for user: ${user.email} (clerk: ${user.clerk_id})`
        );

        // 2. Clear the token (one-time use)
        await clearMagicToken(user.id);

        // 3. Look up phone number from DB for OTP step
        // Import dynamically to avoid circular deps
        const { query } = await import("@/lib/db");
        const phoneResult = await query(
            `SELECT phone FROM users WHERE id = $1 LIMIT 1`,
            [user.id]
        );
        const phone = phoneResult.rows[0]?.phone || null;

        // 4. Return user info for OTP verification (NO sign-in token yet)
        return NextResponse.json({
            success: true,
            userId: user.id,
            email: user.email,
            firstName: user.first_name,
            phone, // Full phone for OTP sending (server-side only)
        });
    } catch (error: any) {
        console.error("[ACCESS_VERIFY] Error:", error);
        return NextResponse.json(
            { error: "Verification failed", details: error.message },
            { status: 500 }
        );
    }
}
