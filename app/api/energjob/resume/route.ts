import { NextResponse } from "next/server";
import {
  fetchResumeFromR2,
  parseAndVerifyResumeUrl,
} from "@/lib/energjob-resume-storage";

function contentDisposition(fileName: string) {
  const safeName = fileName.replace(/["\r\n]/g, "");
  return `inline; filename="${safeName}"`;
}

export async function GET(req: Request) {
  try {
    const details = parseAndVerifyResumeUrl(req.url);

    if (!details) {
      return NextResponse.json(
        { success: false, error: "Resume link is invalid." },
        { status: 400 }
      );
    }

    const r2Response = await fetchResumeFromR2(details.objectKey);
    const headers = new Headers();
    headers.set(
      "Content-Type",
      r2Response.headers.get("content-type") || "application/octet-stream"
    );
    headers.set("Content-Disposition", contentDisposition(details.fileName));
    headers.set("Cache-Control", "private, max-age=300");

    const contentLength = r2Response.headers.get("content-length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    return new Response(r2Response.body, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("[GET /api/energjob/resume]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Resume could not be opened." },
      { status: 500 }
    );
  }
}
