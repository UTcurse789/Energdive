import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <main className="bg-white min-h-screen">
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row gap-12 mb-16">
                    <div className="flex-1 space-y-6">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <div className="flex gap-4">
                            <Skeleton className="h-10 w-32 rounded-full" />
                            <Skeleton className="h-10 w-32 rounded-full" />
                        </div>
                    </div>
                    <div className="w-full md:w-80 shrink-0">
                        <Skeleton className="aspect-3/4 rounded-2xl shadow-xl" />
                    </div>
                </div>

                {/* Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 border-t pt-12">
                    <div className="lg:col-span-8 space-y-8">
                        <Skeleton className="h-8 w-48 mb-8" />
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="space-y-3">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                            </div>
                        ))}
                    </div>
                    <div className="lg:col-span-4 space-y-8">
                        <Skeleton className="h-40 w-full rounded-2xl" />
                        <Skeleton className="h-40 w-full rounded-2xl" />
                    </div>
                </div>
            </div>
        </main>
    );
}
