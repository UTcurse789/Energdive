import axios from "axios";

const BREVO_SUBSCRIBERS_LIST_ID = 7;
const BREVO_PARTIAL_ZOHO_LIST_ID = 21;

export default async function syncUserToBrevo(user: any) {
    try {
        // Safety: never push dummy/placeholder emails to Brevo
        if (!user.email || user.email.endsWith("@phone.energdive.com")) {
            console.warn("⚠️ Brevo sync skipped — dummy or missing email:", user.email);
            return;
        }

        await axios.post(
            "https://api.brevo.com/v3/contacts",
            {
                email: user.email,
                attributes: {
                    FIRSTNAME: user.first_name || "",
                    LASTNAME: user.last_name || "",
                    SALUTATION: user.salutation || "",
                    PHONE: user.phone && user.phone !== "undefined" && user.phone !== "null" ? user.phone : "",
                    ORGANISATION: user.organization || "",
                    JOB_TITLE: user.job_title || "",
                    COMMUNITY: (user.communities || []).filter((c: string) => c && c !== "undefined" && c !== "null").join(","),
                    SUB_COMMUNITY: (user.sub_communities || []).filter((c: string) => c && c !== "undefined" && c !== "null").join(","),
                    INDUSTRY: (user.industries || []).filter((c: string) => c && c !== "undefined" && c !== "null").join(","),
                    SUB_INDUSTRY: (user.sub_industries || []).filter((c: string) => c && c !== "undefined" && c !== "null").join(","),
                    FREQUENCY: ((user.preferred_frequency || "daily").charAt(0).toUpperCase() + (user.preferred_frequency || "daily").slice(1)),
                    PREFERENCE: (user.preferred_formats || []).join(", "),
                    MEMBERSHIP_ID: user.membership_id || "",
                    VERIFICATION_STATUS: user.verification_status || "",
                    SOURCE: "Portal",
                    ...(user.utm_source ? { UTM_SOURCE: user.utm_source } : {}),
                    ...(user.utm_medium ? { UTM_MEDIUM: user.utm_medium } : {}),
                    ...(user.utm_campaign ? { UTM_CAMPAIGN: user.utm_campaign } : {}),
                    ...(user.utm_term ? { UTM_TERM: user.utm_term } : {}),
                    ...(user.utm_content ? { UTM_CONTENT: user.utm_content } : {}),
                },
                listIds: [BREVO_SUBSCRIBERS_LIST_ID],
                unlinkListIds: [BREVO_PARTIAL_ZOHO_LIST_ID],
                updateEnabled: true
            },
            {
                headers: {
                    "api-key": process.env.BREVO_API_KEY!,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("✅ Brevo synced:", user.email);
    } catch (err: any) {
        console.error("❌ Brevo sync failed:", err.response?.data || err.message);
    }
}

// ── Verified User Sync (with membership_id) ───────────────────────────────────

export interface VerifiedUserBrevoPayload {
    email: string;
    name?: string;
    salutation?: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    membershipId?: string;
    source?: string;
    communities?: string[];
    subCommunities?: string[];
    industries?: string[];
    subIndustries?: string[];
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
    utm_term?: string | null;
    utm_content?: string | null;
    preferredFrequency?: string | null;
}

export interface PartialZohoBrevoPayload {
    email: string;
    name?: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    communities?: string[];
    subCommunities?: string[];
    industry?: string;
}

/**
 * Add a Zoho-form lead to Brevo's Partial Zoho list while it is still
 * completing registration. Verification moves the contact to Subscribers.
 */
export async function syncPartialZohoLeadToBrevo(user: PartialZohoBrevoPayload): Promise<void> {
    const email = user.email.trim().toLowerCase();
    if (!email || email.endsWith("@phone.energdive.com")) {
        console.warn("Brevo partial-Zoho sync skipped — invalid email:", user.email);
        return;
    }

    const client = (await import("axios")).default;
    try {
        const existing = await client.get(
            `https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`,
            { headers: { "api-key": process.env.BREVO_API_KEY! } }
        );
        const listIds = Array.isArray(existing.data?.listIds) ? existing.data.listIds : [];
        if (listIds.includes(BREVO_SUBSCRIBERS_LIST_ID)) {
            console.log("Brevo partial-Zoho sync skipped — contact is already a Subscriber:", email);
            return;
        }
    } catch (error: any) {
        if (error.response?.status !== 404) {
            throw error;
        }
    }

    const nameParts = (user.name || "").trim().split(/\s+/);
    const attributes: Record<string, string> = {
        FIRSTNAME: nameParts[0] || "",
        LASTNAME: nameParts.slice(1).join(" "),
        PHONE: user.phone || "",
        ORGANISATION: user.company || "",
        JOB_TITLE: user.jobTitle || "",
        COMMUNITY: (user.communities || []).filter(Boolean).join(","),
        SUB_COMMUNITY: (user.subCommunities || []).filter(Boolean).join(","),
        INDUSTRY: user.industry || "",
        SOURCE: "Zoho Form",
        VERIFICATION_STATUS: "Pending profile completion",
    };

    await client.post(
        "https://api.brevo.com/v3/contacts",
        {
            email,
            attributes,
            listIds: [BREVO_PARTIAL_ZOHO_LIST_ID],
            updateEnabled: true,
        },
        {
            headers: {
                "api-key": process.env.BREVO_API_KEY!,
                "Content-Type": "application/json",
            },
        }
    );

    console.log("Brevo partial Zoho lead synced:", email);
}

/**
 * Sync a newly verified user to Brevo contacts list.
 * Stores the MEMBERSHIP_ID as a Brevo contact attribute so it's
 * available in email campaigns and automations.
 */
export async function syncVerifiedUserToBrevo(user: VerifiedUserBrevoPayload): Promise<void> {
    if (!user.email || user.email.endsWith("@phone.energdive.com")) {
        console.warn("⚠️ Brevo sync skipped — invalid email:", user.email);
        return;
    }

    const nameParts = (user.name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const axios = (await import("axios")).default;

    const attributes: Record<string, string> = {
        FIRSTNAME: firstName,
        LASTNAME: lastName,
        SALUTATION: user.salutation || "",
        PHONE: user.phone && user.phone !== "undefined" && user.phone !== "null" ? user.phone : "",
        ORGANISATION: user.company || "",
        MEMBERSHIP_ID: user.membershipId || "",
        SOURCE: user.source || "website",
        VERIFICATION_STATUS: "Verified",
        FREQUENCY: user.preferredFrequency
            ? `${user.preferredFrequency.charAt(0).toUpperCase()}${user.preferredFrequency.slice(1).toLowerCase()}`
            : "Daily",
    };

    // Include optional fields if provided (from Zoho lead data)
    if (user.jobTitle && user.jobTitle !== "undefined") attributes.JOB_TITLE = user.jobTitle;
    if (user.communities?.length) {
        const valid = user.communities.filter(c => c && c !== "undefined" && c !== "null");
        if (valid.length) attributes.COMMUNITY = valid.join(",");
    }
    if (user.subCommunities?.length) {
        const valid = user.subCommunities.filter(c => c && c !== "undefined" && c !== "null");
        if (valid.length) attributes.SUB_COMMUNITY = valid.join(",");
    }
    if (user.industries?.length) {
        const valid = user.industries.filter(c => c && c !== "undefined" && c !== "null");
        if (valid.length) attributes.INDUSTRY = valid.join(",");
    }
    if (user.subIndustries?.length) {
        const valid = user.subIndustries.filter(c => c && c !== "undefined" && c !== "null");
        if (valid.length) attributes.SUB_INDUSTRY = valid.join(",");
    }

    if (user.utm_source) attributes.UTM_SOURCE = user.utm_source;
    if (user.utm_medium) attributes.UTM_MEDIUM = user.utm_medium;
    if (user.utm_campaign) attributes.UTM_CAMPAIGN = user.utm_campaign;
    if (user.utm_term) attributes.UTM_TERM = user.utm_term;
    if (user.utm_content) attributes.UTM_CONTENT = user.utm_content;

    await axios.post(
        "https://api.brevo.com/v3/contacts",
        {
            email: user.email,
            attributes,
            listIds: [BREVO_SUBSCRIBERS_LIST_ID],
            unlinkListIds: [BREVO_PARTIAL_ZOHO_LIST_ID],
            updateEnabled: true,
        },
        {
            headers: {
                "api-key": process.env.BREVO_API_KEY!,
                "Content-Type": "application/json",
            },
        }
    );

    console.log("✅ Brevo verified user synced:", user.email, "membership:", user.membershipId);
}

/**
 * Fetch a contact's details from Brevo.
 * This is used to pull enriched data (e.g., COMMUNITY, SUB_COMMUNITY)
 * before posting to Zoho CRM.
 */
export async function getBrevoContact(email: string): Promise<Record<string, any> | null> {
    if (!email || email.endsWith("@phone.energdive.com")) {
        return null;
    }

    try {
        const axios = (await import("axios")).default;
        const response = await axios.get(
            `https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`,
            {
                headers: {
                    "api-key": process.env.BREVO_API_KEY!,
                },
            }
        );
        return response.data?.attributes || null;
    } catch (err: any) {
        if (err.response?.status === 404) {
            return null; // Contact doesn't exist
        }
        console.error("❌ Failed to fetch Brevo contact:", err.response?.data || err.message);
        return null;
    }
}
