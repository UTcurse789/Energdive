import { getZohoAccessToken } from "./lib/zoho";

const ZOHO_API_URL = `${process.env.ZOHO_API_DOMAIN || "https://www.zohoapis.in"}/crm/v2`;

async function fetchRecentZohoFormLead() {
    try {
        const token = await getZohoAccessToken();
        console.log("Token obtained successfully.");

        // Fetch recent Leads from CRM, sorted by Created_Time desc
        const url = `${ZOHO_API_URL}/Leads?sort_order=desc&sort_by=Created_Time&per_page=3`;
        
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
            console.log("No leads found in CRM.");
            return;
        }

        console.log("\n==============================================");
        console.log("RECENT LEAD RAW ZOHO FIELDS:");
        console.log("==============================================\n");
        
        // Print the first lead beautifully
        const lead = data.data[0];
        
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
        
        console.log("\n--- ALL FIELDS DUMP ---");
        console.log(JSON.stringify(lead, null, 2));

    } catch (err: any) {
        console.error("Failed to fetch leads:", err.message);
    }
}

fetchRecentZohoFormLead();
