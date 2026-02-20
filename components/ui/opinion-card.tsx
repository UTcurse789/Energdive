"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Opinion } from "@/types";


interface OpinionCardProps {
    opinion: Opinion;
    className?: string;
    isLarge?: boolean;
}

export function OpinionCard({ opinion, className, isLarge }: OpinionCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={cn(
                "group flex flex-col h-full",
                isLarge ? "lg:col-span-2" : "lg:col-span-1",
                className
            )}
        >
            <Link href={`/opinion/${opinion.slug}`} className="relative block overflow-hidden rounded-3xl mb-6 shadow-sm border border-zinc-100">
                {/* 1. IMAGE: Grayscale to color transition on hover */}
                <div className={cn(
                    "relative overflow-hidden bg-zinc-100 transition-all duration-700",
                    isLarge ? "aspect-16/10" : "aspect-4/5"
                )}>
                    <Image
                        src={opinion.author.image || opinion.author.avatar || "/placeholder.jpg"}
                        alt={opinion.author.name}
                        fill
                        className="object-cover grayscale transition-all duration-1000 ease-in-out group-hover:grayscale-0 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />

                    {/* Hover Overlay Arrow */}
                    <div className="absolute bottom-6 right-6 bg-white p-3 rounded-full text-black opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 shadow-xl z-10">
                        <ArrowUpRight size={20} />
                    </div>
                </div>
            </Link>

            <div className="flex flex-col grow px-1">
                {/* Metadata */}
                <div className="flex items-center gap-3 mb-4 text-[10px] font-bold uppercase tracking-[0.2em]">
                    <span className="text-[#00A651]">{opinion.category || "INSIGHT"}</span>
                    <span className="h-1px w-4 bg-zinc-200" />
                    <span className="text-zinc-400">{opinion.date}</span>
                </div>

                {/* Title */}
                <Link href={`/opinion/${opinion.slug}`}>
                    <h3 className={cn(
                        "font-serif font-bold leading-[1.15] tracking-tight group-hover:text-[#00A651] transition-colors mb-6 text-zinc-900",
                        isLarge ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"
                    )}>
                        {opinion.title}
                    </h3>
                </Link>

                {/* 2. FOOTER: Author Signature Alignment */}
                <div className="mt-auto pt-6 border-t border-zinc-100 flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700 border border-zinc-200">
                        <Image
                            src={opinion.author.image || opinion.author.avatar || "/placeholder.jpg"}
                            alt={opinion.author.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div>
                        <div className="text-[11px] font-black uppercase tracking-wider text-zinc-900 leading-none mb-1">
                            {opinion.author.name}
                        </div>
                        <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-tighter">
                            {opinion.author.role || "Contributing Analyst"}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}