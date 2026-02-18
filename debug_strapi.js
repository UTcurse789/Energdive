const STRAPI_BASE_URL = "http://206.189.132.187:1337";

const fs = require('fs');

async function checkStructure() {
    // Fetch one news item to see the keys
    const url = `${STRAPI_BASE_URL}/api/contents?filters[type_of_content][name][$eq]=News&populate=*&pagination[limit]=1`;
    console.log("Fetching:", url);
    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.error("Error:", res.status, res.statusText);
            const text = await res.text();
            console.error(text);
            return;
        }
        const json = await res.json();
        if (json.data && json.data.length > 0) {
            const item = json.data[0];
            const output = {
                keys: Object.keys(item),
                full_item: item
            };
            fs.writeFileSync('c:/energdive/debug_output.json', JSON.stringify(output, null, 2), 'utf8');
            console.log("Output written to c:/energdive/debug_output.json");
        } else {
            console.log("No data found");
        }
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

checkStructure();
