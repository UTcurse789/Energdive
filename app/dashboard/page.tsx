"use client";

import { useDashboard } from "@/components/dashboard/dashboard-shell";
import { StatsRow } from "@/components/dashboard/stats-row";
import { TrendsSidebar } from "@/components/dashboard/trends-sidebar";
import { IntelligenceFeed } from "@/components/dashboard/intelligence-feed";

export default function DashboardPage() {
    const { profile } = useDashboard();
    const firstName = profile.first_name || "User";

    return (
        <div className="animate-fade-in-up">
            {/* Welcome Section */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                    Welcome back, {firstName}
                </h1>
                <p className="text-gray-500">
                    Your intelligence hub for energy industry insights
                </p>
            </div>

            {/* Stats Row */}
            <StatsRow />

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Feed (2/3) */}
                <div className="lg:col-span-2">
                    <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm min-h-[600px]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900">Intelligence Feed</h2>
                            <button className="text-xs font-semibold px-3 py-1.5 rounded bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors">
                                Latest Updates
                            </button>
                        </div>

                        <IntelligenceFeed />
                    </div>
                </div>

                {/* Right Column: Sidebar (1/3) */}
                <div className="lg:col-span-1">
                    <TrendsSidebar />
                </div>
            </div>
        </div>
    );
}