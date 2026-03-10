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