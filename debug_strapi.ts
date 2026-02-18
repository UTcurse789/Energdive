// import fetch from 'node-fetch'; // fetch is global in Node 18+

const STRAPI_BASE_URL = "http://206.189.132.187:1337";

async function checkStructure() {
    // Fetch one news item to see the keys
    const url = `${STRAPI_BASE_URL}/api/contents?filters[type_of_content][name][$eq]=News&populate=*&pagination[limit]=1`;
    console.log("Fetching:", url);
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
        console.log("Keys available:", Object.keys(item));
        if (item.attributes) {
            console.log("Attributes:", Object.keys(item.attributes));
        }
        console.log("Full Item:", JSON.stringify(item, null, 2));
    } else {
        console.log("No data found");
    }
}

checkStructure();
