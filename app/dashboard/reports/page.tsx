"use client";

import { useDashboard } from "@/components/dashboard/dashboard-shell";
import { FileBarChart2, Download, ArrowRight, TrendingUp, Globe, Zap } from "lucide-react";

interface Report {
    id: string;
    title: string;
    description: string;
    category: string;
    date: string;
    pages: number;
    type: "flagship" | "sector" | "brief";
}

const TYPE_STYLES: Record<string, { color: string; icon: React.ReactNode }> = {
    flagship: { color: "#E5B866", icon: <TrendingUp size={16} /> },
    sector: { color: "#0AB996", icon: <Globe size={16} /> },
    brief: { color: "#8B5CF6", icon: <Zap size={16} /> },
};

function generateReports(industry: string | null, subIndustry: string | null): Report[] {
    const ind = industry || "Energy";
    const sub = subIndustry || "Renewables";

    return [
        {
            id: "r1",
            title: `${ind} Annual Review 2025: Trends, Challenges & Outlook`,
            description: `EnergDive's flagship report analyzing 12 months of ${ind.toLowerCase()} market data, 40+ expert interviews, and forward-looking projections for the sector.`,
            category: "Annual Review",
            date: "Jan 2026",
            pages: 128,
            type: "flagship",
        },
        {
            id: "r2",
            title: `${sub} Market Sizing & Opportunity Map Q1 2026`,
            description: `Comprehensive market sizing for the ${sub.toLowerCase()} sub-sector with TAM/SAM/SOM analysis, competitive landscape, and investment opportunity mapping.`,
            category: "Market Sizing",
            date: "Feb 2026",
            pages: 64,
            type: "sector",
        },
        {
            id: "r3",
            title: `Global ${ind} Policy Tracker — February 2026`,
            description: `Monthly digest of regulatory changes, subsidy programs, and policy developments across 30+ countries affecting the ${ind.toLowerCase()} sector.`,
            category: "Policy Tracker",
            date: "Feb 2026",
            pages: 42,
            type: "brief",
        },
        {
            id: "r4",
            title: `${ind} Technology Benchmark Report 2025`,
            description: `Side-by-side comparison of leading technologies in the ${ind.toLowerCase()} space with LCOE analysis, efficiency metrics, and deployment roadmaps.`,
            category: "Technology",
            date: "Dec 2025",
            pages: 96,
            type: "flagship",
        },
        {
            id: "r5",
            title: `${sub} Investment & Funding Landscape`,
            description: `Tracking $12.4B in new commitments to ${sub.toLowerCase()} infrastructure. Detailed breakdown of VC rounds, PE deals, and public market activity.`,
            category: "Investment",
            date: "Jan 2026",
            pages: 54,
            type: "sector",
        },
        {
            id: "r6",
            title: `Weekly ${ind} Intelligence Brief — W7 2026`,
            description: `Curated weekly summary of the most important developments in the ${ind.toLowerCase()} sector. Key deals, policy moves, and technology milestones.`,
            category: "Weekly Brief",
            date: "Feb 14, 2026",
            pages: 12,
            type: "brief",
        },
    ];
}

export default function ReportsPage() {
    const { profile } = useDashboard();
    const reports = generateReports(profile.industry_name, profile.sub_industry_name);

    return (
        <>
            <div className="mb-8">
                <h1
                    className="text-2xl lg:text-3xl font-bold font-serif mb-1"
                    style={{ color: "var(--dash-text)" }}
                >
                    Market Reports
                </h1>
                <p className="text-sm" style={{ color: "var(--dash-text-muted)" }}>
                    In-depth research reports and intelligence briefs tailored to your industry.
                </p>
            </div>

            {/* Report Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {reports.map((report, idx) => {
                    const style = TYPE_STYLES[report.type];
                    return (
                        <article
                            key={report.id}
                            className="group rounded-xl p-5 border transition-all duration-300 hover:translate-y-[-2px] cursor-pointer animate-fade-in-up"
                            style={{
                                background: "var(--dash-surface)",
                                borderColor: "var(--dash-border-subtle)",
                                animationDelay: `${idx * 60}ms`,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = style.color + "60";
                                e.currentTarget.style.background = "var(--dash-surface-hover)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "var(--dash-border-subtle)";
                                e.currentTarget.style.background = "var(--dash-surface)";
                            }}
                        >
                            {/* Top row */}
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 rounded-lg" style={{ background: style.color + "18" }}>
                                    {style.icon}
                                </div>
                                <span
                                    className="text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-0.5 rounded-full"
                                    style={{ background: style.color + "18", color: style.color }}
                                >
                                    {report.category}
                                </span>
                                <span className="ml-auto text-xs" style={{ color: "var(--dash-text-dim)" }}>
                                    {report.date}
                                </span>
                            </div>

                            {/* Title */}
                            <h3 className="text-base font-bold mb-2 leading-snug font-serif" style={{ color: "var(--dash-text)" }}>
                                {report.title}
                            </h3>

                            {/* Description */}
                            <p className="text-sm leading-relaxed line-clamp-2 mb-4" style={{ color: "var(--dash-text-muted)" }}>
                                {report.description}
                            </p>

                            {/* Footer */}
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--dash-text-dim)" }}>
                                    <FileBarChart2 size={12} />
                                    {report.pages} pages
                                </span>
                                <div className="flex items-center gap-3">
                                    <button
                                        className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-colors hover:opacity-80"
                                        style={{ color: "var(--dash-text-muted)" }}
                                    >
                                        <Download size={12} /> PDF
                                    </button>
                                    <button
                                        className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider group-hover:gap-2 transition-all"
                                        style={{ color: style.color }}
                                    >
                                        Read <ArrowRight size={12} />
                                    </button>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        </>
    );
}
