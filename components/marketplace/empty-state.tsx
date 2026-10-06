import { SearchX } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = "No results found",
  description = "Try adjusting your search criteria, clearing active filters, or exploring other sectors.",
  actionText = "Clear all filters",
  onAction,
}: EmptyStateProps) {
  return (
    <div className="w-full py-16 px-6 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 flex flex-col items-center justify-center text-center my-6">
      <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-4">
        <SearchX className="w-7 h-7" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-zinc-900 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-zinc-500 max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
