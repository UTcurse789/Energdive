import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <main className="min-h-screen bg-white">
            {/* Hero Skeleton */}
            <section className="py-10">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Hero LEFT (Banner area) */}
                        <div className="lg:col-span-8 space-y-8">
                            <Skeleton className="aspect-[16/8.5] w-full rounded-3xl" />
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <Skeleton className="h-6 w-20" />
                                    <Skeleton className="h-6 w-24" />
                                </div>
                                <Skeleton className="h-12 w-3/4" />
                                <Skeleton className="h-20 w-full" />
                            </div>
                        </div>

                        {/* Hero RIGHT Sidebar */}
                        <div className="lg:col-span-4 lg:pl-10 space-y-8">
                            <div className="flex justify-between pb-4 border-b">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                            <div className="space-y-6">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex gap-5 pb-5 border-b last:border-0">
                                        <Skeleton className="h-10 w-10 shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-3 w-20" />
                                            <Skeleton className="h-5 w-full" />
                                            <Skeleton className="h-3 w-16" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Bento Skeleton */}
            <section className="py-24 bg-zinc-50/30">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-end mb-10 border-b pb-4">
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    {/* Bento Grid layout simulation */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[600px]">
                        <Skeleton className="md:col-span-8 md:row-span-2 rounded-3xl" />
                        <Skeleton className="md:col-span-4 rounded-3xl" />
                        <Skeleton className="md:col-span-4 rounded-3xl" />
                    </div>
                </div>
            </section>
        </main>
    );
}
