import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ENERGDIVE EVENTS | Energy Industry Experiences",
  description:
    "Discover ENERGDIVE EVENTS, a dedicated destination for energy conferences, exhibitions, forums, and industry gatherings.",
  alternates: { canonical: "/energdive-events" },
};

export default function EnergdiveEventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
