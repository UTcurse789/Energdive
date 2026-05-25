import { NextRequest, NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const dataString = formData.get("data") as string;
    const pdfFile = formData.get("files.pdf") as File;

    console.log("[SUBMIT-PAPER] Raw data string:", dataString);
    console.log("[SUBMIT-PAPER] Has PDF:", !!pdfFile, pdfFile?.name, pdfFile?.size);

    const data = JSON.parse(dataString);
    console.log("[SUBMIT-PAPER] Parsed data keys:", Object.keys(data));
    console.log("[SUBMIT-PAPER] sector field:", data.sector, "| sectors field:", data.sectors);

    // Step 1: Transform payload to match Strapi v5 schema
    const strapiData: Record<string, unknown> = {};

    const SCALAR_FIELDS = ["title", "author_name", "author_email", "affiliation", "submitted_date", "paper_status"];
    for (const field of SCALAR_FIELDS) {
        if (data[field] !== undefined) {
            strapiData[field] = data[field];
        }
    }

    if (typeof data.abstract === "string" && data.abstract.trim()) {
        strapiData.abstract = [
            {
                type: "paragraph",
                children: [{ type: "text", text: data.abstract.trim() }],
            },
        ];
    }

    const rawSector = data.sector ?? data.sectors;
    console.log("[SUBMIT-PAPER] rawSector:", rawSector);
    if (rawSector != null) {
        const sectorIds = (Array.isArray(rawSector) ? rawSector : [rawSector])
            .map((v: unknown) => Number(v))
            .filter((v: number) => Number.isFinite(v) && v > 0);

        console.log("[SUBMIT-PAPER] sectorIds after normalization:", sectorIds);

        if (sectorIds.length > 0) {
            // Strapi v5: plain integer array works; { connect: [{ id }] } is silently ignored
            strapiData.sectors = sectorIds;
        }
    }

    console.log("[SUBMIT-PAPER] Final Strapi payload:", JSON.stringify({ data: strapiData }));

    const authHeaders: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (STRAPI_API_TOKEN) {
        authHeaders["Authorization"] = `Bearer ${STRAPI_API_TOKEN}`;
    }

    // Step 1: Entry create karo
    const createResponse = await fetch(`${STRAPI_URL}/api/paper-submissions`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ data: strapiData }),
    });

    const createResponseText = await createResponse.text();
    console.log("[SUBMIT-PAPER] Create status:", createResponse.status);
    console.log("[SUBMIT-PAPER] Create response:", createResponseText);

    if (!createResponse.ok) {
      return NextResponse.json(JSON.parse(createResponseText), { status: createResponse.status });
    }

    const created = JSON.parse(createResponseText);
    const documentId = created.data.documentId;
    console.log("[SUBMIT-PAPER] Created entry documentId:", documentId);

    // Step 2: PDF upload karo aur entry se link karo
    if (pdfFile && documentId) {
      const uploadFormData = new FormData();
      uploadFormData.append("files", pdfFile, pdfFile.name);
      uploadFormData.append("ref", "api::paper-submission.paper-submission");
      uploadFormData.append("refId", documentId);
      uploadFormData.append("field", "pdf");

      console.log("[SUBMIT-PAPER] Uploading PDF:", pdfFile.name, "linked to documentId:", documentId);

      const uploadHeaders: Record<string, string> = {};
      if (STRAPI_API_TOKEN) {
          uploadHeaders["Authorization"] = `Bearer ${STRAPI_API_TOKEN}`;
      }

      const uploadRes = await fetch(`${STRAPI_URL}/api/upload`, {
        method: "POST",
        headers: uploadHeaders,
        body: uploadFormData,
      });

      const uploadText = await uploadRes.text();
      console.log("[SUBMIT-PAPER] Upload status:", uploadRes.status);
      console.log("[SUBMIT-PAPER] Upload response:", uploadText);
    } else {
      console.log("[SUBMIT-PAPER] Skipping PDF upload - pdfFile:", !!pdfFile, "documentId:", documentId);
    }

    return NextResponse.json(created);
  } catch (error) {
    console.error("[SUBMIT-PAPER] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
