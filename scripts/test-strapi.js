require('dotenv').config();
const qs = require('qs');

const STRAPI_URL = process.env.STRAPI_API_URL;
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

async function testStrapi() {
    console.log(`Testing Strapi Connection to: ${STRAPI_URL}`);

    if (!STRAPI_TOKEN) {
        console.error("❌ STRAPI_API_TOKEN is missing!");
        return;
    }

    try {
        const url = `${STRAPI_URL}/api/contents?populate=*`;
        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${STRAPI_TOKEN}`,
            },
        });

        if (res.ok) {
            const json = await res.json();
            console.log("✅ Custom Content Fetch Success:", json.meta?.pagination);
            if (json.data.length > 0) {
                console.log("First item title:", json.data[0].attributes.title);
            } else {
                console.log("⚠️ No content found.");
            }
        } else {
            console.error(`❌ Fetch Failed: ${res.status} ${res.statusText}`);
            const text = await res.text();
            console.error("Response:", text);
        }
    } catch (error) {
        console.error("❌ Network Error:", error.message);
    }
}

testStrapi();
