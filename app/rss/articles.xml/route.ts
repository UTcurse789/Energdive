import { createRssResponse, RSS_REVALIDATE } from "@/lib/rss";

export const revalidate = RSS_REVALIDATE;

export async function GET() {
  return createRssResponse({
    title: "ENERGDIVE Articles",
    description: "Latest articles and feature coverage from ENERGDIVE.",
    feedPath: "/rss/articles.xml",
    contentType: "Articles",
  });
}
