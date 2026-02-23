import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp-store";
import { createClerkClient } from "@clerk/nextjs/server";

const clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY!,
});

export async function POST(req: Request) {
    try {
        const { phone, otp } = await req.json();

        if (!phone || !otp) {
            return NextResponse.json(
                { error: "Phone and OTP are required" },
                { status: 400 }
            );
        }

        // Ensure numeric only for OTP store lookup
        const mobile = phone.replace(/[^0-9]/g, "");

        console.log(`[Auth Phone] Verifying OTP for: ${mobile}`);

        // Step 1: Verify OTP via MSG91 in-memory store
        const isValid = verifyOtp(mobile, otp);
        if (!isValid) {
            return NextResponse.json(
                { error: "Invalid or expired OTP" },
                { status: 400 }
            );
        }

        console.log(`[Auth Phone] OTP verified for: ${mobile}`);

        // Step 2: Format phone to E.164 for Clerk
        const e164Phone = mobile.startsWith("91") ? `+${mobile}` : `+91${mobile}`;

        // Step 3: Find or create Clerk user
        let clerkUser;
        let isNew = false;

        // Search for existing user by externalId (phone) first
        const existingUsers = await clerk.users.getUserList({
            externalId: [e164Phone],
        });

        if (existingUsers.data.length > 0) {
            clerkUser = existingUsers.data[0];
            console.log(`[Auth Phone] Found existing Clerk user: ${clerkUser.id}`);
        } else {
            // Also try searching by phone number in case user was created via Clerk directly
            const phoneUsers = await clerk.users.getUserList({
                phoneNumber: [e164Phone],
            });

            if (phoneUsers.data.length > 0) {
                clerkUser = phoneUsers.data[0];
                console.log(`[Auth Phone] Found existing Clerk user by phone: ${clerkUser.id}`);
            } else {
                // Create new Clerk user — Clerk needs at least one identifier (email/username)
                // Generate a placeholder email for phone-only users
                const placeholderEmail = `phone_${mobile}@phone.energdive.com`;
                clerkUser = await clerk.users.createUser({
                    emailAddress: [placeholderEmail],
                    externalId: e164Phone,
                    publicMetadata: { phone: e164Phone, phoneVerified: true, isPhoneUser: true },
                    skipPasswordRequirement: true,
                });
                isNew = true;
                console.log(`[Auth Phone] Created new Clerk user: ${clerkUser.id}`);
            }
        }

        // Step 4: Create a sign-in token for the user
        const signInToken = await clerk.signInTokens.createSignInToken({
            userId: clerkUser.id,
            expiresInSeconds: 60, // 1 min to use
        });

        console.log(`[Auth Phone] Sign-in token created for user: ${clerkUser.id}`);

        return NextResponse.json({
            success: true,
            token: signInToken.token,
            isNewUser: isNew,
        });
    } catch (error: any) {
        console.error("[Auth Phone] Error:", error);
        return NextResponse.json(
            { error: error?.message || "Internal server error" },
            { status: 500 }
        );
    }
}
