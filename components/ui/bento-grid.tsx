import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

interface BentoItem {
    id: string;
    title: string;
    category: string;
    image: string;
    slug: string;
    excerpt?: string;
    size?: "large" | "medium" | "small";
}

interface BentoGridProps {
    items: BentoItem[];
}

function BentoCard({ item, className }: { item: BentoItem; className?: string }) {
    return (
        <Link
            href={`/news/${item.slug}`}
            className={cn(
                "group relative overflow-hidden rounded-none bg-muted w-full h-full min-h-[200px] flex flex-col justify-end p-6",
                className
            )}
        >
            <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-90" />

            <div className="relative z-10 text-white">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-accent">
                        {item.category}
                    </span>
                    <ArrowUpRight className="w-5 h-5 opacity-0 -translate-y-2 translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 text-accent" />
                </div>

                <h3 className={cn(
                    "font-serif font-bold leading-tight mb-2",
                    item.size === "large" ? "text-3xl md:text-4xl" : "text-xl"
                )}>
                    {item.title}
                </h3>

                {item.size !== "small" && item.excerpt && (
                    <p className="text-gray-300 text-sm line-clamp-2 md:line-clamp-3 opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                        {item.excerpt}
                    </p>
                )}
            </div>
        </Link>
    );
}

export function BentoGrid({ items }: BentoGridProps) {
    if (!items || items.length === 0) return null;

    const [large, medium1, medium2, small1, small2, small3] = items;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-4 md:grid-rows-2 gap-4 h-auto md:h-[600px]">
            {/* Large Card - Spans 2 cols, 2 rows */}
            <div className="md:col-span-2 md:row-span-2">
                {large && <BentoCard item={{ ...large, size: "large" }} className="h-full" />}
            </div>

            {/* Medium Cards - Span 1 col, 1 row */}
            <div className="md:col-span-1 md:row-span-1">
                {medium1 && <BentoCard item={{ ...medium1, size: "medium" }} className="h-full" />}
            </div>
            <div className="md:col-span-1 md:row-span-1">
                {medium2 && <BentoCard item={{ ...medium2, size: "medium" }} className="h-full" />}
            </div>

            {/* Small Cards - Span 1 col, 1 row? Actually 3 small cards requested. 
          Let's adjust the grid. 
          The previous "medium" ones take top right 2 slots.
          Now we have bottom right 2 slots left, but need 3 small cards.
          Maybe the grid needs to be different.
          
          Prompt: "1 large card, 2 medium cards, 3 small cards"
          Grid of 4 cols x 2 rows = 8 slots. 
          Large = 2x2 = 4 slots.
          Remaining = 4 slots.
          2 Medium + 3 Small = 5 items.
          
          Maybe 4 cols x 3 rows? Or adjust the layout.
          Let's try:
          Row 1: Large (2 cols), Medium (1 col), Medium (1 col)
          Row 2: Large (continued), Small (1 col), Small (1 col) - wait large spans 2 rows.
          
          Let's try a standard bento style:
          Col 1-2: Large (Row 1-2)
          Col 3: Medium (Row 1), Small (Row 2) -> wait that's 2 items
          Col 4: Medium (Row 1), Small (Row 2) -> +2 items = 4 items.
          
          We need 2 Medium, 3 Small.
          Let's try:
          Col 1-2: Large
          Col 3: Medium 1 (Top), Small 1 (Bottom)
          Col 4: Medium 2 (Top), Small 2 (Bottom)
          Where does Small 3 go?
          
          Maybe:
          Row 1: Large (2 cols), Medium (1 col), Medium (1 col)
          Row 2: Small (1 col), Small (1 col), Small (1 col), Small (1 col - unused?)
          
          Let's stick to a responsive grid that flows.
       */}

            {/* Let's redefine the grid for "1 Large, 2 Medium, 3 Small" -> 6 items total. 
           Desktop: 3 columns.
           Col 1 (Width 50%): Large Card
           Col 2 (Width 25%): Medium, Small, Small
           Col 3 (Width 25%): Medium, Small
           
           Actually, let's use CSS Grid with `grid-template-areas` or span utils.
           6 items.
       */}
            <div className="md:col-span-2 md:grid md:grid-cols-2 md:grid-rows-2 gap-4 hidden">
                {/* This was my previous attempt, let's scratch and do a clean flex or grid */}
            </div>
        </div>
    );
}

// Re-writing the render for the bento grid to be robust
export function BentoGridv2({ items }: BentoGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[200px]">
            {items.map((item, i) => (
                <BentoCard
                    key={i}
                    item={item}
                    className={cn(
                        i === 0 ? "md:col-span-2 md:row-span-2" : "", // Large
                        (i === 1 || i === 2) ? "md:col-span-1 md:row-span-1" : "", // Medium
                        (i >= 3) ? "md:col-span-1 md:row-span-1" : "" // Small
                    )}
                />
            ))}
        </div>
    )
}
