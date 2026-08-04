import Link from "next/link";
import { slugify } from "@/lib/utils";

interface TagBadgeProps {
    name: string;
    slug?: string;
    className?: string;
}

export function TagBadge({ name, slug, className = "" }: TagBadgeProps) {
    const tagSlug = slug || slugify(name);

    return (
        <Link
            href={`/tags/${tagSlug}`}
            className={`inline-block bg-zinc-100 hover:bg-[#00A651] text-zinc-600 hover:text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded transition-all duration-200 ${className}`}
        >
            {name}
        </Link>
    );
}
