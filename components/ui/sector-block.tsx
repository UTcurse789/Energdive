import { SectionHeading } from "./section-heading";
import { ArticleCard } from "./article-card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Article } from "@/types";

interface SectorBlockProps {
    title: string;
    slug: string;
    articles: Article[];
}

export function SectorBlock({ title, slug, articles }: SectorBlockProps) {
    return (
        <section className="py-8 border-b border-border">
            <SectionHeading
                title={title}
                linkText="View All"
                linkHref={`/sectors/${slug}`}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {articles.slice(0, 4).map((article, index) => (
                    <ArticleCard
                        key={index}
                        article={article}
                        variant="vertical"
                        className="h-full"
                    />
                ))}
            </div>
        </section>
    );
}
