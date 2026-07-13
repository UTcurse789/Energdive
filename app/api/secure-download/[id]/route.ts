import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserDownloadById } from "@/lib/queries";
import { addIpWatermark } from "@/lib/pdf-watermark";

export const dynamic = "force-dynamic";

function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0]
    : req.headers.get("x-real-ip") ||
      req.headers.get("x-client-ip") ||
      req.headers.get("cf-connecting-ip");
  return ip ? ip.trim() : "Unknown";
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

    if (!download.pdf_url) {
      return new NextResponse("File is not available for this resource", { status: 404 });
    }

    const fileResponse = await fetch(download.pdf_url, { cache: "no-store" });
    if (!fileResponse.ok || !fileResponse.body) {
      console.error("[SECURE_DOWNLOAD] Failed to proxy resource file", {
        id: downloadId,
        status: fileResponse.status,
      });
      return new NextResponse("Unable to fetch resource file", { status: 502 });
    }

    const filename = `${download.paper_slug || "download"}.pdf`;
    
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
    const watermarkedBuffer = await addIpWatermark(arrayBuffer, ipAddress);

    return new NextResponse(watermarkedBuffer, {
      headers: {
        "Content-Type": fileResponse.headers.get("content-type") || "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[SECURE_DOWNLOAD] Failed to proxy download:", error);
    return new NextResponse("Unable to process secure download", { status: 500 });
  }
}
