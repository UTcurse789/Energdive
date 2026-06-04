import { SUBSCRIBE_PAGE_METADATA } from "@/lib/route-metadata";

export const metadata = SUBSCRIBE_PAGE_METADATA;

export default function SubscribeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
