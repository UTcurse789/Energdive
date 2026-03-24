const STRAPI_BASE = "https://cms.energdive.com";

async function fetchOpinions() {
  const url = `${STRAPI_BASE}/api/contents?filters[type_of_content][name][$eq]=Opinion&pagination[pageSize]=20&populate[author][populate]=avatar&populate=FeaturedImage&populate[content_tag]=true&sort=publishedAt:desc`;
  console.log("Fetching:", url);
  try {
    const res = await fetch(url);
    const json = await res.json();
    console.log("Total items:", json.data?.length);
    json.data?.forEach((item, i) => {
      console.log(`\nItem ${i + 1}: ${item.Title}`);
      console.log("content_tag:", JSON.stringify(item.content_tag, null, 2));
    });
  } catch (err) {
    console.error(err);
  }
}

fetchOpinions();
