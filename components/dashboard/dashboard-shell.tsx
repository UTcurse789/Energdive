"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { DashboardHeader } from "./dashboard-header";

// ── Types ────────────────────────────────────────────────────────
export interface CommunitySelection {
    community_id: number;
    community_name: string;
    sub_community_id: number;
    sub_community_name: string;
}

export interface DashboardProfile {
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
    country: string | null;
    state: string | null;
    job_title: string | null;
    organization: string | null;
    onboarding_completed: boolean;
    has_submitted_abstract: boolean;
    hasDownloads: boolean;
    preferred_frequency: string | null;
    preferred_formats: string[];
    content_digest_opted_out: boolean;
    industry_id: number | null;
    industry_name: string | null;
    sub_industry_id: number | null;
    sub_industry_name: string | null;
    communities: CommunitySelection[];
    membership_id: string | null;
    verification_status: string | null;
}

interface DashboardContextType {
    profile: DashboardProfile;
    refreshProfile: () => Promise<void>;
    openEditProfile: () => void;
    sidebarOpen: boolean;
    setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
    feedKey: number;
    badgeCounts?: {
        downloads: number;
        saved: number;
        abstracts: number;
        finalPaper: number;
        resubmission: number;
    };
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function useDashboard() {
    const ctx = useContext(DashboardContext);
    if (!ctx) throw new Error("useDashboard must be used within DashboardShell");
    return ctx;
}

import { EditProfileModal } from "./edit-profile-modal";
import { DashboardSidebar } from "./dashboard-sidebar";

// ── Shell ────────────────────────────────────────────────────────
export default function DashboardShell({
    initialProfile,
    initialBadgeCounts,
    children,
}: {
    initialProfile: DashboardProfile;
    initialBadgeCounts?: DashboardContextType["badgeCounts"];
    children: React.ReactNode;
}) {
    const [profile, setProfile] = useState<DashboardProfile>(initialProfile);
    const [editOpen, setEditOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [feedKey, setFeedKey] = useState(0);

    const refreshProfile = useCallback(async () => {
        try {
            const res = await fetch("/api/user/profile");
            if (!res.ok) return;
            const data = await res.json();
            if (data.exists) setProfile(data.user);
            // Bump feedKey so feed components auto-refresh
            setFeedKey((k) => k + 1);
        } catch (err) {
            console.error("Profile refresh error:", err);
        }
    }, []);

    return (
        <DashboardContext.Provider
            value={{
                profile,
                refreshProfile,
                openEditProfile: () => setEditOpen(true),
                sidebarOpen,
                setSidebarOpen,
                feedKey,
                badgeCounts: initialBadgeCounts,
            }}
        >
            <div className="dashboard-theme h-screen flex flex-col font-sans overflow-hidden" style={{ background: "var(--dash-bg)", color: "var(--dash-text)" }}>
                {/* Fixed Header */}
                <DashboardHeader />

                <div className="flex flex-1 overflow-hidden">
                    <DashboardSidebar />
                    
                    {/* Main Scrollable Body */}
                    <main className="flex-1 overflow-y-auto w-full max-w-[1400px] mx-auto px-4 lg:px-8 py-8 transition-all duration-300">
                        {children}
                    </main>
                </div>

                {/* Global Modals */}
                <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
            </div>
        </DashboardContext.Provider>
    );
}
