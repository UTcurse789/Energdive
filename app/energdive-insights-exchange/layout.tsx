import { EIX_PAGE_METADATA } from "@/lib/route-metadata";

export const metadata = EIX_PAGE_METADATA;

export default function EnergdiveInsightsExchangeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
