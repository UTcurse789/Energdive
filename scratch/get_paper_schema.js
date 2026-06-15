require('dotenv').config();

const STRAPI_BASE_URL = process.env.STRAPI_API_URL || "https://cms-staging.energdive.com";

async function run() {
    const url = `${STRAPI_BASE_URL}/api/paper-submissions?populate=*&pagination[pageSize]=5`;
    console.log("Querying Strapi paper-submissions:", url);
    const headers = {};
    if (process.env.STRAPI_API_TOKEN) {
        headers.authorization = `Bearer ${process.env.STRAPI_API_TOKEN}`;
    } else {
        console.log("Warning: STRAPI_API_TOKEN is not defined in environment.");
    }
    const res = await fetch(url, { headers });
    if (!res.ok) {
        console.error("Failed to query Strapi:", res.status, await res.text());
        return;
    }
    const json = await res.json();
    console.log("Successfully fetched entries.");
    if (json.data && json.data.length > 0) {
        for (const item of json.data) {
            const attrs = item.attributes || item;
            console.log("ID:", item.id);
            console.log("Title:", attrs.title);
            console.log("Keys in entry attributes:", Object.keys(attrs));
            console.log("institution value:", attrs.institution);
            console.log("affiliation value:", attrs.affiliation);
            console.log("------------------------");
        }
    } else {
        console.log("No paper submissions found in Strapi.");
    }
}

run();
