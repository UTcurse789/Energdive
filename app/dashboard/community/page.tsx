"use client";

import { MessageSquare, Flame, Pin, ChevronUp } from "lucide-react";
import { TrendsSidebar } from "@/components/dashboard/trends-sidebar";

const DISCUSSIONS = [
    {
        id: "1",
        author: "Dr. Michael Chen",
        role: "Industry Practitioner",
        initials: "DMC",
        bg: "bg-emerald-500",
        title: "What's the realistic timeline for green hydrogen adoption in heavy industry?",
        excerpt: "I've been researching hydrogen adoption pathways and would love to hear perspectives on realistic timelines for widespread adoption in cement, steel, and chemical sectors...",
        tags: ["Hydrogen", "Decarbonization", "Heavy Industry"],
        replies: 128,
        views: 3420,
        likes: 89,
        time: "2 hours ago",
        hot: true
    },
    {
        id: "2",
        author: "Sarah Williams",
        role: "Policy & institutional User",
        initials: "SW",
        bg: "bg-emerald-600",
        title: "Nuclear vs Renewables: Can we have both in the energy mix?",
        excerpt: "The debate continues on optimal energy portfolios. Should we pursue both nuclear and renewables, or focus resources on one path? Let's discuss the policy and economic implications...",
        tags: ["Nuclear", "Renewables", "Energy Mix"],
        replies: 203,
        views: 5680,
        likes: 156,
        time: "1 day ago",
        pinned: true,
        hot: true
    }
];

export default function CommunityPage() {
    return (
        <div className="animate-fade-in-up">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Community & Discussions</h1>
                <p className="text-gray-500">Connect with energy professionals and share insights</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Feed */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Filters */}
                    <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                            {["All Discussions", "Hot Topics", "Recent", "Following"].map((filter, i) => (
                                <button
                                    key={filter}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors
                                        ${i === 0 ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}
                                    `}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                        <button className="bg-var(--dash-accent) hover:bg-var(--dash-accent-hover) text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">
                            New Discussion
                        </button>
                    </div>

                    {/* Discussion Cards */}
                    {DISCUSSIONS.map((item) => (
                        <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:border-var(--dash-accent-dim) transition-colors">
                            <div className="flex items-start gap-4 mb-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold ${item.bg}`}>
                                    {item.initials}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        {item.hot && (
                                            <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                                <Flame size={10} /> Hot
                                            </span>
                                        )}
                                        {item.pinned && (
                                            <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                                <Pin size={10} /> Pinned
                                            </span>
                                        )}
                                        <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded">
                                            {item.tags[0]}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-3 leading-relaxed">
                                        {item.excerpt}
                                    </p>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {item.tags.map(tag => (
                                            <span key={tag} className="bg-gray-50 border border-gray-200 text-gray-600 text-xs px-2 py-1 rounded">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                        <span className="font-semibold text-gray-700">{item.author}</span>
                                        <span>•</span>
                                        <span>{item.role}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 pt-4 border-t border-gray-50 text-gray-500 text-xs font-medium">
                                <span className="flex items-center gap-1.5"><MessageSquare size={14} /> {item.replies} replies</span>
                                <span className="flex items-center gap-1.5"><ChevronUp size={14} /> {item.likes}</span>
                                <span className="ml-auto">{item.time}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <TrendsSidebar />
                </div>
            </div>
        </div>
    );
}
