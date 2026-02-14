"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

// ── Types (mirrors getUserProfile response) ──────────────────────
interface CommunitySelection {
    community_id: number;
    community_name: string;
    sub_community_id: number;
    sub_community_name: string;
}

interface UserProfile {
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string;
    job_title: string | null;
    organization: string | null;
    country: string | null;
    state: string | null;
    onboarding_completed: boolean;
    industry_name: string | null;
    sub_industry_name: string | null;
    communities: CommunitySelection[];
}

export default function DashboardPage() {
    const { user: clerkUser } = useUser();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadProfile() {
            try {
                const res = await fetch("/api/user/profile");
                if (!res.ok) throw new Error("Failed to load profile");
                const data = await res.json();
                if (data.exists) {
                    setProfile(data.user);
                }
            } catch (err) {
                console.error("Profile load error:", err);
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <Loader2 className="w-8 h-8 animate-spin text-[#0AB996]" />
            </div>
        );
    }

    const displayName = profile?.first_name || clerkUser?.firstName || "User";
    const industryName = profile?.industry_name || "—";
    const subIndustryName = profile?.sub_industry_name || "—";
    const communities = profile?.communities || [];

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-white font-sans">
            <header className="mb-12">
                <h1 className="text-3xl font-bold text-zinc-900">
                    Hey! Welcome, {displayName}
                </h1>
                <p className="text-zinc-500 mt-2">
                    Your personalized feed based on{" "}
                    <span className="font-medium text-[#0AB996]">{industryName}</span>
                    {" / "}
                    <span className="font-medium text-[#0AB996]">{subIndustryName}</span>
                </p>
            </header>

            {/* Interest Chips */}
            <div className="flex flex-wrap gap-2 mb-8">
                <span className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-sm font-medium">
                    {industryName}
                </span>
                <span className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-sm font-medium">
                    {subIndustryName}
                </span>
                {communities.map((c) => (
                    <span
                        key={`${c.community_id}-${c.sub_community_id}`}
                        className="px-3 py-1 bg-[#0AB996]/10 text-[#0AB996] rounded-full text-sm font-medium"
                    >
                        {c.sub_community_name}
                    </span>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Feed */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-100">
                        <h2 className="text-xl font-bold text-zinc-900 mb-4">
                            Latest Updates
                        </h2>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="p-4 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#0AB996]">
                                            {subIndustryName}
                                        </span>
                                        <span className="text-zinc-400 text-xs">
                                            • {i * 2}h ago
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-zinc-800 group-hover:text-[#0AB996] transition-colors">
                                        Market analysis for {industryName} Sector
                                    </h3>
                                    <p className="text-zinc-600 text-sm mt-1 line-clamp-2">
                                        New report indicates a shift in {subIndustryName} trends
                                        following recent policy changes and infrastructure
                                        investments in the region.
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Communities Card */}
                    <div className="bg-[#0AB996]/5 p-6 rounded-xl border border-[#0AB996]/10">
                        <h3 className="font-bold text-[#0AB996] mb-2">
                            Your Communities
                        </h3>
                        <ul className="space-y-2">
                            {communities.length > 0 ? (
                                communities.map((c) => (
                                    <li
                                        key={`${c.community_id}-${c.sub_community_id}`}
                                        className="flex items-center gap-2 text-sm text-zinc-700"
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#0AB996]" />
                                        <span>
                                            {c.community_name} →{" "}
                                            <span className="font-medium">
                                                {c.sub_community_name}
                                            </span>
                                        </span>
                                    </li>
                                ))
                            ) : (
                                <li className="text-zinc-400 text-sm italic">
                                    No communities joined
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* Profile Card */}
                    <div className="bg-white p-6 rounded-xl border border-zinc-100 shadow-sm">
                        <h3 className="font-bold text-zinc-900 mb-3">Your Profile</h3>
                        <div className="space-y-2 text-sm text-zinc-600">
                            <p>
                                <span className="font-medium text-zinc-800">Role:</span>{" "}
                                {profile?.job_title || "—"}
                            </p>
                            <p>
                                <span className="font-medium text-zinc-800">Org:</span>{" "}
                                {profile?.organization || "—"}
                            </p>
                            <p>
                                <span className="font-medium text-zinc-800">Location:</span>{" "}
                                {profile?.state || "—"}, {profile?.country || "—"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}