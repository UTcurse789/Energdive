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
    variant?: "default" | "hero";
}

export function SectionHeading({ title, linkText, linkHref, className, adPlacement, variant = "default" }: SectionHeadingProps) {
    if (variant === "hero") {
        return (
            <div className="w-full flex flex-col">
                {adPlacement && (
                    <div className="w-full flex justify-center mb-6 empty:hidden [&>div]:w-full">
                        <AdBanner placement={adPlacement} variant="banner" className="w-full" />
                    </div>
                )}
                <div className={cn("flex items-center justify-between pb-2 border-b-2 border-slate-900 mb-4", className)}>
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                        {title}
                    </h2>

                    {linkText && linkHref && (
                        <Link
                            href={linkHref}
                            className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 transition-colors uppercase tracking-widest"
                        >
                            {linkText} &rarr;
                        </Link>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col">
            {adPlacement && (
                <div className="w-full flex justify-center mb-6 empty:hidden [&>div]:w-full">
                    <AdBanner placement={adPlacement} variant="banner" className="w-full" />
                </div>
            )}
            <div className={cn("flex flex-wrap md:flex-nowrap items-end justify-between border-b border-slate-100 pb-3 mb-6 relative gap-y-4 gap-x-2 md:gap-4", className)}>
            {/* The Bottom Accent Line */}
            <div className="absolute bottom-0 left-0 w-20 h-0.5 bg-[#09B697]" />

            <div className="flex items-center gap-2.5 shrink-0 order-1">
                {/* Live Indicator Dot */}
                <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#09B697] opacity-20"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#09B697]"></span>
                </span>

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 uppercase">
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
