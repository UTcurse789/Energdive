import { EVENTS_PAGE_METADATA } from "@/lib/route-metadata";

export const metadata = EVENTS_PAGE_METADATA;

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
