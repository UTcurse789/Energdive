import { SectionHeading } from "@/components/ui/section-heading";
import { DataCard } from "@/components/ui/data-card";

const dataItems = [
    {
        title: "Global LNG Trade Flows 2025 Forecast",
        category: "Market Report",
        description: "In-depth analysis of changing trade routes and price differentials in the LNG market.",
    },
    {
        title: "European Power Grid Capacity Analysis",
        category: "Infrastructure Analysis",
        description: "Assessing the bottlenecks in transmission infrastructure critical for renewable integration.",
    },
    {
        title: "Battery Storage Cost Curves Q3 2024",
        category: "Technology Insight",
        description: "Detailed breakdown of component costs and manufacturing trends affecting BESS economics.",
    },
    {
        title: "Carbon Credit Price Volatility Index",
        category: "Data Dashboard",
        description: "Real-time tracking of voluntary carbon market pricing across major registries.",
    }
];

export function DataInsightsSection() {
    return (
        <section className="py-16 bg-muted/30 border-b border-border">
            <div className="container">
                <SectionHeading title="Data & Insights" linkText="Explore All Data" linkHref="/data" />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {dataItems.map((item, index) => (
                        <DataCard key={index} {...item} />
                    ))}
                </div>
            </div>
        </section>
    );
}
