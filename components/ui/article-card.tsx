"use client";

import Link from "next/link";
import Image from "next/image";
import { cn, slugify } from "@/lib/utils";
import { Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { DateChip } from "@/components/ui/date-chip";
import { buildContentUrl } from "@/lib/content-routes";

import { Article } from "@/types";

interface ArticleCardProps {
    article: Article;
    className?: string;
    variant?: "vertical" | "horizontal" | "compact";
}

export function ArticleCard({ article, className, variant = "vertical" }: ArticleCardProps) {
    const router = useRouter();
    const articleHref =
        article.href ||
        (article.contentType
            ? buildContentUrl({ slug: article.slug, contentType: article.contentType })
            : `/news/${article.slug}`);

    return (
        <div
            onClick={() => router.push(articleHref)}
            className={cn("group block h-full cursor-pointer", className)}
        >
            <article className={cn("flex flex-col h-full gap-4", variant === "horizontal" && "md:flex-row md:items-center")}>
                {/* Image Container */}
                <div className={cn(
                    "relative overflow-hidden bg-muted aspect-3/2 w-full",
                    variant === "horizontal" && "md:w-1/3 aspect-3/2",
                    variant === "compact" && "aspect-square w-24 h-24 shrink-0"
                )}>
                    <Image
                        src={article.image}
                        alt={article.title || "Article Image"}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                </div>

                {/* Content */}
                <div className={cn("flex flex-col flex-1", variant === "horizontal" && "md:w-2/3")}>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-[#00BFA5] font-bold  tracking-wider uppercase">
                            {article.category}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <DateChip value={article.date} className="text-[10px]" />
                    </div>

                    <h3 className={cn(
                        "font-serif font-bold leading-tight break-words group-hover:text-primary transition-colors",
                        variant === "compact" ? "text-sm line-clamp-2" : "text-xl mb-2"
                    )}>
                        {article.title}
                    </h3>

                    {variant !== "compact" && (
                        <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                            {article.excerpt}
                        </p>
                    )}

                    {variant !== "compact" && (
                        <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                {article.author && (
                                    <Link
                                        href={`/author/${slugify(article.author.name)}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="hover:text-[#09B697] transition-colors font-semibold relative z-10"
                                    >
                                        {article.author.name}
                                    </Link>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{article.readTime}</span>
                            </div>
                        </div>
                    )}
                </div>
            </article>
        </div>
    );
}
