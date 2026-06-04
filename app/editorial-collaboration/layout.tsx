import { EDITORIAL_COLLABORATION_PAGE_METADATA } from "@/lib/route-metadata";

export const metadata = EDITORIAL_COLLABORATION_PAGE_METADATA;

export default function EditorialCollaborationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
