import { ISSUES_PAGE_METADATA } from "@/lib/route-metadata";

export const metadata = ISSUES_PAGE_METADATA;

export default function IssuesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
