import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserDownloadById } from "@/lib/queries";
import { addIpWatermark } from "@/lib/pdf-watermark";
import { fetchPaperSubmissions } from "@/lib/paper-submissions-server";

export const dynamic = "force-dynamic";

const PAPER_QUERY =
    "populate[abstract_pdf][fields][0]=url&populate[abstract_pdf][fields][1]=ext&populate[final_paper_submissions][fields][0]=final_status&populate[final_paper_submissions][populate][full_paper][fields][0]=url&populate[final_paper_submissions][populate][full_paper][fields][1]=ext&sort[0]=submitted_date:desc&pagination[pageSize]=100";

function slugify(text: string) {
    return String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0]
    : req.headers.get("x-real-ip") ||
      req.headers.get("x-client-ip") ||
      req.headers.get("cf-connecting-ip");
  return ip ? ip.trim() : "Unknown";
}

function extractFileUrl(obj: unknown): string | null {
    if (!obj) return null;
    if (typeof obj === "string") {
        const base =
            process.env.STRAPI_API_URL ||
            process.env.NEXT_PUBLIC_STRAPI_API_URL ||
            process.env.NEXT_PUBLIC_STRAPI_URL ||
            "https://cms-staging.energdive.com";
        return obj.startsWith("http") ? obj : `${base}${obj}`;
    }
    if (typeof obj !== "object") return null;

    // Handle various Strapi relation shapes
    const data = obj as Record<string, unknown>;
    let url: unknown = null;

    // { data: { attributes: { url } } }
    if (data.data && typeof data.data === "object") {
        const inner = data.data as Record<string, unknown>;
        if (inner.attributes && typeof inner.attributes === "object") {
            url = (inner.attributes as Record<string, unknown>).url;
        }
        if (!url) url = inner.url;
    }
    // { attributes: { url } }
    if (!url && data.attributes && typeof data.attributes === "object") {
        url = (data.attributes as Record<string, unknown>).url;
    }
    // { url }
    if (!url) url = data.url;

    if (typeof url !== "string") return null;
    const base =
        process.env.STRAPI_API_URL ||
        process.env.NEXT_PUBLIC_STRAPI_API_URL ||
        process.env.NEXT_PUBLIC_STRAPI_URL ||
        "https://cms-staging.energdive.com";
    return url.startsWith("http") ? url : `${base}${url}`;
}

async function resolvePaperFileUrl(slug: string): Promise<string | null> {
    try {
        const papers = await fetchPaperSubmissions(PAPER_QUERY);
        console.log("[SECURE_DOWNLOAD] Total papers from Strapi:", papers.length);

        const paper = (papers as any[]).find((p: any) =>
            String(p.status ?? "").toLowerCase() === "accepted" &&
            slugify(p.title || "") === slug
        );

        if (!paper) {
            console.log("[SECURE_DOWNLOAD] No matching paper found for slug:", slug);
            return null;
        }

        console.log("[SECURE_DOWNLOAD] Found paper:", {
            title: paper.title,
            status: paper.status,
            hasFinalPaperPdf: !!paper.finalPaperPdf,
            finalPaperPdfType: typeof paper.finalPaperPdf,
            finalPaperPdfValue: JSON.stringify(paper.finalPaperPdf)?.slice(0, 200),
            finalSubmissionsCount: paper.finalPaperSubmissions?.length ?? 0,
            hasAbstractPdf: !!paper.pdf,
        });

        // Prefer final paper
        if (paper.finalPaperPdf) {
            const url = extractFileUrl(paper.finalPaperPdf);
            console.log("[SECURE_DOWNLOAD] finalPaperPdf URL:", url);
            if (url) return url;
        }
        if (Array.isArray(paper.finalPaperSubmissions)) {
            for (const fp of paper.finalPaperSubmissions) {
                console.log("[SECURE_DOWNLOAD] Checking final submission:", {
                    finalStatus: fp.finalStatus,
                    fullPaperType: typeof fp.fullPaper,
                    fullPaperValue: JSON.stringify(fp.fullPaper)?.slice(0, 200),
                });
                const url = extractFileUrl(fp.fullPaper);
                if (url) {
                    console.log("[SECURE_DOWNLOAD] Found final paper URL from submissions:", url);
                    return url;
                }
            }
        }
        // Fallback to abstract
        const abstractUrl = extractFileUrl(paper.pdf);
        console.log("[SECURE_DOWNLOAD] Falling back to abstract PDF URL:", abstractUrl);
        if (abstractUrl) return abstractUrl;
    } catch (error) {
        console.error("[SECURE_DOWNLOAD] Failed to resolve live paper URL:", error);
    }
    return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const downloadId = parseInt(id, 10);

    if (isNaN(downloadId)) {
      return new NextResponse("Invalid download ID", { status: 400 });
    }

    const download = await getUserDownloadById(downloadId, userId);
    if (!download) {
      return new NextResponse("Download not found or unauthorized", { status: 404 });
    }

    // For paper downloads, fetch the latest file URL from Strapi (prefer final paper over abstract)
    let fileUrlToFetch = download.pdf_url;
    if (download.item_type === "paper" && download.paper_slug) {
        const liveUrl = await resolvePaperFileUrl(download.paper_slug);
        if (liveUrl) {
            fileUrlToFetch = liveUrl;
        }
    }

    if (!fileUrlToFetch) {
      return new NextResponse("File is not available for this resource", { status: 404 });
    }

    const fileResponse = await fetch(fileUrlToFetch, { cache: "no-store" });
    if (!fileResponse.ok || !fileResponse.body) {
      console.error("[SECURE_DOWNLOAD] Failed to proxy resource file", {
        id: downloadId,
        status: fileResponse.status,
      });
      return new NextResponse("Unable to fetch resource file", { status: 502 });
    }

    const fileUrl = fileUrlToFetch;
    let ext = ".pdf";
    if (fileUrl) {
      const urlExt = fileUrl.split('.').pop()?.split(/[#?]/)[0];
      if (urlExt && urlExt.length > 0 && urlExt.length <= 4) {
        ext = `.${urlExt}`;
      }
    }
    const filename = `${download.paper_slug || "download"}${ext}`;
    
    let ipAddress = getClientIp(req);
    if (
      process.env.NODE_ENV === "development" &&
      (ipAddress === "::1" || ipAddress === "127.0.0.1" || ipAddress === "Unknown")
    ) {
      try {
        const ipRes = await fetch("https://api.ipify.org");
        if (ipRes.ok) ipAddress = await ipRes.text();
      } catch (e) {
        // ignore
      }
    }
    
    const arrayBuffer = await fileResponse.arrayBuffer();
    
    let outBuffer: Uint8Array = new Uint8Array(arrayBuffer);
    if (ext.toLowerCase() === ".pdf") {
      outBuffer = await addIpWatermark(arrayBuffer, ipAddress);
    }

    let contentType = fileResponse.headers.get("content-type") || "application/pdf";
    // Basic fallback mapping for doc/docx if headers are missing
    if (ext.toLowerCase() === ".docx" && (!contentType || contentType === "application/pdf" || contentType === "application/octet-stream")) {
        contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    } else if (ext.toLowerCase() === ".doc" && (!contentType || contentType === "application/pdf" || contentType === "application/octet-stream")) {
        contentType = "application/msword";
    }

    return new NextResponse(Buffer.from(outBuffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[SECURE_DOWNLOAD] Failed to proxy download:", error);
    return new NextResponse("Unable to process secure download", { status: 500 });
  }
}
