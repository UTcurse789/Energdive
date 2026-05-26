import { SECTORS_PAGE_METADATA } from "@/lib/route-metadata";

export const metadata = SECTORS_PAGE_METADATA;

export default function SectorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
