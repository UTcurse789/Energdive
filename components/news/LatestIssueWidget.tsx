"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useAuthModal } from "@/hooks/use-auth-modal";
import type { LatestIssueData } from "@/lib/api/getLatestIssue";

interface LatestIssueWidgetProps {
    latestIssue: LatestIssueData;
}

export function LatestIssueWidget({ latestIssue }: LatestIssueWidgetProps) {
    const { isSignedIn, isLoaded } = useUser();
    const { openAuthModal } = useAuthModal();

    const isLoggedIn = isLoaded && isSignedIn === true;

    function handleDownload(e: React.MouseEvent<HTMLAnchorElement>) {
        if (!isLoggedIn) {
            e.preventDefault();
            openAuthModal(`/issues/${latestIssue.slug}?download=true`);
        }
        // If signed in, the default <a href> will navigate to the download route
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
            {/* Badge */}
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3.5 py-1.5 rounded-full w-fit mb-4">
                <Calendar className="h-4 w-4 text-emerald-600" />
                LATEST ISSUE
            </div>

            {/* Cover Image */}
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl mb-4 group">
                <Link href={`/issues/${latestIssue.slug}`}>
                    <Image
                        src={latestIssue.coverImage}
                        alt={latestIssue.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                </Link>
            </div>

            {/* Title */}
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 font-sans tracking-tight">
                Issue {latestIssue.month} {latestIssue.year}
            </h3>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
                <Link
                    href={`/issues/${latestIssue.slug}`}
                    className="flex items-center justify-center py-2.5 px-3 bg-slate-200/80 hover:bg-slate-300 text-slate-900 text-xs font-bold rounded-full transition-colors text-center"
                >
                    Read Issue
                </Link>
                <a
                    href={`/issues/${latestIssue.slug}/download`}
                    onClick={handleDownload}
                    className="flex items-center justify-center py-2.5 px-3 bg-slate-200/80 hover:bg-slate-300 text-slate-900 text-xs font-bold rounded-full transition-colors text-center"
                >
                    Download PDF
                </a>
            </div>
        </div>
    );
}
