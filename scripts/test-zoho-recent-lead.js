const dotenv = require('dotenv');
dotenv.config();

const ZOHO_API_URL = `${process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.in'}/crm/v2`;

async function getZohoAccessToken() {
    const url = `https://accounts.zoho.in/oauth/v2/token`;
    const params = new URLSearchParams({
        refresh_token: process.env.ZOHO_REFRESH_TOKEN,
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        grant_type: "refresh_token",
    });

    const response = await fetch(url, {
        method: "POST",
        body: params,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!response.ok) {
        throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.access_token) {
        throw new Error("No access_token returned from Zoho.");
    }
    return data.access_token;
}

async function fetchRecentZohoFormLead() {
    try {
        const token = await getZohoAccessToken();
        console.log("Token obtained successfully.");

        // Fetch recent Leads from CRM WHERE Lead_Source is Form, sorted by Created_Time desc
        const url = `${ZOHO_API_URL}/Leads/search?criteria=(Lead_Source:equals:Zoho%20Form)`;
        
        const response = await fetch(url, {
            headers: {
                Authorization: `Zoho-oauthtoken ${token}`,
            },
        });

        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error("Response body:", text);
            return;
        }

        const data = await response.json();
        
        if (!data.data || data.data.length === 0) {
            // Fallback, just get the most recent ones
            console.log("No leads found with Lead_Source='Zoho Form'. Getting latest leads overall...");
            const fallbackUrl = `${ZOHO_API_URL}/Leads?sort_order=desc&sort_by=Created_Time&per_page=3`;
            const fbResponse = await fetch(fallbackUrl, {
                headers: { Authorization: `Zoho-oauthtoken ${token}` },
            });
            const fbData = await fbResponse.json();
            if (fbData.data && fbData.data.length > 0) {
                printLead(fbData.data[0]);
            } else {
                console.log("No leads found at all.");
            }
            return;
        }
        
        printLead(data.data[0]);

    } catch (err) {
        console.error("Failed to fetch leads:", err.message);
    }
}

function printLead(lead) {
    console.log("\n==============================================");
    console.log("RECENT LEAD RAW ZOHO FIELDS:");
    console.log("==============================================\n");
    
    // Specifically pull out the fields we care about
    console.log("--- KEY FIELDS ---");
    console.log(`id:               ${lead.id}`);
    console.log(`Email:            ${lead.Email}`);
    console.log(`First_Name:       ${lead.First_Name}`);
    console.log(`Last_Name:        ${lead.Last_Name}`);
    console.log(`Phone:            ${lead.Phone}  <-- NOTE: Is this empty?`);
    console.log(`Mobile:           ${lead.Mobile}  <-- NOTE: Is this empty?`);
    console.log(`Lead_Source:      ${lead.Lead_Source}`);
    console.log(`Community_Portal:`, lead.Community_Portal);
    console.log(`Community:       `, lead.Community);
    console.log(`Sub_Community:   `, lead.Sub_Community);
    console.log(`Industry:         ${lead.Industry}`);
    console.log(`Sub_Industry:     ${lead.Industry_Sub_Category}`);
    
    console.log("\n--- ALL FIELDS DUMP ---");
    console.log(JSON.stringify(lead, null, 2));
}

fetchRecentZohoFormLead();
