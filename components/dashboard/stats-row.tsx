"use client";

import { FileText, TrendingUp, Users, MessageSquare } from "lucide-react";

const STATS = [
    { label: "Articles Published", value: "124", icon: FileText, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Trending Topics", value: "18", icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Active Members", value: "2.3K", icon: Users, color: "text-orange-500", bg: "bg-orange-50" },
    { label: "Discussions", value: "89", icon: MessageSquare, color: "text-red-500", bg: "bg-red-50" },
];

export function StatsRow() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {STATS.map((stat) => (
                <div key={stat.label} className="bg-white border border-gray-100 rounded-xl p-5 flex items-center gap-4 shadow-sm">
                    <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                        <stat.icon size={22} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900 leading-none">{stat.value}</p>
                        <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
