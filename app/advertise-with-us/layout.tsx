import { ADVERTISE_PAGE_METADATA } from "@/lib/route-metadata";

export const metadata = ADVERTISE_PAGE_METADATA;

export default function AdvertiseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
