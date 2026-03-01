import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/zoho/callback
 *
 * Zoho OAuth callback endpoint. Receives the authorization code
 * after the OAuth consent flow. Since you already have a permanent
 * refresh_token, this endpoint is mainly used for re-authorization
 * or initial setup.
 *
 * Query params from Zoho:
 *  - code: authorization code
 *  - accounts-server: Zoho accounts URL
 *  - location: Zoho data center region
 */
export async function POST(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const code = searchParams.get("code");
    const accountsServer = searchParams.get("accounts-server") || "https://accounts.zoho.in";

    if (!code) {
        return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
    }

    try {
        // Exchange code for tokens
        const tokenUrl = `${accountsServer}/oauth/v2/token`;
        const params = new URLSearchParams({
            code,
            client_id: process.env.ZOHO_CLIENT_ID || "",
            client_secret: process.env.ZOHO_CLIENT_SECRET || "",
            redirect_uri: process.env.redirect_uri || "https://www.energdive.com/api/zoho/callback",
            grant_type: "authorization_code",
        });

        const response = await fetch(tokenUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString(),
        });

        const data = await response.json();

        if (data.error) {
            console.error("[ZOHO_CALLBACK] Token error:", data);
            return NextResponse.json({ error: data.error }, { status: 400 });
        }

        // Log tokens for setup (in production, store refresh_token securely)
        console.log("[ZOHO_CALLBACK] Tokens received:");
        console.log("  Access Token:", data.access_token);
        if (data.refresh_token) {
            console.log("  Refresh Token:", data.refresh_token);
            console.log("  ⚠️  Save this refresh_token to your .env as ZOHO_REFRESH_TOKEN");
        }

        return NextResponse.json({
            success: true,
            message: data.refresh_token
                ? "Authorization successful. Check server logs for refresh_token."
                : "Access token refreshed (no new refresh_token issued).",
            access_token: data.access_token,
            refresh_token: data.refresh_token || null,
        });
    } catch (error: any) {
        console.error("[ZOHO_CALLBACK]", error);
        return NextResponse.json(
            { error: "Failed to exchange authorization code", details: error.message },
            { status: 500 }
        );
    }
}

// Also handle GET in case Zoho sends a GET redirect
export async function GET(req: NextRequest) {
    return POST(req);
}
