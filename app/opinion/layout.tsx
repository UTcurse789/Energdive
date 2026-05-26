import { OPINION_PAGE_METADATA } from "@/lib/route-metadata";

export const metadata = OPINION_PAGE_METADATA;

export default function OpinionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
