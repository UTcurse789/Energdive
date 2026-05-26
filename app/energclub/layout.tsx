import { ENERGCLUB_PAGE_METADATA } from "@/lib/route-metadata";

export const metadata = {
  ...ENERGCLUB_PAGE_METADATA,
  other: {
    ...ENERGCLUB_PAGE_METADATA.other,
    copyright: "© 2026 ENERGClub",
  },
};

export default function EnergclubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
