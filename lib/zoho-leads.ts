import { getZohoAccessToken } from "./zoho";

const ZOHO_API_URL = `${process.env.ZOHO_API_DOMAIN || "https://www.zohoapis.in"}/crm/v2`;

export interface ZohoLeadData {
    First_Name: string;
    Last_Name: string;
    Email: string;
    Phone?: string;
    Mobile?: string;
    Company?: string;
    Designation?: string;
    Lead_Source?: string;
    Industry?: string;
    Industry_Sub_Category?: string;
    Community?: string[];
    Sub_Community?: string[];
    Community_Portal?: string[];
    Invite_Source?: string;
    City?: string;
    Country?: string;
}

/**
 * Parse community_portal values (e.g. "Oil & Gas-Upstream") into
 * Community (before first hyphen) and Sub_Community (after first hyphen).
 * Also keeps the original community_portal values intact.
 */
export function parseCommunityPortal(portalValues: string[]): {
    communities: string[];
    subCommunities: string[];
} {
    const communitySet = new Set<string>();
    const subCommunitySet = new Set<string>();

    for (const value of portalValues) {
        const trimmed = value.trim();
        if (!trimmed) continue;

        const hyphenIndex = trimmed.indexOf("-");
        if (hyphenIndex > 0) {
            const community = trimmed.substring(0, hyphenIndex).trim();
            const subCommunity = trimmed.substring(hyphenIndex + 1).trim();
            if (community) communitySet.add(community);
            if (subCommunity) subCommunitySet.add(subCommunity);
        } else {
            // No hyphen — treat the whole value as a community
            communitySet.add(trimmed);
        }
    }

    return {
        communities: Array.from(communitySet),
        subCommunities: Array.from(subCommunitySet),
    };
}

/**
 * Reverse mapping: combine Community + Sub_Community arrays into
 * Community_Portal values (e.g. "Oil & Gas" + "Upstream" → "Oil & Gas-Upstream").
 * Pairs each community with each sub-community to create all combinations.
 */
export function generateCommunityPortal(
    communities: string[],
    subCommunities: string[]
): string[] {
    if (!communities.length || !subCommunities.length) return [];

    const portalValues: string[] = [];
    for (const comm of communities) {
        for (const sub of subCommunities) {
            portalValues.push(`${comm.trim()}-${sub.trim()}`);
        }
    }
    return portalValues;
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

        // 2. Bidirectional Community_Portal ↔ Community/Sub_Community
        const enrichedData = { ...leadData };

        // Forward: Zoho Form → parse Community_Portal into Community + Sub_Community
        if (enrichedData.Community_Portal && enrichedData.Community_Portal.length > 0) {
            const parsed = parseCommunityPortal(enrichedData.Community_Portal);
            if (parsed.communities.length > 0) {
                enrichedData.Community = parsed.communities;
            }
            if (parsed.subCommunities.length > 0) {
                enrichedData.Sub_Community = parsed.subCommunities;
            }
        }

        // Reverse: Website → generate Community_Portal from Community + Sub_Community
        if (
            (!enrichedData.Community_Portal || enrichedData.Community_Portal.length === 0) &&
            enrichedData.Community && enrichedData.Community.length > 0 &&
            enrichedData.Sub_Community && enrichedData.Sub_Community.length > 0
        ) {
            enrichedData.Community_Portal = generateCommunityPortal(
                enrichedData.Community,
                enrichedData.Sub_Community
            );
        }

        // 3. Convert fields to match Zoho CRM field types:
        //    - Community, Sub_Community, Community_Portal → all "jsonarray" (multi-select picklist)
        const toZohoArray = (arr?: string[]): string[] | null => {
            if (!arr || arr.length === 0) return null;
            return arr.filter(v => v);
        };

        const zohoRecord: Record<string, any> = {
            First_Name: enrichedData.First_Name,
            Last_Name: enrichedData.Last_Name,
            Email: enrichedData.Email,
            Phone: enrichedData.Phone || null,
            Mobile: enrichedData.Mobile || enrichedData.Phone || null,
            Company: enrichedData.Company || null,
            Designation: enrichedData.Designation || null,
            Lead_Source: enrichedData.Lead_Source || null,
            Industry: enrichedData.Industry || null,
            Industry_Sub_Category: enrichedData.Industry_Sub_Category || null,
            Community: toZohoArray(enrichedData.Community),
            Sub_Community: toZohoArray(enrichedData.Sub_Community),
            Community_Portal: toZohoArray(enrichedData.Community_Portal),
            Invite_Source: enrichedData.Invite_Source || null,
            City: enrichedData.City || null,
            Country: enrichedData.Country || null,
        };

        // Remove null/undefined fields so we don't overwrite with blanks on UPDATE
        if (existingLead) {
            for (const key of Object.keys(zohoRecord)) {
                if (zohoRecord[key] === null || zohoRecord[key] === undefined) {
                    delete zohoRecord[key];
                }
            }
        }

        // 4. Prepare payload
        const payload = {
            data: [
                {
                    ...zohoRecord,
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

/**
 * Creates a NEW Zoho CRM Lead every time (no dedup/upsert).
 * Includes Community_Portal → Community + Sub_Community splitting.
 * Used for Zoho Form submissions where each form submission = new lead.
 */
export async function createZohoLead(
    leadData: ZohoLeadData,
    attempt: number = 1
): Promise<{ id: string; action: "created" }> {
    const MAX_RETRIES = 3;

    try {
        const token = await getZohoAccessToken();

        // 1. Bidirectional Community_Portal ↔ Community/Sub_Community
        const enrichedData = { ...leadData };

        // Forward: parse Community_Portal into Community + Sub_Community
        if (enrichedData.Community_Portal && enrichedData.Community_Portal.length > 0) {
            const parsed = parseCommunityPortal(enrichedData.Community_Portal);
            if (parsed.communities.length > 0) {
                enrichedData.Community = parsed.communities;
            }
            if (parsed.subCommunities.length > 0) {
                enrichedData.Sub_Community = parsed.subCommunities;
            }
        }

        // Reverse: generate Community_Portal from Community + Sub_Community
        if (
            (!enrichedData.Community_Portal || enrichedData.Community_Portal.length === 0) &&
            enrichedData.Community && enrichedData.Community.length > 0 &&
            enrichedData.Sub_Community && enrichedData.Sub_Community.length > 0
        ) {
            enrichedData.Community_Portal = generateCommunityPortal(
                enrichedData.Community,
                enrichedData.Sub_Community
            );
        }

        // 2. Convert fields to match Zoho CRM field types
        const toZohoArray = (arr?: string[]): string[] | null => {
            if (!arr || arr.length === 0) return null;
            return arr.filter(v => v);
        };

        const zohoRecord: Record<string, any> = {
            First_Name: enrichedData.First_Name,
            Last_Name: enrichedData.Last_Name,
            Email: enrichedData.Email,
            Phone: enrichedData.Phone || null,
            Company: enrichedData.Company || null,
            Designation: enrichedData.Designation || null,
            Lead_Source: enrichedData.Lead_Source || null,
            Industry: enrichedData.Industry || null,
            Industry_Sub_Category: enrichedData.Industry_Sub_Category || null,
            Community: toZohoArray(enrichedData.Community),
            Sub_Community: toZohoArray(enrichedData.Sub_Community),
            Community_Portal: toZohoArray(enrichedData.Community_Portal),
            Invite_Source: enrichedData.Invite_Source || null,
            City: enrichedData.City || null,
            Country: enrichedData.Country || null,
        };

        // 3. Always POST (create new lead)
        const payload = { data: [zohoRecord] };
        const url = `${ZOHO_API_URL}/Leads`;
        const bodyStr = JSON.stringify(payload);

        console.log(`[ZOHO_LEADS] POST (create new) ${url} — Body:`, bodyStr);

        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Zoho-oauthtoken ${token}`,
                "Content-Type": "application/json",
            },
            body: bodyStr,
        });

        if (!response.ok) {
            const errorBody = await response.text();

            if ((response.status === 429 || response.status >= 500) && attempt < MAX_RETRIES) {
                console.warn(`[ZOHO_LEADS] Rate limit or server error (Status: ${response.status}). Retrying attempt ${attempt + 1}/${MAX_RETRIES}...`);
                const backoff = (Math.pow(2, attempt) * 1000) + Math.floor(Math.random() * 500);
                await new Promise(resolve => setTimeout(resolve, backoff));
                return createZohoLead(leadData, attempt + 1);
            }

            console.error(`[ZOHO_LEADS] Failed to create lead: ${errorBody}`);
            throw new Error(`Failed to create Zoho Lead: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        let data: any;
        try {
            data = text ? JSON.parse(text) : {};
        } catch (err) {
            console.error(`[ZOHO_LEADS] JSON parse failed for create API. Response text:`, text);
            throw new Error("API returned invalid JSON");
        }

        console.log(`[ZOHO_LEADS] Full Zoho API response:`, text);
        if (data.data && data.data[0] && data.data[0].code === "SUCCESS") {
            return {
                id: data.data[0].details.id,
                action: "created",
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
            return createZohoLead(leadData, attempt + 1);
        }
        throw error;
    }
}

// ── Double Opt-In: Create Duplicate Lead (ITEN MEDIA owner) ──────────────────

export interface DuplicateLeadPayload {
    email: string;
    name?: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    industry?: string;
    subIndustry?: string;
    source?: string;
    frequency?: string;
    originalLeadId?: string;
    membershipId?: string;
    communities?: string[];
    subCommunities?: string[];
}

/**
 * Creates the ITEN MEDIA duplicate lead in Zoho CRM.
 * Called ONLY after successful double opt-in verification.
 * Sets Lead_Source to "Portal Verified" and stores the membership_id.
 */
export async function createZohoDuplicateLead(
    payload: DuplicateLeadPayload,
    attempt: number = 1
): Promise<string | null> {
    const MAX_RETRIES = 3;
    const ITEN_MEDIA_OWNER = process.env.ZOHO_ITEN_MEDIA_OWNER_ID || "";

    try {
        const token = await getZohoAccessToken();

        const nameParts = (payload.name || "").trim().split(/\s+/);
        const firstName = nameParts[0] || "Member";
        const lastName = nameParts.slice(1).join(" ") || ".";

        // Generate Community_Portal from communities + subCommunities
        const communityPortalValues = (payload.communities?.length && payload.subCommunities?.length)
            ? generateCommunityPortal(payload.communities, payload.subCommunities)
            : [];

        const zohoRecord: Record<string, any> = {
            First_Name: firstName,
            Last_Name: lastName,
            Email: payload.email,
            Phone: payload.phone || null,
            Company: payload.company || null,
            Designation: payload.jobTitle || null,
            Lead_Source: "Portal",
            Industry: payload.industry || null,
            Industry_Sub_Category: payload.subIndustry || null,
            Community: payload.communities?.length ? payload.communities : null,
            Sub_Community: payload.subCommunities?.length ? payload.subCommunities : null,
            Community_Portal: communityPortalValues.length > 0 ? communityPortalValues : null,
            Membership_ID: payload.membershipId || null,
            Frequency: payload.frequency || "Daily",
            Description: [
                payload.membershipId ? `Membership ID: ${payload.membershipId}` : "",
                payload.originalLeadId ? `Original Lead ID: ${payload.originalLeadId}` : "",
                `Source: ${payload.source || "website"}`,
                "Verification: Double Opt-In Verified",
            ].filter(Boolean).join("\n"),
            ...(ITEN_MEDIA_OWNER ? { Owner: { id: ITEN_MEDIA_OWNER } } : {}),
        };

        const url = `${ZOHO_API_URL}/Leads`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Zoho-oauthtoken ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ data: [zohoRecord] }),
        });

        if (!response.ok) {
            if ((response.status === 429 || response.status >= 500) && attempt < MAX_RETRIES) {
                const backoff = Math.pow(2, attempt) * 1000 + Math.random() * 500;
                await new Promise((r) => setTimeout(r, backoff));
                return createZohoDuplicateLead(payload, attempt + 1);
            }
            const err = await response.text();
            throw new Error(`Zoho duplicate lead failed: ${response.status} ${err}`);
        }

        const data = await response.json();
        if (data.data?.[0]?.code === "SUCCESS") {
            const leadId = data.data[0].details.id;
            console.log(`[ZOHO_LEADS] Duplicate lead created: ${leadId} for ${payload.email}`);
            return leadId;
        }

        throw new Error("Zoho API returned non-SUCCESS: " + JSON.stringify(data));
    } catch (error) {
        if (attempt < MAX_RETRIES) {
            const backoff = Math.pow(2, attempt) * 1000 + Math.random() * 500;
            await new Promise((r) => setTimeout(r, backoff));
            return createZohoDuplicateLead(payload, attempt + 1);
        }
        console.error("[ZOHO_LEADS] createZohoDuplicateLead failed after retries:", error);
        throw error;
    }
}
