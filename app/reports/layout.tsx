import { REPORTS_PAGE_METADATA } from "@/lib/route-metadata";

export const metadata = REPORTS_PAGE_METADATA;

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
