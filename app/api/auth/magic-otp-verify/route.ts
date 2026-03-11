import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp-store";
import { clerkClient } from "@clerk/nextjs/server";
import { getUserByInternalId } from "@/lib/queries/users";
import syncUserToBrevo from "@/lib/brevoSync";
import { getFullUserProfile } from "@/lib/getFullUserProfile";

/**
 * POST /api/auth/magic-otp-verify
 *
 * Verifies the email OTP during magic link login flow.
 * On success, creates a Clerk sign-in token and syncs user to Brevo.
 *
 * Body: { email: string, otp: string, userId: number }
 */
export async function POST(req: Request) {
    try {
        const { email, otp, userId } = await req.json();

        if (!email || !otp || !userId) {
            return NextResponse.json(
                { error: "email, otp, and userId are required" },
                { status: 400 }
            );
        }

        const normalizedEmail = email.trim().toLowerCase();

        console.log(
            `[Magic OTP Verify] Verifying email OTP for: ${normalizedEmail}, userId: ${userId}`
        );

        // Step 1: Verify OTP (keyed by email)
        const isValid = verifyOtp(normalizedEmail, otp);
        if (!isValid) {
            return NextResponse.json(
                { error: "Invalid or expired OTP" },
                { status: 400 }
            );
        }

        console.log(`[Magic OTP Verify] OTP verified for: ${normalizedEmail}`);

        // Step 2: Look up the user to get their Clerk ID
        const user = await getUserByInternalId(userId);
        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Step 3: Create Clerk sign-in token
        const client = await clerkClient();
        const signInToken = await client.signInTokens.createSignInToken({
            userId: user.clerk_id,
            expiresInSeconds: 300,
        });

        console.log(
            `[Magic OTP Verify] Clerk sign-in token created for ${user.email}`
        );

        // Step 4: Sync to Brevo (user identity now fully verified)
        try {
            const fullUser = await getFullUserProfile(user.clerk_id);
            if (
                fullUser &&
                fullUser.email &&
                !fullUser.email.endsWith("@phone.energdive.com")
            ) {
                await syncUserToBrevo(fullUser);
                console.log(
                    `[Magic OTP Verify] Synced to Brevo: ${fullUser.email}`
                );
            }
        } catch (brevoErr: any) {
            // Non-fatal
            console.warn(
                `[Magic OTP Verify] Brevo sync failed: ${brevoErr.message}`
            );
        }

        return NextResponse.json({
            success: true,
            ticket: signInToken.token,
        });
    } catch (error: any) {
        console.error("[Magic OTP Verify] Error:", error);
        return NextResponse.json(
            { error: error?.message || "Internal server error" },
            { status: 500 }
        );
    }
}

