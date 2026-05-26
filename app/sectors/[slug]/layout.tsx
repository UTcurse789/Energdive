import type { Metadata } from "next";
import { getSectorPageMetadata } from "@/lib/route-metadata";

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug = "" } = await params;
  return getSectorPageMetadata(slug);
}

export default function SectorSlugLayout({
  children,
}: Props) {
  return <>{children}</>;
}
