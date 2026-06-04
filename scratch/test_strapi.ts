import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env") });

async function run() {
  const url = process.env.ENERGJOB_STRAPI_URL || "";
  const token = process.env.ENERGJOB_STRAPI_TOKEN || "";

  const res = await fetch(`${url}/api/applications?populate=*&pagination[limit]=1`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.ok) {
    const data = await res.json();
    console.log("Full application sample from CMS:", JSON.stringify(data, null, 2));
  } else {
    console.log("Failed to fetch applications:", res.status, await res.text());
  }
}

run().catch(console.error);
