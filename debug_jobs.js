const fs = require('fs');

async function testUrl(name, url, token) {
  const fetchUrl = `${url.replace(/\/$/, '')}/api/jobs?populate=*`;
  console.log(`\n--- Fetching from ${name} (${fetchUrl}) ---`);
  try {
    const res = await fetch(fetchUrl, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      }
    });

    if (!res.ok) {
      console.error(`HTTP error on ${name}!`, res.status);
      const errText = await res.text();
      console.error(errText);
      return;
    }

    const data = await res.json();
    console.log(`Total jobs returned from ${name}:`, data.data ? data.data.length : 0);
    if (data.data && data.data.length > 0) {
      data.data.forEach((job, index) => {
        const attrs = job.attributes || job;
        console.log(`Job ${index + 1}: ${attrs.title}`);
        console.log(`  job_status: ${attrs.job_status}`);
        console.log(`  external_apply_url: ${attrs.external_apply_url}`);
      });
    }
  } catch (err) {
    console.error(`Fetch error on ${name}:`, err);
  }
}

async function run() {
  const stagingUrl = "https://cms-staging.energdive.com";
  const stagingToken = "63decce1905ce008ad4976760a5fa9c86a757f9e09239aea95f6452876c0a072fd9c6e8b3865cd39d5bea3754557d1dddc903e8d4ef4c5d529ac9b323e760a22d1a512d5ffe0e31289b43ea7a3aa5803aa45602b3b2336c44af96ddf5c12f767d5b21dda526a20eb2252d184f9bcaeaa566bee713d89f3803522be0179c33f5e";

  await testUrl("Staging", stagingUrl, stagingToken);
}

run();
