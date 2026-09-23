import { Skeleton } from "@/components/ui/skeleton";

export function CompanyCardSkeleton() {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-6 flex flex-col justify-between h-full space-y-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <Skeleton className="w-20 h-5 rounded-full" />
        </div>
        <Skeleton className="w-3/4 h-6 rounded" />
        <div className="flex gap-2">
          <Skeleton className="w-24 h-4 rounded" />
          <Skeleton className="w-20 h-4 rounded" />
        </div>
        <Skeleton className="w-full h-12 rounded" />
      </div>
      <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
        <Skeleton className="w-28 h-4 rounded" />
        <Skeleton className="w-24 h-8 rounded" />
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden flex flex-col justify-between h-full">
      <Skeleton className="w-full aspect-16/10" />
      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="w-20 h-4 rounded" />
            <Skeleton className="w-28 h-4 rounded" />
          </div>
          <Skeleton className="w-4/5 h-5 rounded" />
          <Skeleton className="w-full h-10 rounded" />
        </div>
        <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
          <Skeleton className="w-24 h-4 rounded" />
          <Skeleton className="w-24 h-8 rounded" />
        </div>
      </div>
    </div>
  );
}

export function GridLoadingSkeleton({ count = 6, type = "company" }: { count?: number; type?: "company" | "product" }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, idx) =>
        type === "company" ? (
          <CompanyCardSkeleton key={idx} />
        ) : (
          <ProductCardSkeleton key={idx} />
        )
      )}
    </div>
  );
}
