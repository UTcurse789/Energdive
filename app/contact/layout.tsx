import { CONTACT_PAGE_METADATA } from "@/lib/route-metadata";

export const metadata = CONTACT_PAGE_METADATA;

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
