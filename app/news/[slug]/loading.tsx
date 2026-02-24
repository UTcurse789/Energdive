import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <main className="pt-20 pb-24 bg-white">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6">
                {/* Breadcrumb Skeleton */}
                <div className="mb-8">
                    <Skeleton className="h-4 w-48" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-8">
                        {/* Category + Date */}
                        <div className="flex gap-4 mb-6">
                            <Skeleton className="h-6 w-24 rounded-full" />
                            <Skeleton className="h-6 w-32" />
                        </div>

                        {/* Title */}
                        <Skeleton className="h-16 w-full mb-6" />
                        <Skeleton className="h-16 w-3/4 mb-10" />

                        {/* Excerpt */}
                        <Skeleton className="h-24 w-full mb-12 border-l-4 border-zinc-100 pl-6" />

                        {/* Author */}
                        <div className="flex items-center gap-4 mb-12 pb-8 border-b">
                            <Skeleton className="h-14 w-14 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>

                        {/* Featured Image */}
                        <Skeleton className="aspect-video w-full rounded-2xl mb-12" />

                        {/* Content */}
                        <div className="space-y-6">
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-11/12" />
                            <Skeleton className="h-6 w-10/12" />
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-12">
                        <Skeleton className="h-[400px] w-full rounded-2xl" />
                        <div className="space-y-6">
                            <Skeleton className="h-8 w-48" />
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex gap-4">
                                    <Skeleton className="h-20 w-24 rounded-lg shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-3/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
