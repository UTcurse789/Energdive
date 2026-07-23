"use client";

import { cn } from "@/lib/utils";
import Link from "next/link"; // Use Next.js Link for better performance
import { ArrowUpRight } from "lucide-react";
import { AdBanner } from "@/components/ads/AdBanner";

interface SectionHeadingProps {
    title: string;
    linkText?: string;
    linkHref?: string;
    className?: string;
    adPlacement?: string;
}

export function SectionHeading({ title, linkText, linkHref, className, adPlacement }: SectionHeadingProps) {
    return (
        <div className="w-full flex flex-col">
            {adPlacement && (
                <div className="w-full flex justify-center mb-6 empty:hidden [&>div]:w-full">
                    <AdBanner placement={adPlacement} variant="banner" maxItems={1} className="w-full" />
                </div>
            )}
            <div className={cn("flex flex-wrap md:flex-nowrap items-end justify-between border-b border-slate-100 pb-4 mb-10 relative gap-y-4 gap-x-2 md:gap-4", className)}>
            {/* The Bottom Accent Line */}
            <div className="absolute bottom-0 left-0 w-24 h-1 bg-[#09B697]" />

            <div className="flex items-center gap-3 shrink-0 order-1">
                {/* Live Indicator Dot */}
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#09B697] opacity-20"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#09B697]"></span>
                </span>

                <h2 className="text-2xl md:text-4xl font-serif font-black tracking-tight text-[#1a1a1a] uppercase">
                    {title}
                </h2>
            </div>

            {linkText && linkHref && (
                <Link
                    href={linkHref}
                    className="group flex items-center gap-1.5 text-[11px] font-black text-slate-400 hover:text-[#09B697] uppercase tracking-[0.2em] transition-all duration-300 shrink-0 order-2 md:order-3 ml-auto md:ml-0"
                >
                    {linkText}
                    <ArrowUpRight
                        size={14}
                        className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                </Link>
            )}
            </div>
        </div>
    );
}