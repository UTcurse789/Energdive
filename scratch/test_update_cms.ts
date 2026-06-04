import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env") });

async function run() {
  const url = process.env.ENERGJOB_STRAPI_URL || "";
  const token = process.env.ENERGJOB_STRAPI_TOKEN || "";

  // Test updating by numeric ID (12)
  console.log("Testing PUT with numeric ID...");
  const res1 = await fetch(`${url}/api/applications/12`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      data: {
        application_status: "shortlisted"
      }
    })
  });
  console.log("Numeric ID status:", res1.status);
  console.log("Numeric ID response:", await res1.text());

  // Test updating by documentId (n9ffjyvkedhdhmxs3wh3psdt)
  console.log("\nTesting PUT with document ID...");
  const res2 = await fetch(`${url}/api/applications/n9ffjyvkedhdhmxs3wh3psdt`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      data: {
        application_status: "shortlisted"
      }
    })
  });
  console.log("Document ID status:", res2.status);
  console.log("Document ID response:", await res2.text());
}

run().catch(console.error);
