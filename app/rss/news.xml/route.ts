import { createRssResponse } from "@/lib/rss";

export const revalidate = 3600;

export async function GET() {
  return createRssResponse({
    title: "ENERGDIVE News",
    description: "Latest news coverage from ENERGDIVE.",
    feedPath: "/rss/news.xml",
    contentType: "News",
  });
}
