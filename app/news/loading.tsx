import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <main className="min-h-screen bg-white py-16">
            <div className="container mx-auto px-4 max-w-[1400px]">
                <div className="flex justify-between items-end mb-12 border-b pb-6">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-5 w-32" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[...Array(9)].map((_, i) => (
                        <div key={i} className="space-y-4">
                            <Skeleton className="aspect-video w-full rounded-2xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-6 w-full" />
                                <Skeleton className="h-6 w-3/4" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
