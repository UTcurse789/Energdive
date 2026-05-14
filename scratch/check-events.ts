// No import needed as fetch is global in Node 18+

const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

async function checkEvents() {
    const url = new URL(`${STRAPI_BASE}/api/events`);
    url.searchParams.set("pagination[pageSize]", "10");
    url.searchParams.set("sort[0]", "createdAt:desc");
    
    try {
        const res = await fetch(url.toString());
        const json = await res.json();
        
        console.log("Events:");
        for (const event of json.data || []) {
            console.log(`- Title: ${event.title}`);
            console.log(`  Date: ${event.date}`);
            console.log(`  Occurrence: ${event.occurrence}`);
        }
    } catch (e) {
        console.error(e);
    }
}
checkEvents();
