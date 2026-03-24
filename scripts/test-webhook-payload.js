const dotenv = require('dotenv');
dotenv.config();

async function simulateWebhook() {
    const payload = {
        email: "test.community.portal@example.com",
        name: "Test User",
        Mobile: "+911234567890", // Testing the new capitalized field
        company: "Test Corp",
        crm_lead_id: "651593000012345678",
        community_portal: "Oil & Gas-Upstream;Power Generation-Solar",
        job_title: "Engineer"
    };

    console.log("Sending payload:", payload);

    try {
        const res = await fetch('http://localhost:3000/api/leads/zoho-webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-webhook-secret': process.env.ZOHO_FORM_WEBHOOK_SECRET
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        console.log("Response status:", res.status);
        console.log("Response body:", data);
        
    } catch(e) {
        console.error("Fetch error:", e.message);
    }
}

simulateWebhook();
