import axios from "axios";

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
                    PHONE: user.phone || "",
                    ORGANISATION: user.organization || "",
                    JOB_TITLE: user.job_title || "",
                    COMMUNITY: (user.communities || []).join(","),
                    SUB_COMMUNITY: (user.sub_communities || []).join(","),
                    INDUSTRY: (user.industries || []).join(","),
                    SUB_INDUSTRY: (user.sub_industries || []).join(","),
                    FREQUENCY: ((user.preferred_frequency || "daily").charAt(0).toUpperCase() + (user.preferred_frequency || "daily").slice(1)),
                    PREFERENCE: (user.preferred_formats || []).join(", "),
                    MEMBERSHIP_ID: user.membership_id || "",
                    VERIFICATION_STATUS: user.verification_status || "",
                    SOURCE: "Portal"
                },
                listIds: [7],
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
    phone?: string;
    company?: string;
    jobTitle?: string;
    membershipId?: string;
    source?: string;
    communities?: string[];
    subCommunities?: string[];
    industries?: string[];
    subIndustries?: string[];
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
        PHONE: user.phone || "",
        ORGANISATION: user.company || "",
        MEMBERSHIP_ID: user.membershipId || "",
        SOURCE: user.source || "website",
        VERIFICATION_STATUS: "Verified",
    };

    // Include optional fields if provided (from Zoho lead data)
    if (user.jobTitle) attributes.JOB_TITLE = user.jobTitle;
    if (user.communities?.length) attributes.COMMUNITY = user.communities.join(",");
    if (user.subCommunities?.length) attributes.SUB_COMMUNITY = user.subCommunities.join(",");
    if (user.industries?.length) attributes.INDUSTRY = user.industries.join(",");
    if (user.subIndustries?.length) attributes.SUB_INDUSTRY = user.subIndustries.join(",");

    await axios.post(
        "https://api.brevo.com/v3/contacts",
        {
            email: user.email,
            attributes,
            listIds: [7],
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