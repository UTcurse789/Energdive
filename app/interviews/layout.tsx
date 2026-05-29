import { INTERVIEWS_PAGE_METADATA } from "@/lib/route-metadata";

export const metadata = INTERVIEWS_PAGE_METADATA;

export default function InterviewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
