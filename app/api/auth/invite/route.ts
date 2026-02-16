import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { getLeadByEmail, invalidateLeadToken } from "@/lib/zoho";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
        return NextResponse.json(
            { error: "Missing token or email parameters" },
            { status: 400 }
        );
    }

    try {
        // 1. Verify Request against Zoho
        const lead = await getLeadByEmail(email);

        if (!lead) {
            return NextResponse.json({ error: "Lead not found" }, { status: 404 });
        }

        // Check if fields exist on the lead
        const storedToken = lead.Magic_Token;
        const expiryString = lead.Token_Expiry;

        if (!storedToken || !expiryString) {
            return NextResponse.json(
                { error: "Invalid lead state. No token found." },
                { status: 400 }
            );
        }

        // 2. Validate Token Matches
        if (storedToken !== token) {
            return NextResponse.json(
                { error: "Invalid token provided" },
                { status: 401 }
            );
        }

        // 3. Validate Token Expiry
        const now = new Date();
        const expiry = new Date(expiryString); // ISO String expected from Zoho

        if (now > expiry) {
            return NextResponse.json(
                { error: "Token has expired" },
                { status: 401 }
            );
        }

        // 4. Invalidate Token (One-time use)
        // We await this to ensure security before granting access
        await invalidateLeadToken(lead.id);

        // 5. Manage Clerk User
        const client = await clerkClient();

        // Check if user exists
        const userList = await client.users.getUserList({
            emailAddress: [email],
        });

        let user = userList.data[0];

        if (!user) {
            // Create new user if they don't exist
            user = await client.users.createUser({
                emailAddress: [email],
                firstName: lead.First_Name || undefined,
                lastName: lead.Last_Name || undefined,
                skipPasswordRequirement: true,
            });
        }

        // 6. Generate Sign-In Token
        // Clerk allows creating a sign-in token that redirects to a URL
        // ensure expiresInSeconds is roughly same as our remaining validity or short (e.g. 5 mins)
        const signInToken = await client.signInTokens.createSignInToken({
            userId: user.id,
            expiresInSeconds: 600, // 10 minutes to complete sign-in
        });

        // 7. Redirect User
        // The signInToken.url will perform the sign-in and then redirect to the configured after-sign-in URL (usually /dashboard)
        if (signInToken.url) {
            return NextResponse.redirect(signInToken.url);
        } else {
            // Fallback manual construction if URL not present (should be present)
            throw new Error("Failed to generate Redirect URL");
        }

    } catch (error: any) {
        console.error("Auth flow error:", error);
        return NextResponse.json(
            { error: "Authentication failed", details: error.message },
            { status: 500 }
        );
    }
}
