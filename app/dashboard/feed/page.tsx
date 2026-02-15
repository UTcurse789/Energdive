"use client";

import { useState } from "react";
import { FeedCard } from "@/components/dashboard/feed-card";
import { FileText, Gavel, TrendingUp, Zap } from "lucide-react";

const TABS = [
    { id: "editorial", label: "Editorial Analysis", icon: FileText },
    { id: "policy", label: "Policy & Regulation", icon: Gavel },
    { id: "market", label: "Market & Industry", icon: TrendingUp },
    { id: "tech", label: "Technology & Innovation", icon: Zap },
];

export default function IntelligencePage() {
    const [activeTab, setActiveTab] = useState("editorial");

    return (
        <div className="animate-fade-in-up">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Intelligence</h1>
                <p className="text-gray-500">Expert analysis, insights, and industry deep dives</p>
            </div>

            {/* Tabs */}
            <div className="bg-gray-100/80 p-1 rounded-xl flex items-center mb-8 overflow-x-auto">
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all whitespace-nowrap
                                ${isActive
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                                }
                            `}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content List */}
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <div className="divide-y divide-gray-100">
                    {/* Mock Content based on tab - reusing generic items for now but filtered in a real app */}
                    <FeedCard item={{
                        id: "1",
                        category: getCategoryLabel(activeTab),
                        readTime: "15 min read",
                        title: getTitleForTab(activeTab),
                        summary: "A comprehensive editorial examining the key drivers and challenges in the global energy transition through 2035.",
                        author: "Editorial Team",
                        date: "Jan 9, 2026"
                    }} />
                    <FeedCard item={{
                        id: "2",
                        category: getCategoryLabel(activeTab),
                        readTime: "12 min read",
                        title: "The New Energy Landscape: Winners and Losers",
                        summary: "Analysis of how the shifting energy paradigm is creating new opportunities while disrupting traditional business models.",
                        author: "Chief Editor",
                        date: "Jan 5, 2026"
                    }} />
                </div>
            </div>
        </div>
    );
}

function getCategoryLabel(tabId: string) {
    const tab = TABS.find(t => t.id === tabId);
    return tab ? tab.label : "Editorial Analysis";
}

function getTitleForTab(tabId: string) {
    if (tabId === 'policy') return "EU Green Deal Update: 2026 Directives";
    if (tabId === 'market') return "Global LNG Trade Flows Q1 2026";
    if (tabId === 'tech') return "Hydrogen Electrolyzer Efficiency Breakthroughs";
    return "Energy Transition: Navigating the Decade Ahead";
}
