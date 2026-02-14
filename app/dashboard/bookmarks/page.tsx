"use client";

import { Trash2, ExternalLink } from "lucide-react";
import { FeedCard } from "@/components/dashboard/feed-card";

// Reusing FeedCard structure but wrapping it to add Bookmark-specific actions
// Or creating a specific BookmarkItem component since it has "Saved on..." and delete.

const BOOKMARKS = [
    {
        id: "1",
        category: "Policy & Regulation",
        readTime: "14 min read",
        title: "Offshore Wind Development: Regulatory Framework Analysis",
        summary: "Comprehensive overview of permitting processes and regulatory requirements for offshore wind projects.",
        author: "Dr. Anna Williams",
        savedOn: "Jan 7, 2026",
        href: "#"
    },
    {
        id: "2",
        category: "Market & Industry",
        readTime: "11 min read",
        title: "Electric Vehicle Charging Infrastructure: Investment Trends",
        summary: "Analysis of capital flows into EV charging networks and emerging business models in the sector.",
        author: "Michael Torres",
        savedOn: "Jan 5, 2026",
        href: "#"
    },
    {
        id: "3",
        category: "Technology & Innovation",
        readTime: "16 min read",
        title: "Grid Modernization: Lessons from Leading Markets",
        summary: "Case studies of successful grid modernization initiatives and key takeaways for utility operators.",
        author: "Sarah Chen",
        savedOn: "Jan 2, 2026",
        href: "#"
    }
];

export default function BookmarksPage() {
    return (
        <div className="animate-fade-in-up">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Bookmarks</h1>
                <p className="text-gray-500">Your saved articles and discussions</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-50">
                    <span className="font-bold text-[var(--dash-accent)] border-b-2 border-[var(--dash-accent)] pb-4 -mb-4.5 px-1">
                        Saved Articles ({BOOKMARKS.length})
                    </span>
                </div>

                <div className="space-y-0">
                    {BOOKMARKS.map((item) => (
                        <div key={item.id} className="group py-6 border-b border-gray-100 last:border-0 relative">
                            {/* Actions (Absolute) */}
                            <div className="absolute top-6 right-0 flex items-center gap-3">
                                <button className="text-gray-400 hover:text-gray-900 transition-colors">
                                    <ExternalLink size={18} />
                                </button>
                                <button className="text-red-400 hover:text-red-600 transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            {/* Meta */}
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-700`}>
                                    {item.category}
                                </span>
                                <span className="text-xs text-gray-400">{item.readTime}</span>
                            </div>

                            {/* Title & Summary */}
                            <div className="pr-16">
                                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[var(--dash-accent)] cursor-pointer transition-colors">
                                    {item.title}
                                </h3>
                                <p className="text-sm text-gray-500 mb-3 leading-relaxed line-clamp-2">
                                    {item.summary}
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-xs font-semibold text-gray-700">{item.author}</span>
                                <span className="text-xs text-gray-400">Saved on {item.savedOn}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
