import axios from "axios";

export default async function syncUserToBrevo(user: any) {
    try {
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
                    COMMUNITY: user.community || "",
                    SUB_COMMUNITY: user.sub_community || "",
                    INDUSTRY: user.industry || "",
                    SUB_INDUSTRY: user.sub_industry || "",
                    SOURCE: "Portal"
                },
                updateEnabled: true
            },
            {
                headers: {
                    "api-key": process.env.BREVO_API_KEY!,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("Brevo synced:", user.email);
    } catch (err: any) {
        console.error("Brevo sync failed:", err.response?.data || err.message);
    }
}