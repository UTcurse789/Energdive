import { createRssResponse, RSS_REVALIDATE } from "@/lib/rss";

export const revalidate = RSS_REVALIDATE;

export async function GET() {
  return createRssResponse({
    title: "ENERGDIVE News",
    description: "Latest news coverage from ENERGDIVE.",
    feedPath: "/rss/news.xml",
    contentType: "News",
  });
}
