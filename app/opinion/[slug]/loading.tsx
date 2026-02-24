import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="bg-[#FDFDFD] min-h-screen antialiased">
            <div className="fixed top-0 left-0 right-0 h-1 bg-[#00A651]/20 z-70" />

            <article className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl pt-12">
                {/* Navigation Skeleton */}
                <nav className="flex items-center justify-between mb-16 border-b border-zinc-100 pb-6">
                    <Skeleton className="h-4 w-32" />
                    <div className="flex gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </nav>

                {/* Hero Section Skeleton */}
                <header className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 mb-24 items-start">
                    <div className="lg:col-span-7 space-y-8">
                        <div>
                            <Skeleton className="h-6 w-24 mb-6" />
                            <Skeleton className="h-16 w-full mb-8" />
                            <Skeleton className="h-32 w-full mb-8" />

                            <div className="flex items-center gap-6 pt-10">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="w-10 h-10 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-3 w-24" />
                                        <Skeleton className="h-2 w-16" />
                                    </div>
                                </div>
                                <div className="h-4 w-px bg-zinc-200" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-5">
                        <Skeleton className="relative aspect-4/5 rounded-2xl" />
                    </div>
                </header>

                {/* Content Area Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-8 lg:col-start-3 max-w-[720px] mx-auto w-full space-y-8">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-11/12" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-10 w-3/4 mt-12" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-40 w-full rounded-3xl mt-16" />
                    </div>
                </div>
            </article>
        </div>
    );
}
