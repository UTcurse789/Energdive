import { NextRequest, NextResponse } from "next/server";
import { sendAbstractSubmissionAdminNotification } from "@/lib/email";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const STRAPI_ABSTRACT_COLLECTION_PATH = "paper-submissions";
const STRAPI_ABSTRACT_UID = "api::paper-submission.paper-submission";
const STRAPI_ABSTRACT_PDF_FIELD = "abstract_pdf";
const ABSTRACT_PDF_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ABSTRACT_PDF_MAX_FILE_SIZE_LABEL = "10 MB";

type StrapiEntityResponse = {
    data?: {
        id?: number;
        documentId?: string;
    };
};

function buildAuthHeaders(contentType = "application/json") {
    const headers: Record<string, string> = {};
    if (contentType) {
        headers["Content-Type"] = contentType;
    }
    if (STRAPI_API_TOKEN) {
        headers.Authorization = `Bearer ${STRAPI_API_TOKEN}`;
    }
    return headers;
}

function getErrorCode(error: unknown) {
    if (!error || typeof error !== "object") return "";

    const directCode = "code" in error ? error.code : "";
    if (typeof directCode === "string") return directCode;

    const cause = "cause" in error ? error.cause : null;
    if (cause && typeof cause === "object" && "code" in cause && typeof cause.code === "string") {
        return cause.code;
    }

    return "";
}

function isUploadLimitConnectionError(error: unknown) {
    const code = getErrorCode(error);
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    return code === "EPIPE" || message.includes("terminated") || message.includes("fetch failed");
}

function formatFileSize(bytes: number) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
    if (bytes >= 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function normalizeSectorSelection(value: unknown) {
    const rawItems = Array.isArray(value) ? value : [value];
    const ids = [];
    const documentIds = [];

    for (const item of rawItems) {
        if (typeof item === "string") {
            const trimmed = item.trim();
            if (!trimmed) continue;
            if (/^\d+$/.test(trimmed)) {
                const numericValue = Number(trimmed);
                if (Number.isFinite(numericValue) && numericValue > 0) {
                    ids.push(numericValue);
                }
                continue;
            }
            documentIds.push(trimmed);
            continue;
        }

        const numericValue = Number(item);
        if (Number.isFinite(numericValue) && numericValue > 0) {
            ids.push(numericValue);
        }
    }

    return {
        ids: [...new Set(ids)],
        documentIds: [...new Set(documentIds)],
    };
}

function buildAbstractBlocks(value: unknown) {
    if (typeof value !== "string" || !value.trim()) {
        return undefined;
    }
    return [
        {
            type: "paragraph",
            children: [{ type: "text", text: value.trim() }],
        },
    ];
}

function extractStrapiErrorMessage(payload: unknown) {
    if (!payload || typeof payload !== "object") {
        return null;
    }

    const body = payload as {
        error?: { message?: unknown; details?: unknown };
        message?: unknown;
    };

    if (typeof body.error?.message === "string" && body.error.message.trim()) {
        return body.error.message.trim();
    }

    if (typeof body.message === "string" && body.message.trim()) {
        return body.message.trim();
    }

    return null;
}

function readStrapiEntityResponse(payload: unknown): StrapiEntityResponse {
    if (!payload || typeof payload !== "object") {
        return {};
    }

    const body = payload as StrapiEntityResponse;
    return {
        data: body.data && typeof body.data === "object"
            ? {
                id: typeof body.data.id === "number" ? body.data.id : undefined,
                documentId: typeof body.data.documentId === "string" ? body.data.documentId : undefined,
            }
            : undefined,
    };
}

async function createAbstractEntry(basePayload: Record<string, unknown>) {
    const createResponse = await fetch(`${STRAPI_URL}/api/${STRAPI_ABSTRACT_COLLECTION_PATH}`, {
        method: "POST",
        headers: buildAuthHeaders(),
        body: JSON.stringify({ data: basePayload }),
        cache: "no-store",
    });

    const responseText = await createResponse.text();
    console.log("[SUBMIT-ABSTRACT] Create status:", createResponse.status);
    console.log("[SUBMIT-ABSTRACT] Create response:", responseText);

    if (!createResponse.ok) {
        let parsedResponse: unknown = null;
        try {
            parsedResponse = responseText ? JSON.parse(responseText) : null;
        } catch {
            const routeUnavailableMessage =
                createResponse.status === 404 || createResponse.status === 405
                    ? "Abstract submissions are not enabled on the CMS. Please verify the Strapi paper-submission API route."
                    : responseText || "Unable to create abstract submission.";
            parsedResponse = { error: { message: routeUnavailableMessage } };
        }
        return { ok: false, status: createResponse.status, body: parsedResponse };
    }

    return {
        ok: true,
        status: createResponse.status,
        body: responseText ? JSON.parse(responseText) : {},
    };
}

async function updateAbstractDocumentVersion({
    identifier,
    payload,
    status,
}: {
    identifier: string;
    payload: Record<string, unknown>;
    status?: "draft" | "published";
}) {
    const suffix = status ? `?status=${status}` : "";
    const response = await fetch(`${STRAPI_URL}/api/${STRAPI_ABSTRACT_COLLECTION_PATH}/${identifier}${suffix}`, {
        method: "PUT",
        headers: buildAuthHeaders(),
        body: JSON.stringify({ data: payload }),
        cache: "no-store",
    });

    const responseText = await response.text();
    let parsedResponse: unknown = null;
    try {
        parsedResponse = responseText ? JSON.parse(responseText) : null;
    } catch {
        parsedResponse = null;
    }

    return {
        ok: response.ok,
        statusCode: response.status,
        responseText,
        parsedResponse,
    };
}

async function resolveSectorDocumentIds({
    sectorIds,
    submittedDocumentIds,
}: {
    sectorIds: number[];
    submittedDocumentIds: string[];
}) {
    if (!sectorIds.length) {
        return [...new Set(submittedDocumentIds)];
    }

    const response = await fetch(
        `${STRAPI_URL}/api/sectors?fields[0]=documentId&populate[children][fields][0]=documentId&pagination[pageSize]=200`,
        {
            headers: buildAuthHeaders(""),
            cache: "no-store",
        }
    );

    const responseText = await response.text();
    if (!response.ok) {
        return [...new Set(submittedDocumentIds)];
    }

    let parsedResponse: unknown = null;
    try {
        parsedResponse = responseText ? JSON.parse(responseText) : null;
    } catch {
        parsedResponse = null;
    }

    const documentIds = [...submittedDocumentIds];
    const seenDocumentIds = new Set(submittedDocumentIds);
    const responseData =
        parsedResponse && typeof parsedResponse === "object" && Array.isArray((parsedResponse as { data?: unknown }).data)
            ? (parsedResponse as { data: unknown[] }).data
            : [];
    const queue = [...responseData];

    while (queue.length > 0) {
        const current = queue.shift();
        if (!current) continue;

        const currentEntity = current as {
            id?: unknown;
            documentId?: unknown;
            children?: unknown[] | { data?: unknown[] };
        };

        if (
            typeof currentEntity.id === "number" &&
            sectorIds.includes(currentEntity.id) &&
            typeof currentEntity.documentId === "string" &&
            !seenDocumentIds.has(currentEntity.documentId)
        ) {
            documentIds.push(currentEntity.documentId);
            seenDocumentIds.add(currentEntity.documentId);
        }

        const childItems = Array.isArray(currentEntity.children)
            ? currentEntity.children
            : currentEntity.children &&
                !Array.isArray(currentEntity.children) &&
                Array.isArray(currentEntity.children.data)
                ? currentEntity.children.data
                : [];

        for (const child of childItems) {
            const childEntity = child as { id?: unknown; documentId?: unknown };
            if (
                typeof childEntity.id === "number" &&
                sectorIds.includes(childEntity.id) &&
                typeof childEntity.documentId === "string" &&
                !seenDocumentIds.has(childEntity.documentId)
            ) {
                documentIds.push(childEntity.documentId);
                seenDocumentIds.add(childEntity.documentId);
            }
        }
    }

    return documentIds;
}

async function attachSectorsToAbstract({
    entryId,
    documentId,
    sectorIds,
    sectorDocumentIds,
}: {
    entryId?: number | null;
    documentId?: string | null;
    sectorIds: number[];
    sectorDocumentIds: string[];
}) {
    if (!sectorIds.length && !sectorDocumentIds.length) {
        return { attached: true, entryId: entryId ?? null, documentId: documentId ?? null };
    }

    const candidateIdentifiers = [documentId]
        .filter((value) => value !== null && value !== undefined && value !== "")
        .map((value) => String(value));

    const payloads = [
        sectorDocumentIds.length > 0 ? { sectors: { set: sectorDocumentIds.map((docId) => ({ documentId: docId })) } } : null,
        sectorDocumentIds.length > 0 ? { sectors: sectorDocumentIds } : null,
        sectorIds.length > 0 ? { sectors: { set: sectorIds.map((id) => ({ id })) } } : null,
        sectorIds.length > 0 ? { sectors: sectorIds } : null,
    ].filter(Boolean) as Array<Record<string, unknown>>;

    for (const identifier of candidateIdentifiers) {
        for (const payload of payloads) {
            const result = await updateAbstractDocumentVersion({ identifier, payload, status: "draft" });
            if (result.ok) {
                return {
                    attached: true,
                    entryId: readStrapiEntityResponse(result.parsedResponse).data?.id ?? entryId ?? null,
                    documentId: readStrapiEntityResponse(result.parsedResponse).data?.documentId ?? documentId ?? null,
                };
            }
        }
    }

    return { attached: false, entryId: entryId ?? null, documentId: documentId ?? null };
}

async function uploadAbstractPdf({
    pdfFile,
    entryId,
    documentId,
}: {
    pdfFile: File;
    entryId?: number | null;
    documentId?: string | null;
}) {
    const candidateRefIds = [entryId, documentId]
        .filter((value) => value !== null && value !== undefined && value !== "")
        .map((value) => String(value));

    let lastStatus = 0;
    let lastErrorMessage: string | null = null;

    for (const refId of candidateRefIds) {
        const uploadFormData = new FormData();
        uploadFormData.append("files", pdfFile, pdfFile.name);
        uploadFormData.append("ref", STRAPI_ABSTRACT_UID);
        uploadFormData.append("refId", refId);
        uploadFormData.append("field", STRAPI_ABSTRACT_PDF_FIELD);

        let uploadResponse: Response;
        try {
            uploadResponse = await fetch(`${STRAPI_URL}/api/upload`, {
                method: "POST",
                headers: buildAuthHeaders(""),
                body: uploadFormData,
                cache: "no-store",
            });
        } catch (error) {
            console.error("[SUBMIT-ABSTRACT] PDF Upload fetch error:", error);
            if (isUploadLimitConnectionError(error)) {
                lastStatus = 413;
                lastErrorMessage = null;
                continue;
            }

            lastStatus = 502;
            lastErrorMessage = "PDF upload failed while connecting to the CMS.";
            continue;
        }

        const uploadText = await uploadResponse.text();
        let parsedUploadResponse: unknown = null;
        let uploadedFiles: Array<{ id?: number; documentId?: string }> = [];
        try {
            parsedUploadResponse = uploadText ? JSON.parse(uploadText) : [];
            uploadedFiles = Array.isArray(parsedUploadResponse) ? parsedUploadResponse : [];
        } catch {
            uploadedFiles = [];
            parsedUploadResponse = null;
        }

        console.log("[SUBMIT-ABSTRACT] PDF Upload attempt:", {
            refId,
            status: uploadResponse.status,
            response: uploadText,
        });
        lastStatus = uploadResponse.status;
        lastErrorMessage =
            extractStrapiErrorMessage(parsedUploadResponse) ||
            (uploadText && !uploadResponse.ok ? uploadText : null);

        if (uploadResponse.ok) {
            return {
                ok: true,
                statusCode: uploadResponse.status,
                mediaId: uploadedFiles?.[0]?.id ?? null,
                mediaDocumentId: uploadedFiles?.[0]?.documentId ?? null,
                errorMessage: null,
            };
        }
    }

    console.error("[SUBMIT-ABSTRACT] Failed to upload PDF after all attempts:", {
        entryId,
        documentId,
        fileName: pdfFile.name,
        lastErrorMessage,
    });

    return {
        ok: false,
        statusCode: lastStatus,
        mediaId: null,
        mediaDocumentId: null,
        errorMessage: lastErrorMessage,
    };
}

async function attachPdfToAbstract({
    entryId,
    documentId,
    mediaId,
}: {
    entryId?: number | null;
    documentId?: string | null;
    mediaId?: number | null;
}) {
    if (!mediaId) return;

    const candidateIdentifiers = [documentId]
        .filter((value) => value !== null && value !== undefined && value !== "")
        .map((value) => String(value));

    const payloads = [
        { [STRAPI_ABSTRACT_PDF_FIELD]: mediaId },
        { [STRAPI_ABSTRACT_PDF_FIELD]: { connect: [mediaId] } },
        { [STRAPI_ABSTRACT_PDF_FIELD]: { connect: [{ id: mediaId }] } },
    ];

    for (const identifier of candidateIdentifiers) {
        for (const payload of payloads) {
            const result = await updateAbstractDocumentVersion({ identifier, payload });
            console.log("[SUBMIT-ABSTRACT] PDF attach attempt:", {
                identifier,
                payload,
                status: result.statusCode,
                response: result.responseText,
            });
            if (result.ok) return;
        }
    }

    console.error("[SUBMIT-ABSTRACT] Failed to attach PDF relation after all attempts:", {
        entryId,
        documentId,
        mediaId,
    });
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const dataString = formData.get("data") as string;
        const pdfFile = formData.get("files.pdf") as File | null;

        console.log("[SUBMIT-ABSTRACT] Has PDF:", !!pdfFile, "Size:", pdfFile?.size ?? 0);

        if (pdfFile && pdfFile.size > ABSTRACT_PDF_MAX_FILE_SIZE_BYTES) {
            return NextResponse.json(
                {
                    error: {
                        message: `The selected PDF is ${formatFileSize(pdfFile.size)}. Please upload a PDF up to ${ABSTRACT_PDF_MAX_FILE_SIZE_LABEL}.`,
                    },
                },
                { status: 400 }
            );
        }

        const data = JSON.parse(dataString);
        const rawSector = data.sector ?? data.sectors;
        const sectorSelection = normalizeSectorSelection(rawSector);
        const sectorIds = sectorSelection.ids;
        const sectorDocumentIds = await resolveSectorDocumentIds({
            sectorIds,
            submittedDocumentIds: sectorSelection.documentIds,
        });

        const strapiData: Record<string, unknown> = {};
        const scalarFields = [
            "title",
            "author_name",
            "author_email",
            "co_author",
            "submitted_date",
            "paper_status",
        ];

        for (const field of scalarFields) {
            if (data[field] !== undefined) {
                strapiData[field] = data[field];
            }
        }

        if (data.affiliation !== undefined) {
            strapiData.institution = data.affiliation;
        }

        if (data.profession !== undefined) {
            strapiData.Profession = data.profession;
        }

        const abstractBlocks = buildAbstractBlocks(data.abstract);
        if (abstractBlocks) {
            strapiData.abstract = abstractBlocks;
        }

        const createdEntry = await createAbstractEntry(strapiData);
        if (!createdEntry.ok) {
            return NextResponse.json(createdEntry.body, { status: createdEntry.status });
        }

        const created = readStrapiEntityResponse(createdEntry.body);
        const entryId = created.data?.id ?? null;
        const documentId = created.data?.documentId ?? null;

        const updatedEntry = await attachSectorsToAbstract({
            entryId,
            documentId,
            sectorIds,
            sectorDocumentIds,
        });

        if (pdfFile) {
            const uploadedPdf = await uploadAbstractPdf({
                pdfFile,
                entryId: updatedEntry?.entryId ?? entryId,
                documentId: updatedEntry?.documentId ?? documentId,
            });

            if (!uploadedPdf.ok) {
                const statusCode = uploadedPdf.statusCode || 500;
                const message = statusCode === 413
                    ? `PDF upload failed because the CMS/server rejected ${formatFileSize(pdfFile.size)} even though this form allows up to ${ABSTRACT_PDF_MAX_FILE_SIZE_LABEL}. Please increase the CMS upload limit or try a smaller file.`
                    : uploadedPdf.errorMessage ||
                        "PDF upload failed. Please try again with a smaller PDF or contact support.";
                return NextResponse.json({ error: { message } }, { status: statusCode });
            }

            await attachPdfToAbstract({
                entryId: updatedEntry?.entryId ?? entryId,
                documentId: updatedEntry?.documentId ?? documentId,
                mediaId: uploadedPdf.mediaId,
            });
        }

        try {
            let pdfBase64: string | undefined;
            if (pdfFile) {
                const arrayBuffer = await pdfFile.arrayBuffer();
                pdfBase64 = Buffer.from(arrayBuffer).toString('base64');
            }

            await sendAbstractSubmissionAdminNotification({
                title: (strapiData.title as string) || "",
                authorName: (strapiData.author_name as string) || "",
                authorEmail: (strapiData.author_email as string) || "",
                coAuthor: strapiData.co_author as string,
                institution: strapiData.institution as string,
                profession: strapiData.Profession as string,
                abstractText: data.abstract || "",
                pdfFileName: pdfFile?.name,
                pdfBase64,
            });
        } catch (emailError) {
            console.error("[SUBMIT-ABSTRACT] Failed to send admin email:", emailError);
            // Don't fail the request if email fails
        }

        return NextResponse.json(createdEntry.body, { status: createdEntry.status });
    } catch (error) {
        console.error("[SUBMIT-ABSTRACT] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
