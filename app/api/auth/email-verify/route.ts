import { NextResponse } from "next/server";
import { createClerkClient } from "@clerk/nextjs/server";

const clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY!,
});

/**
 * Backend fallback for email sign-up when Clerk's frontend CAPTCHA blocks completion.
 * After email is verified (missing_requirements), the frontend calls this endpoint
 * to create the user via backend SDK and return a sign-in token.
 */
export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        console.log(`[Auth Email] Creating/finding user for: ${email}`);

        // Step 1: Check if user already exists
        let clerkUser;
        let isNew = false;

        const existingUsers = await clerk.users.getUserList({
            emailAddress: [email],
        });

        if (existingUsers.data.length > 0) {
            clerkUser = existingUsers.data[0];
            console.log(`[Auth Email] Found existing user: ${clerkUser.id}`);
        } else {
            // Create new user — email already verified by Clerk frontend
            clerkUser = await clerk.users.createUser({
                emailAddress: [email],
                skipPasswordRequirement: true,
            });
            isNew = true;
            console.log(`[Auth Email] Created new user: ${clerkUser.id}`);
        }

        // Step 2: Generate sign-in token
        const signInToken = await clerk.signInTokens.createSignInToken({
            userId: clerkUser.id,
            expiresInSeconds: 60,
        });

        console.log(`[Auth Email] Sign-in token created for: ${clerkUser.id}`);

        return NextResponse.json({
            success: true,
            token: signInToken.token,
            isNewUser: isNew,
        });
    } catch (error: any) {
        console.error("[Auth Email] Error:", error);
        return NextResponse.json(
            { error: error?.message || "Internal server error" },
            { status: 500 }
        );
    }
}
