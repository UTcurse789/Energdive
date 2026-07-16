import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { markUserAsAbstractSubmitter } from "@/lib/queries";
import { sendAbstractSubmissionAuthorConfirmation } from "@/lib/email";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

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

function normalizeSectorSelection(value: unknown) {
    const rawItems = Array.isArray(value) ? value : [value];
    const ids = [];
    const documentIds = [];

    for (const item of rawItems) {
        if (typeof item === "string") {
            const trimmed = item.trim();

            if (!trimmed) {
                continue;
            }

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

async function createPaperEntry(basePayload: Record<string, unknown>) {
    const createResponse = await fetch(`${STRAPI_URL}/api/paper-submissions?status=draft`, {
        method: "POST",
        headers: buildAuthHeaders(),
        body: JSON.stringify({ data: basePayload }),
        cache: "no-store",
    });

    const responseText = await createResponse.text();

    console.log("[SUBMIT-PAPER] Create status:", createResponse.status);
    console.log("[SUBMIT-PAPER] Create response:", responseText);

    if (!createResponse.ok) {
        let parsedResponse: unknown = null;

        try {
            parsedResponse = responseText ? JSON.parse(responseText) : null;
        } catch {
            parsedResponse = { error: responseText || "Unable to create paper submission." };
        }

        return {
            ok: false,
            status: createResponse.status,
            body: parsedResponse,
        };
    }

    return {
        ok: true,
        status: createResponse.status,
        body: responseText ? JSON.parse(responseText) : {},
    };
}

async function updatePaperDocumentVersion({
    identifier,
    payload,
    status,
}: {
    identifier: string;
    payload: Record<string, unknown>;
    status?: "draft" | "published";
}) {
    const suffix = status ? `?status=${status}` : "";
    const response = await fetch(`${STRAPI_URL}/api/paper-submissions/${identifier}${suffix}`, {
        method: "PUT",
        headers: buildAuthHeaders(),
        body: JSON.stringify({ data: payload }),
        cache: "no-store",
    });

    const responseText = await response.text();
    let parsedResponse: {
        data?: {
            id?: number;
            documentId?: string;
        };
    } | null = null;

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

async function fetchPaperSnapshot({
    identifier,
    status = "draft",
}: {
    identifier: string;
    status?: "draft" | "published";
}) {
    const response = await fetch(
        `${STRAPI_URL}/api/paper-submissions/${identifier}?populate[sectors][fields][0]=name&populate[pdf][fields][0]=url&populate[pdf][fields][1]=name&status=${status}`,
        {
            headers: buildAuthHeaders(""),
            cache: "no-store",
        }
    );

    const responseText = await response.text();
    let parsedResponse: {
        data?: {
            id?: number;
            documentId?: string;
            sectors?: Array<{ id?: number; documentId?: string; name?: string }>;
            pdf?: { id?: number; documentId?: string; name?: string; url?: string } | null;
        };
    } | null = null;

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

    console.log("[SUBMIT-PAPER] Sector mapping fetch:", {
        status: response.status,
        response: responseText,
    });

    if (!response.ok) {
        return [...new Set(submittedDocumentIds)];
    }

    let parsedResponse: {
        data?: Array<{
            id?: number;
            documentId?: string;
            children?: Array<{ id?: number; documentId?: string }> | { data?: Array<{ id?: number; documentId?: string }> };
        }>;
    } | null = null;

    try {
        parsedResponse = responseText ? JSON.parse(responseText) : null;
    } catch {
        parsedResponse = null;
    }

    const documentIds = [...submittedDocumentIds];
    const seenDocumentIds = new Set(submittedDocumentIds);
    const queue = Array.isArray(parsedResponse?.data) ? [...parsedResponse.data] : [];

    while (queue.length > 0) {
        const current = queue.shift();

        if (!current) {
            continue;
        }

        if (
            typeof current.id === "number" &&
            sectorIds.includes(current.id) &&
            current.documentId &&
            !seenDocumentIds.has(current.documentId)
        ) {
            documentIds.push(current.documentId);
            seenDocumentIds.add(current.documentId);
        }

        const childItems = Array.isArray(current.children)
            ? current.children
            : Array.isArray(current.children?.data)
                ? current.children.data
                : [];

        for (const child of childItems) {
            if (
                typeof child?.id === "number" &&
                sectorIds.includes(child.id) &&
                child.documentId &&
                !seenDocumentIds.has(child.documentId)
            ) {
                documentIds.push(child.documentId);
                seenDocumentIds.add(child.documentId);
            }
        }
    }

    console.log("[SUBMIT-PAPER] Resolved sector documentIds:", {
        sectorIds,
        submittedDocumentIds,
        documentIds,
    });

    return documentIds;
}

async function attachSectorsToPaper({
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
        return {
            attached: true,
            entryId: entryId ?? null,
            documentId: documentId ?? null,
        };
    }

    const candidateIdentifiers = [documentId]
        .filter((value) => value !== null && value !== undefined && value !== "")
        .map((value) => String(value));

    const payloads = [
        sectorDocumentIds.length > 0
            ? {
                sectors: {
                    set: sectorDocumentIds.map((resolvedDocumentId) => ({ documentId: resolvedDocumentId })),
                },
            }
            : null,
        sectorDocumentIds.length > 0
            ? {
                sectors: {
                    connect: sectorDocumentIds.map((resolvedDocumentId) => ({ documentId: resolvedDocumentId })),
                },
            }
            : null,
        sectorDocumentIds.length > 0
            ? {
                sectors: sectorDocumentIds,
            }
            : null,
        sectorDocumentIds.length > 0
            ? {
                sectors: sectorDocumentIds.map((resolvedDocumentId) => ({ documentId: resolvedDocumentId })),
            }
            : null,
        sectorIds.length > 0
            ? {
                sectors: {
                    set: sectorIds.map((id) => ({ id })),
                },
            }
            : null,
        sectorIds.length > 0 ? { sectors: sectorIds } : null,
        sectorIds.length > 0
            ? {
                sectors: {
                    connect: sectorIds.map((id) => ({ id })),
                },
            }
            : null,
        sectorIds.length > 0
            ? {
                sectors: {
                    connect: sectorIds,
                },
            }
            : null,
    ].filter(Boolean) as Array<Record<string, unknown>>;

    for (const identifier of candidateIdentifiers) {
        for (const payload of payloads) {
            const result = await updatePaperDocumentVersion({
                identifier,
                payload,
                status: "draft",
            });

            console.log("[SUBMIT-PAPER] Sector attach attempt:", {
                identifier,
                payload,
                status: result.statusCode,
                response: result.responseText,
            });

            if (result.ok) {
                const snapshot = await fetchPaperSnapshot({
                    identifier: documentId ?? identifier,
                    status: "draft",
                });

                console.log("[SUBMIT-PAPER] Sector verification snapshot:", {
                    identifier: documentId ?? identifier,
                    status: snapshot.statusCode,
                    response: snapshot.responseText,
                });

                const snapshotSectors = snapshot.parsedResponse?.data?.sectors ?? [];
                const snapshotSectorIds = new Set(
                    snapshotSectors
                        .map((sector) => sector?.id)
                        .filter((id): id is number => Number.isFinite(id))
                );
                const snapshotSectorDocumentIds = new Set(
                    snapshotSectors
                        .map((sector) => sector?.documentId)
                        .filter((value): value is string => Boolean(value))
                );
                const allNumericIdsAttached = sectorIds.length === 0 || sectorIds.every((id) => snapshotSectorIds.has(id));
                const allDocumentIdsAttached =
                    sectorDocumentIds.length === 0 ||
                    sectorDocumentIds.every((resolvedDocumentId) => snapshotSectorDocumentIds.has(resolvedDocumentId));
                const allAttached = allNumericIdsAttached || allDocumentIdsAttached;

                if (!allAttached) {
                    continue;
                }

                return {
                    attached: true,
                    entryId: result.parsedResponse?.data?.id ?? entryId ?? null,
                    documentId: result.parsedResponse?.data?.documentId ?? documentId ?? null,
                };
            }
        }
    }

    console.error("[SUBMIT-PAPER] Failed to attach sectors after all attempts:", {
        entryId,
        documentId,
        sectorIds,
    });

    return {
        attached: false,
        entryId: entryId ?? null,
        documentId: documentId ?? null,
    };
}

async function uploadPaperPdf({
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

    for (const refId of candidateRefIds) {
        const uploadFormData = new FormData();
        uploadFormData.append("files", pdfFile, pdfFile.name);
        uploadFormData.append("ref", "api::paper-submission.paper-submission");
        uploadFormData.append("refId", refId);
        uploadFormData.append("field", "pdf");

        const uploadResponse = await fetch(`${STRAPI_URL}/api/upload`, {
            method: "POST",
            headers: buildAuthHeaders(""),
            body: uploadFormData,
            cache: "no-store",
        });

        const uploadText = await uploadResponse.text();
        let uploadedFiles: Array<{ id?: number; documentId?: string }> = [];

        try {
            uploadedFiles = uploadText ? JSON.parse(uploadText) : [];
        } catch {
            uploadedFiles = [];
        }

        console.log("[SUBMIT-PAPER] Upload attempt:", {
            refId,
            status: uploadResponse.status,
            response: uploadText,
        });

        lastStatus = uploadResponse.status;

        if (uploadResponse.ok) {
            return {
                ok: true,
                statusCode: uploadResponse.status,
                mediaId: uploadedFiles?.[0]?.id ?? null,
                mediaDocumentId: uploadedFiles?.[0]?.documentId ?? null,
            };
        }
    }

    console.error("[SUBMIT-PAPER] Failed to upload file after all attempts:", {
        entryId,
        documentId,
        fileName: pdfFile.name,
    });

    return {
        ok: false,
        statusCode: lastStatus,
        mediaId: null,
        mediaDocumentId: null,
    };
}

async function attachPdfToPaper({
    entryId,
    documentId,
    mediaId,
}: {
    entryId?: number | null;
    documentId?: string | null;
    mediaId?: number | null;
}) {
    if (!mediaId) {
        return;
    }

    const candidateIdentifiers = [documentId]
        .filter((value) => value !== null && value !== undefined && value !== "")
        .map((value) => String(value));

    const payloads = [
        { pdf: mediaId },
        { pdf: { connect: [mediaId] } },
        { pdf: { connect: [{ id: mediaId }] } },
    ];

    for (const identifier of candidateIdentifiers) {
        for (const payload of payloads) {
            const result = await updatePaperDocumentVersion({
                identifier,
                payload,
                status: "draft",
            });
            console.log("[SUBMIT-PAPER] PDF attach attempt:", {
                identifier,
                payload,
                status: result.statusCode,
                response: result.responseText,
            });

            if (result.ok) {
                return;
            }
        }
    }

    console.error("[SUBMIT-PAPER] Failed to attach file relation after all attempts:", {
        entryId,
        documentId,
        mediaId,
    });
}

async function logPaperSnapshot({
    entryId,
    documentId,
}: {
    entryId?: number | null;
    documentId?: string | null;
}) {
    const candidateIdentifiers = [documentId, entryId]
        .filter((value) => value !== null && value !== undefined && value !== "")
        .map((value) => String(value));

    for (const identifier of candidateIdentifiers) {
        for (const status of ["draft", undefined, "published"] as const) {
            const suffix = status ? `&status=${status}` : "";
            const response = await fetch(
                `${STRAPI_URL}/api/paper-submissions/${identifier}?populate[sectors][fields][0]=name&populate[pdf][fields][0]=url&populate[pdf][fields][1]=name${suffix}`,
                {
                    headers: buildAuthHeaders(""),
                    cache: "no-store",
                }
            );

            const responseText = await response.text();
            console.log("[SUBMIT-PAPER] Final snapshot attempt:", {
                identifier,
                statusFilter: status ?? "default",
                status: response.status,
                response: responseText,
            });

            if (response.ok && status === "draft") {
                break;
            }
        }
    }
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const dataString = formData.get("data") as string;
        const pdfFile = formData.get("files.pdf") as File | null;

        console.log("[SUBMIT-PAPER] Raw data string:", dataString);
        console.log("[SUBMIT-PAPER] Has File:", !!pdfFile, pdfFile?.name, pdfFile?.size);

        const data = JSON.parse(dataString);
        const rawSector = data.sector ?? data.sectors;
        const sectorSelection = normalizeSectorSelection(rawSector);
        const sectorIds = sectorSelection.ids;
        const sectorDocumentIds = await resolveSectorDocumentIds({
            sectorIds,
            submittedDocumentIds: sectorSelection.documentIds,
        });

        console.log("[SUBMIT-PAPER] Parsed data keys:", Object.keys(data));
        console.log("[SUBMIT-PAPER] sector field:", data.sector, "| sectors field:", data.sectors);
        console.log("[SUBMIT-PAPER] sectorIds after normalization:", sectorIds);
        console.log("[SUBMIT-PAPER] sectorDocumentIds after normalization:", sectorDocumentIds);

        const strapiData: Record<string, unknown> = {};
        const scalarFields = [
            "title",
            "author_name",
            "author_email",
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

        const abstractBlocks = buildAbstractBlocks(data.abstract);
        if (abstractBlocks) {
            strapiData.abstract = abstractBlocks;
        }

        console.log("[SUBMIT-PAPER] Final base payload:", JSON.stringify({ data: strapiData }));

        const createdEntry = await createPaperEntry(strapiData);

        if (!createdEntry.ok) {
            return NextResponse.json(createdEntry.body, { status: createdEntry.status });
        }

        const created = createdEntry.body as {
            data?: {
                id?: number;
                documentId?: string;
            };
        };

        const entryId = created?.data?.id ?? null;
        const documentId = created?.data?.documentId ?? null;

        console.log("[SUBMIT-PAPER] Created entry IDs:", { entryId, documentId });

        const updatedEntry = await attachSectorsToPaper({
            entryId,
            documentId,
            sectorIds,
            sectorDocumentIds,
        });

        if (sectorIds.length > 0 && !updatedEntry.attached) {
            return NextResponse.json(
                { error: { message: "Sector selection could not be saved. Please try again." } },
                { status: 500 }
            );
        }

        if (pdfFile) {
            const uploadedPdf = await uploadPaperPdf({
                pdfFile,
                entryId: updatedEntry?.entryId ?? entryId,
                documentId: updatedEntry?.documentId ?? documentId,
            });

            if (!uploadedPdf.ok) {
                const statusCode = uploadedPdf.statusCode || 500;
                const message = statusCode === 413
                    ? "File upload failed because the file is larger than the server upload limit. Please upload a smaller file."
                    : "File upload failed. Please try again with a smaller file or contact support.";

                return NextResponse.json(
                    { error: { message } },
                    { status: statusCode }
                );
            }

            await attachPdfToPaper({
                entryId: updatedEntry?.entryId ?? entryId,
                documentId: updatedEntry?.documentId ?? documentId,
                mediaId: uploadedPdf.mediaId,
            });
        } else {
            console.log("[SUBMIT-PAPER] Skipping file upload - no file provided.");
        }

        await logPaperSnapshot({
            entryId: updatedEntry?.entryId ?? entryId,
            documentId: updatedEntry?.documentId ?? documentId,
        });

        try {
            await sendAbstractSubmissionAuthorConfirmation(
                (strapiData.author_email as string) || "",
                (strapiData.author_name as string) || "",
                (strapiData.title as string) || ""
            );
        } catch (emailError) {
            console.error("[SUBMIT-PAPER] Failed to send author confirmation email:", emailError);
        }

        try {
            const { userId } = await auth();
            if (userId) {
                await markUserAsAbstractSubmitter(userId, {
                    institution: strapiData.institution as string | undefined,
                    profession: strapiData.Profession as string | undefined,
                });
            }
        } catch (dbError) {
            console.error("[SUBMIT-PAPER] Failed to update user profile in DB:", dbError);
        }

        return NextResponse.json(created, { status: createdEntry.status });
    } catch (error) {
        console.error("[SUBMIT-PAPER] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
