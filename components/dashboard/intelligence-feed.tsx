"use client";

import { useDashboard } from "@/components/dashboard/dashboard-shell";
import { FeedCard } from "@/components/dashboard/feed-card";

export function IntelligenceFeed() {
    const { profile } = useDashboard();

    // In a real app, we'd fetch mixed feed data. For now, generate a unified list.
    const feedItems = generateFeed(profile.industry_name);

    return (
        <div className="divide-y divide-gray-100">
            {feedItems.map((item) => (
                <FeedCard key={item.id} item={item} />
            ))}
        </div>
    );
}

function generateFeed(industry: string | null) {
    const ind = industry || "Energy";
    return [
        {
            id: "1",
            category: "Policy & Regulation",
            readTime: "8 min read",
            title: `The Future of Renewable Energy: Policy Shifts in 2026`,
            summary: "An in-depth analysis of the latest regulatory changes affecting renewable energy adoption across global markets, focusing on EU and US subsidies.",
            author: "Dr. Sarah Mitchell",
            date: "Jan 8, 2026"
        },
        {
            id: "2",
            category: "Technology & Innovation",
            readTime: "12 min read",
            title: `Battery Storage Technologies: Market Analysis Q1 2026`,
            summary: "Comprehensive market overview of emerging battery storage solutions and their impact on grid infrastructure stability and peak load management.",
            author: "James Chen",
            date: "Jan 7, 2026"
        },
        {
            id: "3",
            category: "Market & Industry",
            readTime: "10 min read",
            title: `Carbon Markets: Trading Dynamics and Price Forecasts`,
            summary: "Expert insights on carbon credit markets and projected pricing trends through 2027. What every energy trader needs to know about the evolving landscape.",
            author: "Maria Rodriguez",
            date: "Jan 6, 2026"
        },
        {
            id: "4",
            category: "Technology & Innovation",
            readTime: "15 min read",
            title: `${ind} Infrastructure: Digital Transformation Roadmap`,
            summary: `How leading ${ind.toLowerCase()} companies are leveraging AI and IoT to optimize asset performance and reduce operational costs by up to 20%.`,
            author: "David Kim",
            date: "Jan 5, 2026"
        }
    ];
}
