"use client";

import {
    User,
    Briefcase,
    MapPin,
    Factory,
    Users,
    Settings,
    Heart,
    Bell,
} from "lucide-react";
import { useDashboard } from "./dashboard-shell";

export function RightSidebar() {
    const { profile, openEditProfile } = useDashboard();

    return (
        <aside
            className="hidden xl:flex flex-col shrink-0 overflow-y-auto dashboard-scrollbar border-l p-5 gap-5 backdrop-blur-md"
            style={{
                width: "var(--dash-right-w)",
                background: "rgba(18, 18, 26, 0.8)",
                borderColor: "var(--dash-border-subtle)",
            }}
        >
            {/* ── User Snapshot ──────────────────── */}
            <div
                className="rounded-xl p-5 border"
                style={{
                    background: "var(--dash-bg)",
                    borderColor: "var(--dash-border)",
                }}
            >
                <h3
                    className="text-xs font-bold uppercase tracking-[0.15em] mb-4"
                    style={{ color: "var(--dash-accent)" }}
                >
                    Profile Snapshot
                </h3>

                <div className="space-y-3">
                    <SnapshotRow icon={<Briefcase size={14} />} label="Role" value={profile.job_title} />
                    <SnapshotRow icon={<Factory size={14} />} label="Organization" value={profile.organization} />
                    <SnapshotRow icon={<MapPin size={14} />} label="Location" value={[profile.state, profile.country].filter(Boolean).join(", ")} />
                    <SnapshotRow icon={<User size={14} />} label="Industry" value={profile.industry_name} />
                    <SnapshotRow icon={<Users size={14} />} label="Sub-Industry" value={profile.sub_industry_name} />
                </div>

                {/* Community Badges */}
                {profile.communities.length > 0 && (
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--dash-border-subtle)" }}>
                        <p
                            className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2"
                            style={{ color: "var(--dash-text-dim)" }}
                        >
                            Communities
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {profile.communities.map((c) => (
                                <span
                                    key={`${c.community_id}-${c.sub_community_id}`}
                                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                    style={{
                                        background: "var(--dash-accent-dim)",
                                        color: "var(--dash-accent)",
                                    }}
                                >
                                    {c.sub_community_name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Quick Actions ──────────────────── */}
            <div
                className="rounded-xl p-5 border"
                style={{
                    background: "var(--dash-bg)",
                    borderColor: "var(--dash-border)",
                }}
            >
                <h3
                    className="text-xs font-bold uppercase tracking-[0.15em] mb-4"
                    style={{ color: "var(--dash-accent)" }}
                >
                    Quick Actions
                </h3>
                <div className="space-y-1">
                    <QuickAction icon={<Settings size={15} />} label="Edit Profile" onClick={openEditProfile} />
                    <QuickAction icon={<Heart size={15} />} label="Change Interests" />
                    <QuickAction icon={<Bell size={15} />} label="Manage Notifications" />
                </div>
            </div>
        </aside>
    );
}

// ── Sub-components ────────────────────────────────────────────
function SnapshotRow({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | null;
}) {
    return (
        <div className="flex items-start gap-2.5">
            <div className="mt-0.5 shrink-0" style={{ color: "var(--dash-text-dim)" }}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--dash-text-dim)" }}>
                    {label}
                </p>
                <p className="text-sm font-medium" style={{ color: value ? "var(--dash-text)" : "var(--dash-text-dim)" }}>
                    {value || "—"}
                </p>
            </div>
        </div>
    );
}

function QuickAction({
    icon,
    label,
    ...props
}: {
    icon: React.ReactNode;
    label: string;
    [key: string]: unknown;
}) {
    return (
        <button
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all hover:bg-white/5"
            style={{ color: "var(--dash-text-muted)" }}
            {...props}
        >
            {icon}
            {label}
        </button>
    );
}
