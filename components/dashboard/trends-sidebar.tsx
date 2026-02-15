"use client";

import { FileBarChart2 } from "lucide-react";

export function TrendsSidebar() {
    return (
        <div className="space-y-6">
            {/* Trending This Week */}
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <h3 className="font-bold text-gray-900">Trending This Week</h3>
                </div>

                <div className="space-y-6">
                    <TrendItem
                        category="Market Analysis"
                        title="Global LNG Market Outlook 2026"
                        views="12.4K"
                    />
                    <TrendItem
                        category="Technology"
                        title="AI in Energy Grid Management"
                        views="8.9K"
                    />
                    <TrendItem
                        category="Policy"
                        title="EU Green Deal: Latest Updates"
                        views="7.2K"
                    />
                    <TrendItem
                        category="Innovation"
                        title="Solar Panel Efficiency Breakthroughs"
                        views="6.8K"
                    />
                </div>
            </div>

            {/* Feature Teaser */}
            <div className="rounded-xl p-8 text-center" style={{ background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)" }}>
                <div className="mx-auto w-12 h-12 bg-[#0AB996] rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-200">
                    <FileBarChart2 size={24} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">More Features Coming</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                    Data tools, AI insights, and executive lounges will be added soon.
                </p>
            </div>
        </div>
    );
}

function TrendItem({ category, title, views }: { category: string; title: string; views: string }) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider border border-gray-200 px-1.5 py-0.5 rounded">
                    {category}
                </span>
                <span className="text-xs text-gray-400">{views} views</span>
            </div>
            <h4 className="text-sm font-semibold text-gray-900 hover:text-[var(--dash-accent)] cursor-pointer transition-colors leading-snug">
                {title}
            </h4>
        </div>
    );
}
