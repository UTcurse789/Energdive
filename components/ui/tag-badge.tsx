"use client";

import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils";

interface TagBadgeProps {
    name: string;
    slug?: string;
    className?: string;
}

export function TagBadge({ name, slug, className = "" }: TagBadgeProps) {
    const router = useRouter();
    const tagSlug = slug || slugify(name);

    return (
        <button
            type="button"
            className={`inline-block bg-zinc-100 hover:bg-[#00A651] text-zinc-600 hover:text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded transition-all duration-200 ${className}`}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/tags/${tagSlug}`);
            }}
        >
            {name}
        </button>
    );
}
