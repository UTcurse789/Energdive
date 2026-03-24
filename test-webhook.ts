import { POST } from "./app/api/leads/zoho-webhook/route";
import { NextRequest } from "next/server";

async function run() {
    const req = new NextRequest("http://localhost/api/leads/zoho-webhook", {
        method: "POST",
        headers: {
            "x-webhook-secret": "my_super_secret_123",
            "content-type": "application/json"
        },
        body: JSON.stringify({
            email: "testcomm@energdive.com",
            first_name: "Test",
            last_name: "Comm",
            Community: ["Oil & Gas", "Power Generation"],
            Sub_Community: ["Upstream", "Solar"]
        })
    });
    
    const res = await POST(req);
    console.log(await res.json());
}
run();
