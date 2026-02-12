"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, FileText, Download } from "lucide-react";
import { Article } from "@/types";
import { cn } from "@/lib/utils";

export interface ReportCardProps {
    article: Article;
    className?: string;
    variant?: "default" | "compact" | "featured";
    baseUrl?: string;
}

export function ReportCard({ article, className, variant = "default", baseUrl = "/reports" }: ReportCardProps) {
    const isFeatured = variant === "featured";

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={cn(
                "group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-xl transition-all duration-300",
                className
            )}
        >
            <Link href={`${baseUrl}/${article.slug}`} className="block relative aspect-4/3 overflow-hidden">
                <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <span className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        View Report <ArrowRight className="w-4 h-4 ml-1" />
                    </span>
                </div>
            </Link>

            <div className="p-6 flex flex-col grow">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded">
                        {article.category}
                    </span>
                    <span className="text-xs text-zinc-500 font-medium">
                        {article.date}
                    </span>
                </div>

                <Link href={`${baseUrl}/${article.slug}`} className="block mb-3">
                    <h3 className={cn(
                        "font-serif font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors leading-tight",
                        isFeatured ? "text-2xl md:text-3xl" : "text-xl"
                    )}>
                        {article.title}
                    </h3>
                </Link>

                <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-3 mb-6 font-serif leading-relaxed grow">
                    {article.excerpt}
                </p>

                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-3">
                        {article.author && (
                            <div className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                                {article.author.name}
                            </div>
                        )}
                        {article.pdfSize && (
                            <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded flex items-center gap-1">
                                <FileText className="w-3 h-3" /> {article.pdfSize}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
