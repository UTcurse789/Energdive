import qs from "qs";

const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
const ZOHO_ACCOUNTS_URL = "https://accounts.zoho.com";
const ZOHO_API_URL = "https://www.zohoapis.com/crm/v2";

/**
 * Interface for Zoho Lead structure
 * Adjust fields based on your actual CRM setup
 */
interface ZohoLead {
    id: string;
    Email: string;
    Magic_Token?: string; // Custom field in Zoho
    Token_Expiry?: string; // Custom field in Zoho (ISO string)
    [key: string]: any;
}

/**
 * Refresh the Zoho Access Token
 */
async function getZohoAccessToken(): Promise<string> {
    const missing = [];
    if (!ZOHO_CLIENT_ID) missing.push("ZOHO_CLIENT_ID");
    if (!ZOHO_CLIENT_SECRET) missing.push("ZOHO_CLIENT_SECRET");
    if (!ZOHO_REFRESH_TOKEN) missing.push("ZOHO_REFRESH_TOKEN");

    if (missing.length > 0) {
        throw new Error(`Missing Zoho API credentials: ${missing.join(", ")}`);
    }

    const params = {
        refresh_token: ZOHO_REFRESH_TOKEN,
        client_id: ZOHO_CLIENT_ID,
        client_secret: ZOHO_CLIENT_SECRET,
        grant_type: "refresh_token",
    };

    const response = await fetch(`${ZOHO_ACCOUNTS_URL}/oauth/v2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: qs.stringify(params),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Zoho Token Error:", errorBody);
        throw new Error("Failed to refresh Zoho Access Token");
    }

    const data = await response.json();
    return data.access_token;
}

/**
 * Fetch a Lead by Email to validate token
 */
export async function getLeadByEmail(email: string): Promise<ZohoLead | null> {
    const token = await getZohoAccessToken();

    // Search for lead by email
    const searchUrl = `${ZOHO_API_URL}/Leads/search?email=${encodeURIComponent(
        email
    )}`;
    const response = await fetch(searchUrl, {
        headers: {
            Authorization: `Zoho-oauthtoken ${token}`,
        },
    });

    if (!response.ok) {
        if (response.status === 204) return null; // No content found
        throw new Error("Failed to fetch lead from Zoho");
    }

    const data = await response.json();
    if (!data.data || data.data.length === 0) {
        return null;
    }

    return data.data[0]; // Return the first matching lead
}

/**
 * Invalidate the token in Zoho after successful use
 */
export async function invalidateLeadToken(leadId: string): Promise<void> {
    const token = await getZohoAccessToken();

    const updateBody = {
        data: [
            {
                id: leadId,
                Magic_Token: null, // Clear the token
                Token_Expiry: null, // Clear the expiry
            },
        ],
    };

    const response = await fetch(`${ZOHO_API_URL}/Leads`, {
        method: "PUT",
        headers: {
            Authorization: `Zoho-oauthtoken ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(updateBody),
    });

    if (!response.ok) {
        console.error("Failed to invalidate token", await response.text());
        // Use a non-blocking error here - user is already authenticated
    }
}
