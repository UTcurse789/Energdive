import { VIDEOS_PAGE_METADATA } from "@/lib/route-metadata";

export const metadata = VIDEOS_PAGE_METADATA;

export default function VideosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
