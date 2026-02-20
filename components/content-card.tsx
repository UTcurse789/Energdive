"use client";

import { StrapiData, ContentItem, getStrapiMedia } from "@/lib/strapi";
import { Calendar, User, Tag as TagIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { slugify } from "@/lib/utils";

interface ContentCardProps {
    item: StrapiData<ContentItem>;
}

export function ContentCard({ item }: ContentCardProps) {
    const { attributes } = item;
    const { title, slug, excerpt, author, publishedAt, cover, tags, industry, sector } = attributes;

    const authorName = author?.data?.attributes?.name || "Unknown Author";
    const authorImage = getStrapiMedia(author?.data?.attributes?.avatar?.data?.attributes?.url || null);
    const coverImage = getStrapiMedia(cover?.data?.attributes?.url || null);
    const industryName = industry?.data?.attributes?.name;
    const sectorName = sector?.data?.attributes?.name;

    const date = new Date(publishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    return (
        <article className="group relative flex flex-col bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow h-full">
            {/* Image Section */}
            {coverImage && (
                <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                    <Image
                        src={coverImage}
                        alt={title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {industryName && (
                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-bold px-2 py-1 rounded text-primary">
                            {industryName}
                        </span>
                    )}
                </div>
            )}

            <div className="flex-1 p-5 flex flex-col">
                {/* Meta Header */}
                <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                    {sectorName && (
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium">
                            {sectorName}
                        </span>
                    )}
                    <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {date}
                    </span>
                </div>

                {/* Title & Excerpt */}
                <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight group-hover:text-primary transition-colors">
                    <Link href={`/dashboard/content/${slug}`}>
                        <span className="absolute inset-0" />
                        {title}
                    </Link>
                </h3>

                <p className="text-sm text-gray-500 line-clamp-3 mb-4 flex-1">
                    {excerpt}
                </p>

                {/* Footer: Author & Tags */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto relative z-10">
                    <div className="flex items-center gap-2">
                        {authorImage ? (
                            <div className="relative h-6 w-6 rounded-full overflow-hidden">
                                <Image src={authorImage} alt={authorName} fill className="object-cover" />
                            </div>
                        ) : (
                            <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
                                <User size={14} className="text-gray-400" />
                            </div>
                        )}
                        <Link href={`/author/${slugify(authorName)}`} className="text-xs font-medium text-gray-700 hover:text-[#09B697] transition-colors relative z-10">{authorName}</Link>
                    </div>

                    {tags?.data && tags.data.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                            <TagIcon size={12} />
                            <span>{tags.data.length} tags</span>
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}
