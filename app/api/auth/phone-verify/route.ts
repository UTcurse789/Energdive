import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp-store";
import { createClerkClient } from "@clerk/nextjs/server";
import { updateVerificationStatus } from "@/lib/queries/users";

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
        const placeholderEmail = `phone_${mobile}@phone.energdive.com`;

        // Step 3: Find or create Clerk user — try multiple lookup strategies
        let clerkUser;
        let isNew = false;

        // Strategy 1: Search by externalId
        const byExternal = await clerk.users.getUserList({ externalId: [e164Phone] });
        if (byExternal.data.length > 0) {
            clerkUser = byExternal.data[0];
            console.log(`[Auth Phone] Found user by externalId: ${clerkUser.id}`);
        }

        // Strategy 2: Search by phone number array
        if (!clerkUser) {
            const byPhone = await clerk.users.getUserList({ phoneNumber: [e164Phone] });
            if (byPhone.data.length > 0) {
                clerkUser = byPhone.data[0];
                console.log(`[Auth Phone] Found user by phoneNumber: ${clerkUser.id}`);
            }
        }

        // Strategy 3: Search by query (free text search across all fields)
        if (!clerkUser) {
            const byQuery = await clerk.users.getUserList({ query: e164Phone });
            if (byQuery.data.length > 0) {
                clerkUser = byQuery.data[0];
                console.log(`[Auth Phone] Found user by query: ${clerkUser.id}`);
            }
        }

        // Strategy 4: Search by placeholder email
        if (!clerkUser) {
            const byEmail = await clerk.users.getUserList({ emailAddress: [placeholderEmail] });
            if (byEmail.data.length > 0) {
                clerkUser = byEmail.data[0];
                console.log(`[Auth Phone] Found user by placeholder email: ${clerkUser.id}`);
            }
        }

        // Strategy 5: Create new user
        if (!clerkUser) {
            try {
                clerkUser = await clerk.users.createUser({
                    emailAddress: [placeholderEmail],
                    externalId: e164Phone,
                    publicMetadata: { phone: e164Phone, phoneVerified: true, isPhoneUser: true },
                    skipPasswordRequirement: true,
                });
                isNew = true;
                console.log(`[Auth Phone] Created new user: ${clerkUser.id}`);
            } catch (createErr: any) {
                // If it failed because the externalId exists (but our queries missed it)
                const isConflictError = 
                    createErr.errors?.[0]?.code === 'form_identifier_exists' || 
                    createErr.errors?.[0]?.message?.toLowerCase().includes('external id is taken');
                
                if (isConflictError) {
                    console.warn(`[Auth Phone] externalId exists but hidden from query — doing fallback search by exact email...`);
                    // The most reliable fallback is the exact placeholder email we would have generated
                    const fallbackSearch = await clerk.users.getUserList({ emailAddress: [placeholderEmail] });
                    if (fallbackSearch.data.length > 0) {
                        clerkUser = fallbackSearch.data[0];
                        console.log(`[Auth Phone] Found existing user via fallback email search: ${clerkUser.id}`);
                    } else {
                        throw new Error(`User exists but could not be retrieved. Error: ${createErr.errors?.[0]?.message || 'Unknown'}`);
                    }
                } else {
                    console.error("[Auth Phone] createUser error:", JSON.stringify(createErr?.errors));
                    throw createErr;
                }
            }
        }

        // Step 4: Update verification state in DB
        try {
            await updateVerificationStatus(clerkUser.id, {
                phoneVerified: true,
                registrationMethod: 'phone',
                phone: e164Phone,
            });
            console.log(`[Auth Phone] Verification status updated for: ${clerkUser.id}`);
        } catch (dbErr: any) {
            // Non-fatal — user row might not exist yet (created via Clerk webhook)
            console.warn(`[Auth Phone] DB verification update failed (non-fatal): ${dbErr.message}`);
        }

        // Step 5: Create a sign-in token for the user
        const signInToken = await clerk.signInTokens.createSignInToken({
            userId: clerkUser.id,
            expiresInSeconds: 60,
        });

        console.log(`[Auth Phone] Sign-in token created for: ${clerkUser.id}`);

        return NextResponse.json({
            success: true,
            token: signInToken.token,
            isNewUser: isNew,
            registrationMethod: 'phone',
        });
    } catch (error: any) {
        console.error("[Auth Phone] Error:", error);
        return NextResponse.json(
            { error: error?.message || "Internal server error" },
            { status: 500 }
        );
    }
}
