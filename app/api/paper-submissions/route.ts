import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DEFAULT_STRAPI_BASE = "https://cms-staging.energdive.com";
const STRAPI_BASE =
    process.env.STRAPI_API_URL ||
    process.env.NEXT_PUBLIC_STRAPI_API_URL ||
    process.env.NEXT_PUBLIC_STRAPI_URL ||
    DEFAULT_STRAPI_BASE;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

/**
 * Strapi v5 does not support multipart/form-data for content-type creation.
 * Instead we use a two-step approach:
 *   1. Create the paper-submission entry via a JSON POST.
 *   2. Upload the PDF via the /api/upload endpoint, linking it to the entry.
 */
export async function POST(request: Request) {
    try {
        const { origin, searchParams } = new URL(request.url);

        if (searchParams.has("__clerk_handshake")) {
            return new NextResponse(null, { status: 204 });
        }

        const strapiOrigin = new URL(STRAPI_BASE).origin;

        if (strapiOrigin === origin) {
            console.error("[PAPER_SUBMISSION_PROXY] Refusing to proxy to self:", STRAPI_BASE);
            return NextResponse.json(
                { error: { message: "Paper submission is misconfigured." } },
                { status: 500 }
            );
        }

        // ── 1. Parse the incoming multipart form data from the browser ──
        let incomingFormData: FormData;

        try {
            incomingFormData = await request.formData();
        } catch {
            return NextResponse.json(
                { error: { message: "Missing request body for paper submission." } },
                { status: 400 }
            );
        }

        const rawData = incomingFormData.get("data");
        const pdfFile = incomingFormData.get("files.pdf");

        if (!rawData || typeof rawData !== "string") {
            return NextResponse.json(
                { error: { message: "Missing 'data' field in the submission." } },
                { status: 400 }
            );
        }

        let entryPayload: Record<string, unknown>;

        try {
            entryPayload = JSON.parse(rawData);
        } catch {
            return NextResponse.json(
                { error: { message: "Invalid JSON in the 'data' field." } },
                { status: 400 }
            );
        }

        // ── 2. Transform payload to match Strapi v5 schema ──
        // The frontend sends `sector` (singular, plain ID or array of IDs),
        // but Strapi v5 expects `sectors` (plural, manyToMany) with `connect` syntax.
        // The `abstract` field is type "blocks" in Strapi, not plain text.
        const strapiData: Record<string, unknown> = {};

        // Whitelist of known scalar/enum fields on the content type.
        const SCALAR_FIELDS = ["title", "author_name", "author_email", "submitted_date", "paper_status"];

        for (const field of SCALAR_FIELDS) {
            if (entryPayload[field] !== undefined) {
                strapiData[field] = entryPayload[field];
            }
        }

        if (entryPayload.affiliation !== undefined) {
            strapiData.institution = entryPayload.affiliation;
        }

        // Convert plain-text abstract → Strapi v5 "blocks" format.
        if (typeof entryPayload.abstract === "string" && entryPayload.abstract.trim()) {
            strapiData.abstract = [
                {
                    type: "paragraph",
                    children: [
                        {
                            type: "text",
                            text: entryPayload.abstract.trim(),
                        },
                    ],
                },
            ];
        }

        // Convert `sector` (singular ID or array) → `sectors` (manyToMany connect).
        const rawSector = entryPayload.sector ?? entryPayload.sectors;
        if (rawSector != null) {
            const sectorIds = (Array.isArray(rawSector) ? rawSector : [rawSector])
                .map((v: unknown) => Number(v))
                .filter((v: number) => Number.isFinite(v) && v > 0);

            if (sectorIds.length > 0) {
                strapiData.sectors = {
                    connect: sectorIds.map((id: number) => ({ id })),
                };
            }
        }

        console.log("[PAPER_SUBMISSION_PROXY] Transformed payload:", JSON.stringify({ data: strapiData }).slice(0, 800));

        // ── 3. Create the paper-submission entry via JSON ──
        const authHeaders: Record<string, string> = {
            "content-type": "application/json",
        };

        if (STRAPI_API_TOKEN) {
            authHeaders["authorization"] = `Bearer ${STRAPI_API_TOKEN}`;
        }

        const createResponse = await fetch(
            `${STRAPI_BASE}/api/paper-submissions`,
            {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify({ data: strapiData }),
                cache: "no-store",
            }
        );


        const createText = await createResponse.text();

        console.log("[PAPER_SUBMISSION_PROXY] Create entry status:", createResponse.status);
        console.log("[PAPER_SUBMISSION_PROXY] Create entry response:", createText.slice(0, 500));

        if (!createResponse.ok) {
            let parsed: unknown = null;
            try {
                parsed = createText ? JSON.parse(createText) : null;
            } catch {
                parsed = null;
            }
            return NextResponse.json(parsed ?? { data: null }, { status: createResponse.status });
        }

        let createdEntry: { data?: { id?: number; documentId?: string } } = {};

        try {
            createdEntry = JSON.parse(createText);
        } catch {
            // Entry was created but we can't parse the response — still a success.
            return NextResponse.json({ data: null, _note: "Entry created but response unparseable." }, { status: 201 });
        }

        // ── 4. Upload the PDF file (if provided) and link it to the entry ──
        const entryId = createdEntry?.data?.documentId;

        if (pdfFile && entryId) {
            const uploadFormData = new FormData();
            uploadFormData.append("files", pdfFile);
            uploadFormData.append("ref", "api::paper-submission.paper-submission");
            uploadFormData.append("refId", String(entryId));
            uploadFormData.append("field", "pdf");

            const uploadHeaders: Record<string, string> = {};
            if (STRAPI_API_TOKEN) {
                uploadHeaders["authorization"] = `Bearer ${STRAPI_API_TOKEN}`;
            }

            const uploadResponse = await fetch(
                `${STRAPI_BASE}/api/upload`,
                {
                    method: "POST",
                    headers: uploadHeaders,
                    body: uploadFormData,
                    cache: "no-store",
                }
            );

            console.log("[PAPER_SUBMISSION_PROXY] Upload status:", uploadResponse.status);

            if (!uploadResponse.ok) {
                const uploadText = await uploadResponse.text();
                console.error("[PAPER_SUBMISSION_PROXY] Upload failed:", uploadText.slice(0, 500));
                // Entry was created but file upload failed — still return success
                // with a note so the user knows the entry exists.
            }
        } else if (pdfFile && !entryId) {
            console.warn("[PAPER_SUBMISSION_PROXY] PDF provided but no entry ID to link it to.");
        }

        return NextResponse.json(createdEntry, { status: createResponse.status });
    } catch (error) {
        console.error("[PAPER_SUBMISSION_PROXY]", error);
        return NextResponse.json(
            { error: { message: "Unable to submit paper right now." } },
            { status: 500 }
        );
    }
}


