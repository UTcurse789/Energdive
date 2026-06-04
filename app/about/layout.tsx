import { ABOUT_PAGE_METADATA } from "@/lib/route-metadata";

export const metadata = ABOUT_PAGE_METADATA;

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
