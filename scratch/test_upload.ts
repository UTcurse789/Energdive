import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env") });

async function run() {
  const url = process.env.ENERGJOB_STRAPI_URL || "";
  const token = process.env.ENERGJOB_STRAPI_TOKEN || "";

  console.log("Strap URL:", url);

  const boundary = "---------------------------" + Date.now().toString(16);
  const content = "Mock PDF content";
  const body = 
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="files"; filename="mock_resume.pdf"\r\n` +
    `Content-Type: application/pdf\r\n\r\n` +
    content + `\r\n` +
    `--${boundary}--\r\n`;

  const res = await fetch(`${url}/api/upload`, {
    method: "POST",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      Authorization: `Bearer ${token}`
    },
    body
  });

  console.log("Upload Status:", res.status);
  const data = await res.json();
  console.log("Upload Response Payload:", JSON.stringify(data, null, 2));
}

run().catch(console.error);
