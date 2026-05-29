import { NEWS_PAGE_METADATA } from "@/lib/route-metadata";

export const metadata = NEWS_PAGE_METADATA;

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
