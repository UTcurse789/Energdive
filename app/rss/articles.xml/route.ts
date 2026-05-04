import { createRssResponse } from "@/lib/rss";

export const revalidate = 3600;

export async function GET() {
  return createRssResponse({
    title: "ENERGDIVE Articles",
    description: "Latest articles and feature coverage from ENERGDIVE.",
    feedPath: "/rss/articles.xml",
    contentType: "Articles",
  });
}
