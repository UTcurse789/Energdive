"use client";

import { Clock } from "lucide-react";

interface FeedItem {
    id: string;
    title: string;
    summary: string;
    category: string;
    date: string;
    author: string;
    readTime: string;
}

export function FeedCard({ item }: { item: FeedItem }) {
    // Category Styles map
    const getCategoryStyle = (cat: string) => {
        if (cat.includes("Policy")) return "bg-orange-100 text-orange-700";
        if (cat.includes("Tech")) return "bg-blue-100 text-blue-700";
        if (cat.includes("Market")) return "bg-amber-100 text-amber-700";
        return "bg-gray-100 text-gray-700";
    };

    return (
        <article className="py-6 border-b border-gray-100 last:border-0 group cursor-pointer">
            {/* Meta Row */}
            <div className="flex items-center gap-3 mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${getCategoryStyle(item.category)}`}>
                    {item.category}
                </span>
                <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                    {item.readTime}
                </span>
            </div>

            {/* Content */}
            <div className="mb-3">
                <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight break-words group-hover:text-[--dash-accent] transition-colors">
                    {item.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                    {item.summary}
                </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4">
                <span className="text-xs font-semibold text-gray-700">{item.author}</span>
                <span className="text-xs text-gray-400">{item.date}</span>
            </div>
        </article>
    );
}
