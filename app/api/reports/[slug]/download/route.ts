import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { saveArticleForUser } from "@/lib/queries/saved-articles";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || "";

export const dynamic = "force-dynamic";

type ReportPdfMeta = {
  url: string;
  name: string;
};

function readAttrs(item: unknown): Record<string, unknown> {
  if (!item || typeof item !== "object") return {};

  const record = item as Record<string, unknown>;
  const attributes = record.attributes;

  return attributes && typeof attributes === "object"
    ? (attributes as Record<string, unknown>)
    : record;
}

function getRelationData(relation: unknown) {
  if (!relation || typeof relation !== "object") return null;

  const value = relation as {
    data?: unknown;
    attributes?: unknown;
    url?: unknown;
    name?: unknown;
  };

  if (Array.isArray(value.data)) {
    const first = value.data[0] as { attributes?: unknown } | undefined;
    return first?.attributes ?? first ?? null;
  }

  if (value.data && typeof value.data === "object") {
    const data = value.data as { attributes?: unknown };
    return data.attributes ?? data;
  }

  return value.attributes ?? relation;
}

function extractPdfMeta(pdf: unknown): ReportPdfMeta | null {
  if (!pdf) return null;

  const data = getRelationData(Array.isArray(pdf) ? pdf[0] : pdf);
  if (!data || typeof data !== "object") return null;

  const attrs = data as { url?: unknown; name?: unknown };
  if (typeof attrs.url !== "string" || !attrs.url) return null;

  const url = attrs.url.startsWith("http")
    ? attrs.url
    : `${STRAPI_URL.replace(/\/$/, "")}${attrs.url.startsWith("/") ? "" : "/"}${attrs.url}`;
  const name =
    typeof attrs.name === "string" && attrs.name.trim()
      ? attrs.name.trim()
      : "energdive-report.pdf";

  return { url, name };
}

function safeFilename(value: string) {
  const fallback = "energdive-report.pdf";
  const normalized = value
    .replace(/\.pdf$/i, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);

  return `${normalized || fallback.replace(/\.pdf$/i, "")}.pdf`;
}

async function fetchReport(slug: string) {
  const url = new URL("/api/contents", STRAPI_URL.replace(/\/$/, ""));
  url.searchParams.set("filters[slug][$eq]", slug);
  url.searchParams.set("filters[type_of_content][name][$eq]", "Reports");
  url.searchParams.set("populate", "*");
  url.searchParams.set("pagination[pageSize]", "1");

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        ...(STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {}),
      },
    });
  } catch (error) {
    console.error("[REPORT_PDF_DOWNLOAD] Failed to fetch report from Strapi", error);
    return null;
  }

  if (!res.ok) {
    console.error("[REPORT_PDF_DOWNLOAD] Strapi report fetch failed", {
      status: res.status,
      statusText: res.statusText,
    });
    return null;
  }

  const json = (await res.json().catch((error) => {
    console.error("[REPORT_PDF_DOWNLOAD] Failed to parse Strapi response", error);
    return null;
  })) as { data?: unknown[] } | null;

  const item = json?.data?.[0];
  if (!item) return null;

  const report = readAttrs(item);
  const title =
    typeof report.Title === "string"
      ? report.Title
      : typeof report.title === "string"
        ? report.title
        : "ENERGDIVE Report";
  const pdf = extractPdfMeta(report.pdf || report.PDF);

  return { title, pdf };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { userId } = await auth();

  if (!userId) {
    const reportPage = `/reports/${slug}`;
    const redirectUrl = `/auth?redirect_url=${encodeURIComponent(reportPage)}`;
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  const report = await fetchReport(slug);
  if (!report) {
    return new NextResponse("Report not found", { status: 404 });
  }

  if (!report.pdf) {
    return new NextResponse("PDF not found for this report", { status: 404 });
  }

  try {
    const user = await currentUser();
    await saveArticleForUser(
      {
        clerkId: userId,
        email:
          user?.primaryEmailAddress?.emailAddress ||
          user?.emailAddresses?.[0]?.emailAddress ||
          null,
        firstName: user?.firstName || null,
        lastName: user?.lastName || null,
      },
      {
        title: report.title,
        url: `/reports/${slug}`,
      }
    );
  } catch (error) {
    console.error("[REPORT_PDF_DOWNLOAD] Failed to save report to dashboard", error);
  }

  let pdfResponse: Response;
  try {
    pdfResponse = await fetch(report.pdf.url, { cache: "no-store" });
  } catch (error) {
    console.error("[REPORT_PDF_DOWNLOAD] Failed to proxy PDF, redirecting to source", error);
    return NextResponse.redirect(report.pdf.url);
  }

  if (!pdfResponse.ok || !pdfResponse.body) {
    return NextResponse.redirect(report.pdf.url);
  }

  const filename = safeFilename(report.pdf.name || report.title);

  return new NextResponse(pdfResponse.body, {
    headers: {
      "Content-Type": pdfResponse.headers.get("content-type") || "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
