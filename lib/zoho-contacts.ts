import { getZohoAccessToken } from "./zoho";

const ZOHO_API_URL = `${process.env.ZOHO_API_DOMAIN || "https://www.zohoapis.in"}/crm/v2`;

export interface ZohoContactData {
    First_Name: string;
    Last_Name: string;
    Email: string;
    Phone?: string;
    Company?: string;
    Lead_Source?: string;
    Industry_Category?: string;
    Industry_Sub_Category?: string;
    Community?: string[];
    SubCommunity?: string[];
    Query_Type?: string;
}

/**
 * Fetch a Contact by Email to check if it already exists
 */
export async function searchContactByEmail(email: string): Promise<any | null> {
    const token = await getZohoAccessToken();

    // Search for contact by email
    const searchUrl = `${ZOHO_API_URL}/Contacts/search?email=${encodeURIComponent(email)}`;
    const response = await fetch(searchUrl, {
        headers: {
            Authorization: `Zoho-oauthtoken ${token}`,
        },
    });

    if (!response.ok) {
        if (response.status === 204) return null; // No content found
        const errorBody = await response.text();
        console.error(`[ZOHO_CONTACTS] Contact search failed - Status: ${response.status}, URL: ${searchUrl}, Body: ${errorBody}`);
        throw new Error("Failed to fetch contact from Zoho CRM");
    }

    if (response.status === 204) return null;

    const text = await response.text();
    if (!text) return null;

    try {
        const data = JSON.parse(text);
        if (!data.data || data.data.length === 0) {
            return null;
        }
        return data.data[0]; // Return the first matching contact
    } catch (err) {
        console.error(`[ZOHO_CONTACTS] JSON parse failed for search API. Response text:`, text);
        return null; // Safe fallback
    }
}

/**
 * Upserts a Zoho CRM Contact: Searches by email. Updates if found, creates if not.
 * Includes exponential backoff for rate limits or server errors.
 */
export async function upsertZohoContact(
    contactData: ZohoContactData,
    attempt: number = 1
): Promise<{ id: string; action: "created" | "updated" }> {
    const MAX_RETRIES = 3;

    try {
        // 1. Check if contact exists to avoid duplicates
        const existingContact = await searchContactByEmail(contactData.Email);

        const token = await getZohoAccessToken();

        // 2. Prepare payload
        const payload = {
            data: [
                {
                    ...contactData,
                    // If existing, pass the id to perform an update
                    ...(existingContact ? { id: existingContact.id } : {})
                }
            ]
        };

        const method = existingContact ? "PUT" : "POST";
        const url = `${ZOHO_API_URL}/Contacts`;

        const bodyStr = JSON.stringify(payload);
        console.log(`[ZOHO_CONTACTS] ${method} ${url} — Body:`, bodyStr);

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
                console.warn(`[ZOHO_CONTACTS] Rate limit or server error (Status: ${response.status}). Retrying attempt ${attempt + 1}/${MAX_RETRIES}...`);
                // Exponential backoff with jitter: 2s, 4s, 8s + random ms
                const backoff = (Math.pow(2, attempt) * 1000) + Math.floor(Math.random() * 500);
                await new Promise(resolve => setTimeout(resolve, backoff));
                return upsertZohoContact(contactData, attempt + 1);
            }

            console.error(`[ZOHO_CONTACTS] Failed to upsert contact: ${errorBody}`);
            throw new Error(`Failed to upsert Zoho Contact: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        let data: any;
        try {
            data = text ? JSON.parse(text) : {};
        } catch (err) {
            console.error(`[ZOHO_CONTACTS] JSON parse failed for upsert API. Response text:`, text);
            throw new Error("API returned invalid JSON");
        }

        // 4. Handle success response from Zoho
        console.log(`[ZOHO_CONTACTS] Full Zoho API response:`, text);
        if (data.data && data.data[0] && data.data[0].code === "SUCCESS") {
            return {
                id: data.data[0].details.id,
                action: existingContact ? "updated" : "created"
            };
        } else {
            console.error(`[ZOHO_CONTACTS] API returned error inside body:`, JSON.stringify(data));
            throw new Error("API returned error inside Zoho response body");
        }
    } catch (error) {
        if (attempt < MAX_RETRIES) {
            console.warn(`[ZOHO_CONTACTS] Request failed. Retrying attempt ${attempt + 1}/${MAX_RETRIES}... Error: ${error}`);
            const backoff = (Math.pow(2, attempt) * 1000) + Math.floor(Math.random() * 500);
            await new Promise(resolve => setTimeout(resolve, backoff));
            return upsertZohoContact(contactData, attempt + 1);
        }
        throw error;
    }
}
