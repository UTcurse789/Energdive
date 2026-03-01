const fetch = require('node-fetch');

async function debugFetch() {
    const url = "https://cms.energdive.com/api/contents?filters[$and][0][type_of_content][name][$eq]=News&pagination[pageSize]=1&populate=*";
    try {
        const res = await fetch(url);
        const json = await res.json();
        const item = json.data[0];
        console.log("Full Item Structure:", JSON.stringify(item, null, 2));
        console.log("Slug:", item.slug);
        console.log("Attributes Slug:", item.attributes?.slug);
    } catch (e) {
        console.error(e);
    }
}

debugFetch();
