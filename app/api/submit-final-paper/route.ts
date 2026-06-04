import { NextRequest, NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const FINAL_PAPER_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const FINAL_PAPER_MAX_FILE_SIZE_LABEL = "10 MB";

type StrapiDataResponse = {
    data?: {
        id?: number | null;
        documentId?: string | null;
    } | null;
};

type UploadedFileResponse = {
    id?: number | null;
    documentId?: string | null;
};

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

async function createFinalPaperEntry(basePayload: Record<string, unknown>) {
    const createResponse = await fetch(`${STRAPI_URL}/api/final-paper-submissions?status=draft`, {
        method: "POST",
        headers: buildAuthHeaders(),
        body: JSON.stringify({ data: basePayload }),
        cache: "no-store",
    });

    const responseText = await createResponse.text();
    console.log("[SUBMIT-FINAL-PAPER] Create status:", createResponse.status);

    if (!createResponse.ok) {
        let parsedResponse: unknown = null;
        try {
            parsedResponse = responseText ? JSON.parse(responseText) : null;
        } catch {
            parsedResponse = { error: responseText || "Unable to create final paper submission." };
        }
        return { ok: false, status: createResponse.status, body: parsedResponse };
    }

    return {
        ok: true,
        status: createResponse.status,
        body: responseText ? JSON.parse(responseText) : {},
    };
}

async function updateFinalPaperDocument({
    identifier,
    payload,
}: {
    identifier: string;
    payload: Record<string, unknown>;
}) {
    const response = await fetch(`${STRAPI_URL}/api/final-paper-submissions/${identifier}?status=draft`, {
        method: "PUT",
        headers: buildAuthHeaders(),
        body: JSON.stringify({ data: payload }),
        cache: "no-store",
    });

    const responseText = await response.text();
    return {
        ok: response.ok,
        statusCode: response.status,
        responseText,
    };
}

async function uploadFinalPaperFile({
    paperFile,
}: {
    paperFile: File;
}) {
    const uploadFormData = new FormData();
    uploadFormData.append("files", paperFile, paperFile.name);

    try {
        const uploadResponse = await fetch(`${STRAPI_URL}/api/upload`, {
            method: "POST",
            headers: buildAuthHeaders(""),
            body: uploadFormData,
            cache: "no-store",
        });

        const uploadText = await uploadResponse.text();
        let uploadedFiles: UploadedFileResponse[] = [];
        try {
            uploadedFiles = uploadText ? JSON.parse(uploadText) : [];
        } catch {
            uploadedFiles = [];
        }

        console.log("[SUBMIT-FINAL-PAPER] File Upload status:", uploadResponse.status);

        if (uploadResponse.status === 413) {
            return { ok: false, statusCode: 413, mediaId: null, mediaDocumentId: null };
        }

        if (uploadResponse.ok) {
            return {
                ok: true,
                statusCode: uploadResponse.status,
                mediaId: uploadedFiles?.[0]?.id ?? null,
                mediaDocumentId: uploadedFiles?.[0]?.documentId ?? null,
            };
        }

        return { ok: false, statusCode: uploadResponse.status, mediaId: null, mediaDocumentId: null };
    } catch (error) {
        console.error("[SUBMIT-FINAL-PAPER] File Upload fetch error:", error);
        if (isUploadLimitConnectionError(error)) {
            return { ok: false, statusCode: 413, mediaId: null, mediaDocumentId: null };
        }

        return { ok: false, statusCode: 502, mediaId: null, mediaDocumentId: null };
    }
}

async function attachFileToFinalPaper({
    documentId,
    mediaId,
}: {
    documentId?: string | null;
    mediaId?: number | null;
}) {
    if (!mediaId) return;

    const candidateIdentifiers = [documentId]
        .filter((value) => value !== null && value !== undefined && value !== "")
        .map((value) => String(value));

    const payloads = [
        { full_paper: mediaId },
        { full_paper: { connect: [mediaId] } },
    ];

    for (const identifier of candidateIdentifiers) {
        for (const payload of payloads) {
            const result = await updateFinalPaperDocument({ identifier, payload });
            if (result.ok) return;
        }
    }
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const dataString = formData.get("data") as string;
        const paperFile = formData.get("files.full_paper") as File | null;

        console.log("[SUBMIT-FINAL-PAPER] Has File:", !!paperFile, "Size:", paperFile?.size ?? 0);

        if (paperFile && paperFile.size > FINAL_PAPER_MAX_FILE_SIZE_BYTES) {
            return NextResponse.json(
                {
                    error: {
                        message: `The selected file is ${formatFileSize(paperFile.size)}. Please upload a file up to ${FINAL_PAPER_MAX_FILE_SIZE_LABEL}.`,
                    },
                },
                { status: 400 }
            );
        }

        const data = JSON.parse(dataString);
        const strapiData: Record<string, unknown> = {
            title: data.title,
            author_name: data.author_name,
            author_email: data.author_email,
            final_status: data.final_status || "pending",
            final_submission_date: data.final_submission_date || new Date().toISOString(),
        };

        // Handle relation link to abstract submission
        // Can support passing number (id) or documentId
        const abstractId = data.abstract_submission;
        if (abstractId) {
            if (typeof abstractId === "number" || /^\d+$/.test(String(abstractId))) {
                strapiData.abstract_submission = { id: Number(abstractId) };
            } else {
                strapiData.abstract_submission = abstractId; // string documentId
            }
        }

        let uploadedFile: Awaited<ReturnType<typeof uploadFinalPaperFile>> | null = null;

        if (paperFile) {
            uploadedFile = await uploadFinalPaperFile({
                paperFile,
            });

            if (!uploadedFile.ok) {
                const statusCode = uploadedFile.statusCode || 500;
                const message = statusCode === 413
                    ? `Paper upload failed because the CMS/server rejected ${formatFileSize(paperFile.size)} even though this form allows up to ${FINAL_PAPER_MAX_FILE_SIZE_LABEL}. Please increase the CMS upload limit or try a smaller file.`
                    : "Paper upload failed. Please try again with a smaller file or contact support.";
                return NextResponse.json({ error: { message } }, { status: statusCode });
            }
        }

        const createdEntry = await createFinalPaperEntry(strapiData);
        if (!createdEntry.ok) {
            return NextResponse.json(createdEntry.body, { status: createdEntry.status });
        }

        const created = createdEntry.body as StrapiDataResponse;
        const documentId = created?.data?.documentId ?? null;

        if (uploadedFile?.mediaId) {
            await attachFileToFinalPaper({
                documentId,
                mediaId: uploadedFile.mediaId,
            });
        }

        return NextResponse.json(created, { status: createdEntry.status });
    } catch (error) {
        console.error("[SUBMIT-FINAL-PAPER] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
