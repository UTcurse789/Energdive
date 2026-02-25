import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { getUserByMagicToken, clearMagicToken } from "@/lib/queries";

/**
 * GET /api/auth/access-verify?token=XXXX
 *
 * Verifies a magic token from the provisioning pipeline:
 * 1. Looks up token in DB (must exist and not be expired)
 * 2. Clears token (one-time use)
 * 3. Creates a Clerk sign-in token
 * 4. Returns { ticket } for client-side session creation
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

        console.log(`[ACCESS_VERIFY] Token valid for user: ${user.email} (clerk: ${user.clerk_id})`);

        // 2. Clear the token (one-time use)
        await clearMagicToken(user.id);

        // 3. Create Clerk sign-in token
        const client = await clerkClient();
        const signInToken = await client.signInTokens.createSignInToken({
            userId: user.clerk_id,
            expiresInSeconds: 300, // 5 minutes to consume
        });

        console.log(`[ACCESS_VERIFY] Clerk sign-in token created for ${user.email}`);

        // 4. Return ticket for client-side consumption
        return NextResponse.json({
            success: true,
            ticket: signInToken.token,
            email: user.email,
            firstName: user.first_name,
        });
    } catch (error: any) {
        console.error("[ACCESS_VERIFY] Error:", error);
        return NextResponse.json(
            { error: "Verification failed", details: error.message },
            { status: 500 }
        );
    }
}
