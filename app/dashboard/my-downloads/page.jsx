import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { Download, FileText, FolderDown, ArrowUpRight, FileArchive } from "lucide-react";
import { formatSubmissionDate } from "@/lib/paper-submissions";
import { getUserDownloads } from "@/lib/queries";
import { getResourceCenterData } from "@/lib/resource-center";

export const metadata = {
    title: "My Downloads",
};

export default async function MyDownloadsPage() {
    const user = await currentUser();
    const clerkId = user?.id ?? "";

    let downloads = [];
    let loadError = "";

    if (clerkId) {
        try {
            downloads = await getUserDownloads(clerkId);
            const hasResourceDownloads = downloads.some((item) => item.item_type === "resource");

            if (hasResourceDownloads) {
                const resourceCenterData = await getResourceCenterData();
                const resourcesBySlug = new Map(
                    resourceCenterData.resources.map((resource) => [resource.slug, resource])
                );

                downloads = downloads.map((item) => {
                    if (item.item_type !== "resource") return item;

                    const resource = resourcesBySlug.get(item.paper_slug);
                    const shortTitle = resource?.shortTitle || "";
                    const fullTitle = resource?.title || item.paper_title || "";

                    return {
                        ...item,
                        resource_short_title: shortTitle,
                        resource_full_title: fullTitle,
                    };
                });
            }
        } catch (error) {
            console.error("Error loading downloads:", error);
            loadError = error instanceof Error ? error.message : "Unable to load your downloads right now.";
        }
    }

    return (
        <div className="mx-auto w-full max-w-[1400px] animate-fade-in-up">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: "var(--dash-text)" }}>
                        My Downloads
                    </h1>
                </div>
            </div>

            {loadError ? (
                <div
                    className="rounded-[28px] border px-6 py-5 text-sm"
                    style={{ background: "rgba(127,29,29,0.14)", borderColor: "rgba(248,113,113,0.28)", color: "#FCA5A5" }}
                >
                    {loadError}
                </div>
            ) : downloads.length === 0 ? (
                <div
                    className="rounded-[30px] border p-10 text-center"
                    style={{ background: "var(--dash-card)", borderColor: "var(--dash-border)" }}
                >
                    <div
                        className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
                        style={{ background: "rgba(201,168,76,0.12)", color: "var(--dash-accent)" }}
                    >
                        <FolderDown className="h-7 w-7" />
                    </div>
                    <h2 className="mt-5 text-2xl font-bold" style={{ color: "var(--dash-text)" }}>
                        No downloads yet
                    </h2>
                    <p className="mt-3 max-w-xl mx-auto text-sm leading-7" style={{ color: "var(--dash-text-dim)" }}>
                        Access ENERGDIVE magazines, industry reports, technical papers, whitepapers, case studies, event publications, presentations, and other valuable resources from across the global energy sector.
                    </p>
                    <Link
                        href="/resource-hub"
                        className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all"
                        style={{ background: "var(--dash-accent)", color: "#0A0A0B" }}
                    >
                        Explore Now
                    </Link>
                </div>
            ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {downloads.map((item) => {
                        const isResource = item.item_type === "resource";
                        const fallbackTitle = isResource ? "Untitled Resource" : "Untitled Paper";
                        const primaryTitle =
                            (isResource && item.resource_short_title) ||
                            item.paper_title ||
                            fallbackTitle;
                        const secondaryTitle =
                            isResource &&
                            item.resource_full_title &&
                            item.resource_full_title !== primaryTitle
                                ? item.resource_full_title
                                : "";

                        return (
                            <article
                                key={item.id}
                                className="flex min-h-[230px] flex-col justify-between rounded-[24px] border p-5 transition-all hover:shadow-[0_12px_40px_rgba(0,0,0,0.18)] hover:-translate-y-0.5"
                                style={{ background: "var(--dash-card)", borderColor: "var(--dash-border)" }}
                            >
                                <div>
                                    <div className="flex items-center justify-between">
                                        {isResource ? (
                                            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3B82F6" }}>
                                                <FileArchive className="h-3.5 w-3.5" />
                                                Resource
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ background: "var(--dash-accent-dim)", color: "var(--dash-accent)" }}>
                                                <FileText className="h-3.5 w-3.5" />
                                                Paper
                                            </div>
                                        )}
                                        <span className="text-xs" style={{ color: "var(--dash-text-dim)" }}>
                                            Saved {formatSubmissionDate(item.downloaded_at)}
                                        </span>
                                    </div>
                                    <h2 className="mt-4 text-xl font-bold leading-snug break-words" style={{ color: "var(--dash-text)" }}>
                                        {primaryTitle}
                                    </h2>
                                    {secondaryTitle ? (
                                        <p className="mt-2 line-clamp-2 text-sm leading-5" style={{ color: "var(--dash-text-dim)" }}>
                                            {secondaryTitle}
                                        </p>
                                    ) : null}
                                </div>

                                <div className="mt-6 flex items-center gap-3">
                                    <a
                                        href={`/api/secure-download/${item.id}`}
                                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all shadow-sm hover:opacity-90"
                                        style={{ background: "var(--dash-accent)", color: "#0A0A0B" }}
                                    >
                                        <Download className="h-4 w-4" />
                                        Download File
                                    </a>
                                    <Link
                                        href={isResource ? `/resource-hub/${item.paper_slug}` : `/knowledge-hub/abstract/${item.paper_slug}`}
                                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700 bg-transparent px-4 py-2.5 text-sm font-semibold transition-all"
                                        style={{ color: "var(--dash-text)" }}
                                    >
                                        {isResource ? "View Resource" : "View Abstract"}
                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                    </Link>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}