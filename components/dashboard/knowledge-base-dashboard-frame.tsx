"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Download, FileCheck2, FileText, Plus, Repeat2 } from "lucide-react";
import { useDashboard } from "./dashboard-shell";

export function KnowledgeBaseDashboardFrame({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { profile } = useDashboard();

    const showSubmissions = profile.has_submitted_abstract || pathname.startsWith("/dashboard/my-submissions");
    const showDownloads = profile.hasDownloads || pathname.startsWith("/dashboard/my-downloads");
    const isSubmissions = pathname.startsWith("/dashboard/my-submissions");
    const isNewSubmission = pathname.startsWith("/dashboard/my-submissions/new");
    const isDownloads = pathname.startsWith("/dashboard/my-downloads");
    const activeView = searchParams?.get("view") ?? "submissions";

    return (
        <div className="mx-auto w-full max-w-[1600px] animate-fade-in-up">
            <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                <aside
                    className="rounded-[2px] border p-3 lg:sticky lg:top-[145px] lg:min-h-[calc(100vh-180px)]"
                    style={{ background: "rgba(10,10,12,0.62)", borderColor: "var(--dash-border)" }}
                >
                    <nav className="space-y-3">
                        {showSubmissions && (
                            <div>
                                <Link
                                    href="/dashboard/my-submissions"
                                    className="flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors"
                                    style={
                                        isSubmissions && !isNewSubmission && activeView === "submissions"
                                            ? { color: "var(--dash-accent)", borderBottomColor: "var(--dash-accent)", background: "rgba(201,168,76,0.06)" }
                                            : { color: "var(--dash-text-muted)", borderBottomColor: "transparent" }
                                    }
                                >
                                    <FileText className="h-4 w-4" />
                                    My Submissions
                                </Link>

                                {isSubmissions && (
                                    <div className="space-y-2 px-7 py-4 text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
                                        <Link
                                            href="/dashboard/my-submissions/new"
                                            className="flex items-center gap-2 rounded-lg px-2 py-2 transition-colors"
                                            style={
                                                isNewSubmission
                                                    ? { color: "var(--dash-accent)", background: "rgba(201,168,76,0.08)" }
                                                    : { color: "var(--dash-text)" }
                                            }
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Submit new abstract
                                        </Link>
                                        <Link
                                            href="/dashboard/my-submissions?view=abstract"
                                            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors"
                                            style={activeView === "abstract" && !isNewSubmission ? { color: "var(--dash-accent)" } : { color: "var(--dash-text)" }}
                                        >
                                            <FileText className="h-3.5 w-3.5" />
                                            Abstract
                                        </Link>
                                        <Link
                                            href="/dashboard/my-submissions?view=final-paper"
                                            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors"
                                            style={activeView === "final-paper" ? { color: "var(--dash-accent)" } : { color: "var(--dash-text)" }}
                                        >
                                            <FileCheck2 className="h-3.5 w-3.5" />
                                            Final paper
                                        </Link>
                                        <Link
                                            href="/dashboard/my-submissions?view=resubmission"
                                            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors"
                                            style={activeView === "resubmission" ? { color: "var(--dash-accent)" } : { color: "var(--dash-text)" }}
                                        >
                                            <Repeat2 className="h-3.5 w-3.5" />
                                            Re-submission
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {showDownloads && (
                            <Link
                                href="/dashboard/my-downloads"
                                className="flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors"
                                style={
                                    isDownloads
                                        ? { color: "var(--dash-accent)", background: "rgba(201,168,76,0.08)" }
                                        : { color: "var(--dash-text-muted)", background: "rgba(255,255,255,0.03)" }
                                }
                            >
                                <Download className="h-4 w-4" />
                                My Downloads
                            </Link>
                        )}
                    </nav>
                </aside>

                <section className="min-w-0">
                    {children}
                </section>
            </div>
        </div>
    );
}
