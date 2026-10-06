import { fetchContent } from "@/lib/strapi";
import { ContentCard } from "@/components/content-card";
import { Suspense } from "react";

export const metadata = {
    title: "Latest Intelligence | EnergDive",
    description: "Curated energy insights and market analysis.",
};

export default async function ContentPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string }>;
}) {
    const resolvedParams = await searchParams;
    const page = Number(resolvedParams?.page) || 1;

    let content;
    let error;

    try {
        content = await fetchContent(page);
    } catch (e) {
        console.error("Failed to fetch Strapi content:", e);
        error = e instanceof Error ? e.message : "Unknown error";
    }

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Latest Intelligence</h1>
                    <p className="text-gray-500 mt-1">
                        Deep dives, market analysis, and expert opinions.
                    </p>
                </div>
            </div>

            {error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    <h3 className="font-bold">Error loading content</h3>
                    <p className="text-sm mt-1">{error}</p>
                    <p className="text-xs mt-2 text-red-500">
                        Please check your STRAPI_API_URL and STRAPI_API_TOKEN environment variables.
                    </p>
                </div>
            ) : (
                <>
                    {/* Content Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {content?.data.map((item) => (
                            <ContentCard key={item.id} item={item} />
                        ))}
                    </div>

                    {/* Simple Pagination */}
                    {content?.meta && (
                        <div className="flex justify-center mt-8 gap-2">
                            {page > 1 && (
                                <a
                                    href={`/dashboard/content?page=${page - 1}`}
                                    className="px-4 py-2 border rounded hover:bg-gray-50 text-sm font-medium"
                                >
                                    Previous
                                </a>
                            )}
                            <span className="px-4 py-2 text-sm text-gray-500">
                                Page {content.meta.pagination.page} of {content.meta.pagination.pageCount}
                            </span>
                            {page < content.meta.pagination.pageCount && (
                                <a
                                    href={`/dashboard/content?page=${page + 1}`}
                                    className="px-4 py-2 border rounded hover:bg-gray-50 text-sm font-medium"
                                >
                                    Next
                                </a>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
