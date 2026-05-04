import { createRssResponse } from "@/lib/rss";

export const revalidate = 3600;

export async function GET() {
  return createRssResponse({
    title: "ENERGDIVE",
    description:
      "Latest energy news, analysis, reports, interviews, and editorial content from ENERGDIVE.",
    feedPath: "/rss.xml",
  });
}
