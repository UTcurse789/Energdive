import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserDownloads } from "@/lib/queries";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ downloadedResourceSlugs: [] }, { status: 401 });
    }

    const downloads = await getUserDownloads(userId);
    const downloadedResourceSlugs = downloads
      .filter((download) => download.item_type === "resource")
      .map((download) => download.paper_slug);

    return NextResponse.json({ downloadedResourceSlugs });
  } catch (error) {
    console.error("[USER_DOWNLOADS]", error);
    return NextResponse.json(
      { error: "Unable to load downloads", downloadedResourceSlugs: [] },
      { status: 500 }
    );
  }
}
