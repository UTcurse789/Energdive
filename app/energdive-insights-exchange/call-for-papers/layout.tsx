import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Call for Papers | ENERGDIVE Insights Exchange",
    description: "Submit your research papers, case studies, sector outlooks, white papers, and technical notes to the ENERGDIVE Insights Exchange. Explore topics of interest and the submission process.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
