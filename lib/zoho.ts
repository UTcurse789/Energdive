import qs from "qs";

const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
const ZOHO_ACCOUNTS_URL = "https://accounts.zoho.in";
const ZOHO_API_URL = `${process.env.ZOHO_API_DOMAIN || "https://www.zohoapis.in"}/crm/v2`;

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

// In-memory token cache (Zoho access tokens last ~60 min, cache for 50)
let cachedToken: { token: string; expiresAt: number } | null = null;
const TOKEN_CACHE_DURATION_MS = 50 * 60 * 1000; // 50 minutes

/**
 * Refresh the Zoho Access Token (with in-memory caching)
 */
async function getZohoAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (cachedToken && Date.now() < cachedToken.expiresAt) {
        return cachedToken.token;
    }

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

    // Cache the token
    cachedToken = {
        token: data.access_token,
        expiresAt: Date.now() + TOKEN_CACHE_DURATION_MS,
    };
    console.log("[ZOHO] Access token refreshed and cached");

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
        const errorBody = await response.text();
        console.error(`[ZOHO] Lead search failed - Status: ${response.status}, URL: ${searchUrl}, Body: ${errorBody}`);
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

/**
 * Update arbitrary fields on a Zoho Lead record.
 * Used to write back Magic_Token, Token_Expiry, etc.
 */
export async function updateLeadFields(
    leadId: string,
    fields: Record<string, any>
): Promise<void> {
    const token = await getZohoAccessToken();

    const updateBody = {
        data: [{ id: leadId, ...fields }],
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
        const errBody = await response.text();
        console.error(`[ZOHO] Failed to update lead ${leadId}:`, errBody);
        throw new Error(`Failed to update Zoho lead ${leadId}`);
    }

    console.log(`[ZOHO] Lead ${leadId} updated:`, Object.keys(fields).join(", "));
}

/**
 * Fetch a Lead directly by its Zoho Record ID
 */
export async function getLeadById(leadId: string): Promise<ZohoLead | null> {
    const token = await getZohoAccessToken();

    const response = await fetch(`${ZOHO_API_URL}/Leads/${leadId}`, {
        headers: {
            Authorization: `Zoho-oauthtoken ${token}`,
        },
    });

    if (!response.ok) {
        if (response.status === 204 || response.status === 404) return null;
        throw new Error(`Failed to fetch lead ${leadId} from Zoho`);
    }

    const data = await response.json();
    if (!data.data || data.data.length === 0) {
        return null;
    }

    return data.data[0];
}

/**
 * Validate a magic token against the stored token + expiry on the lead.
 * Returns the lead if valid, null if invalid/expired.
 */
export async function validateLeadToken(
    email: string,
    token: string
): Promise<ZohoLead | null> {
    const lead = await getLeadByEmail(email);

    if (!lead) return null;
    if (!lead.Magic_Token || lead.Magic_Token !== token) return null;

    // Check expiry
    if (lead.Token_Expiry) {
        const expiry = new Date(lead.Token_Expiry);
        if (expiry < new Date()) return null; // Expired
    }

    return lead;
}
