import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

import { Article } from "@/types";

interface OpinionCardProps {
    article: Article;
    className?: string;
}

export function OpinionCard({ article, className }: OpinionCardProps) {
    return (
        <Link
            href={`/news/${article.slug}`}
            className={cn("block p-6 bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors", className)}
        >
            <div className="flex items-start gap-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border border-border">
                    <Image
                        src={article.author?.avatar || "/placeholder-avatar.png"}
                        alt={article.author?.name || "Author"}
                        fill
                        className="object-cover"
                    />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-1">
                        {article.author?.name}
                    </h4>
                    <h3 className="font-serif text-lg font-bold leading-snug group-hover:text-primary/80">
                        {article.title}
                    </h3>
                </div>
            </div>
        </Link>
    );
}
