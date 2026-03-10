import { getZohoAccessToken } from "./zoho";

const ZOHO_API_URL = `${process.env.ZOHO_API_DOMAIN || "https://www.zohoapis.in"}/crm/v2`;

export interface ZohoLeadData {
    First_Name: string;
    Last_Name: string;
    Email: string;
    Phone?: string;
    Company?: string;
    Designation?: string;
    Lead_Source?: string;
    Industry?: string;
    Sub_Industry?: string;
    Community?: string[];
    Sub_Community?: string[];
    Query_Type?: string;
}

/**
 * Search for an existing Lead by email.
 * Returns the first matching Lead record, or null if none found.
 */
export async function searchLeadByEmail(email: string): Promise<any | null> {
    const token = await getZohoAccessToken();

    const searchUrl = `${ZOHO_API_URL}/Leads/search?email=${encodeURIComponent(email)}`;
    const response = await fetch(searchUrl, {
        headers: {
            Authorization: `Zoho-oauthtoken ${token}`,
        },
    });

    if (!response.ok) {
        if (response.status === 204) return null;
        const errorBody = await response.text();
        console.error(`[ZOHO_LEADS] Lead search failed - Status: ${response.status}, URL: ${searchUrl}, Body: ${errorBody}`);
        throw new Error("Failed to search Lead in Zoho CRM");
    }

    if (response.status === 204) return null;

    const text = await response.text();
    if (!text) return null;

    try {
        const data = JSON.parse(text);
        if (!data.data || data.data.length === 0) {
            return null;
        }
        return data.data[0];
    } catch (err) {
        console.error(`[ZOHO_LEADS] JSON parse failed for search API. Response text:`, text);
        return null;
    }
}

/**
 * Upserts a Zoho CRM Lead: searches by email first. Updates if found, creates if not.
 * Includes exponential backoff for rate limits (429) or server errors (5xx).
 */
export async function upsertZohoLead(
    leadData: ZohoLeadData,
    attempt: number = 1
): Promise<{ id: string; action: "created" | "updated" }> {
    const MAX_RETRIES = 3;

    try {
        // 1. Check if lead exists to avoid duplicates
        const existingLead = await searchLeadByEmail(leadData.Email);

        const token = await getZohoAccessToken();

        // 2. Prepare payload
        const payload = {
            data: [
                {
                    ...leadData,
                    ...(existingLead ? { id: existingLead.id } : {}),
                },
            ],
        };

        const method = existingLead ? "PUT" : "POST";
        const url = `${ZOHO_API_URL}/Leads`;

        const bodyStr = JSON.stringify(payload);
        console.log(`[ZOHO_LEADS] ${method} ${url} — Body:`, bodyStr);

        // 3. Send request
        const response = await fetch(url, {
            method,
            headers: {
                Authorization: `Zoho-oauthtoken ${token}`,
                "Content-Type": "application/json",
            },
            body: bodyStr,
        });

        if (!response.ok) {
            const errorBody = await response.text();

            // Handle rate limiting (429) or server errors (5xx)
            if ((response.status === 429 || response.status >= 500) && attempt < MAX_RETRIES) {
                console.warn(`[ZOHO_LEADS] Rate limit or server error (Status: ${response.status}). Retrying attempt ${attempt + 1}/${MAX_RETRIES}...`);
                const backoff = (Math.pow(2, attempt) * 1000) + Math.floor(Math.random() * 500);
                await new Promise(resolve => setTimeout(resolve, backoff));
                return upsertZohoLead(leadData, attempt + 1);
            }

            console.error(`[ZOHO_LEADS] Failed to upsert lead: ${errorBody}`);
            throw new Error(`Failed to upsert Zoho Lead: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        let data: any;
        try {
            data = text ? JSON.parse(text) : {};
        } catch (err) {
            console.error(`[ZOHO_LEADS] JSON parse failed for upsert API. Response text:`, text);
            throw new Error("API returned invalid JSON");
        }

        // 4. Handle success response
        console.log(`[ZOHO_LEADS] Full Zoho API response:`, text);
        if (data.data && data.data[0] && data.data[0].code === "SUCCESS") {
            return {
                id: data.data[0].details.id,
                action: existingLead ? "updated" : "created",
            };
        } else {
            console.error(`[ZOHO_LEADS] API returned error inside body:`, JSON.stringify(data));
            throw new Error("API returned error inside Zoho response body");
        }
    } catch (error) {
        if (attempt < MAX_RETRIES) {
            console.warn(`[ZOHO_LEADS] Request failed. Retrying attempt ${attempt + 1}/${MAX_RETRIES}... Error: ${error}`);
            const backoff = (Math.pow(2, attempt) * 1000) + Math.floor(Math.random() * 500);
            await new Promise(resolve => setTimeout(resolve, backoff));
            return upsertZohoLead(leadData, attempt + 1);
        }
        throw error;
    }
}
