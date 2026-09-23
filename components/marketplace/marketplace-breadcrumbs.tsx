import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

interface MarketplaceBreadcrumbsProps {
  crumbs: Crumb[];
  className?: string;
}

export function MarketplaceBreadcrumbs({
  crumbs,
  className = "",
}: MarketplaceBreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center space-x-1.5 text-xs text-zinc-500 mb-4 ${className}`}
    >
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-1 text-zinc-500 hover:text-[#00A651] transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="hidden sm:inline font-medium">Marketplace</span>
      </Link>

      {crumbs.map((crumb, idx) => {
        const isLast = idx === crumbs.length - 1;
        return (
          <div key={crumb.label + idx} className="flex items-center space-x-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            {isLast || !crumb.href ? (
              <span
                className="font-semibold text-zinc-800 line-clamp-1 max-w-[200px] sm:max-w-md"
                aria-current="page"
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-[#00A651] transition-colors font-medium text-zinc-600 line-clamp-1"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
