import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const ENERGJOB_STRAPI_URL =
  process.env.ENERGJOB_STRAPI_URL ||
  process.env.ENERGJOB_STRAPI_API_URL ||
  "https://cms-staging.energdive.com";

const ENERGJOB_STRAPI_TOKEN = process.env.ENERGJOB_STRAPI_TOKEN || "";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Sign in is required before uploading a resume." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const resume = formData.get("resume");

    if (!(resume instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Resume file is required." },
        { status: 400 }
      );
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(resume.type)) {
      return NextResponse.json(
        { success: false, error: "Only PDF, JPEG, and PNG files are allowed." },
        { status: 400 }
      );
    }

    if (resume.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size must be 5MB or less." },
        { status: 400 }
      );
    }

    // Upload directly to Strapi media library
    const strapiFormData = new FormData();
    strapiFormData.append("files", resume, resume.name);

    const strapiUrl = `${ENERGJOB_STRAPI_URL.replace(/\/$/, "")}/api/upload`;
    const strapiResponse = await fetch(strapiUrl, {
      method: "POST",
      headers: {
        ...(ENERGJOB_STRAPI_TOKEN
          ? { Authorization: `Bearer ${ENERGJOB_STRAPI_TOKEN}` }
          : {}),
      },
      body: strapiFormData,
    });

    if (!strapiResponse.ok) {
      const errorText = await strapiResponse.text();
      console.error("[POST /api/energjob/resume-upload] Strapi upload failed:", errorText);
      throw new Error("Resume upload to CMS failed.");
    }

    const uploadResult = await strapiResponse.json();

    // Strapi returns an array of uploaded files
    const uploadedFile = Array.isArray(uploadResult) ? uploadResult[0] : uploadResult;

    if (!uploadedFile?.url) {
      throw new Error("Upload succeeded but no URL was returned from CMS.");
    }

    // Build the full resume URL — Strapi may return a relative path
    const resumeUrl = uploadedFile.url.startsWith("http")
      ? uploadedFile.url
      : `${ENERGJOB_STRAPI_URL.replace(/\/$/, "")}${uploadedFile.url}`;

    return NextResponse.json({
      success: true,
      resumeUrl,
      fileName: uploadedFile.name || resume.name,
      mimeType: uploadedFile.mime || resume.type,
      size: uploadedFile.size || resume.size,
      strapiFileId: uploadedFile.id,
    });
  } catch (error: any) {
    console.error("[POST /api/energjob/resume-upload]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Resume upload failed." },
      { status: 500 }
    );
  }
}
