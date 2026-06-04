import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env") });

async function run() {
  const port = 3000;
  const token = "cb4031f2-cfd6-44c5-819c-08de592f5b1b"; // Token for application ID 3

  console.log("Calling local API to update status to viewed...");
  const res = await fetch(`http://localhost:${port}/api/energjob/applications/3/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status: "viewed",
      token,
    }),
  });

  console.log("API Status:", res.status);
  console.log("API Response:", await res.text());
}

run().catch(console.error);
