const STRAPI_BASE = "https://cms-staging.energdive.com";
const STRAPI_TOKEN = "63decce1905ce008ad4976760a5fa9c86a757f9e09239aea95f6452876c0a072fd9c6e8b3865cd39d5bea3754557d1dddc903e8d4ef4c5d529ac9b323e760a22d1a512d5ffe0e31289b43ea7a3aa5803aa45602b3b2336c44af96ddf5c12f767d5b21dda526a20eb2252d184f9bcaeaa566bee713d89f3803522be0179c33f5e";

async function getTypes() {
    const url = `${STRAPI_BASE}/api/resoucre-centers?fields[0]=resource_type&pagination[pageSize]=100`;
    console.log("Fetching:", url);
    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${STRAPI_TOKEN}`
        }
    });
    if (!res.ok) {
        console.error("Error:", res.status, res.statusText);
        return;
    }
    const json = await res.json();
    const types = new Set();
    const data = json.data || [];
    data.forEach(item => {
        const entry = item.attributes || item || {};
        types.add(entry.resource_type);
    });
    console.log("Unique resource types in DB:", Array.from(types));
}

getTypes();
