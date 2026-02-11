"use client";

import { Quote } from "@/lib/fmp";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useState } from "react";

interface TickerClientProps {
    initialQuotes: Quote[];
}

export function TickerClient({ initialQuotes }: TickerClientProps) {
    const [quotes] = useState(initialQuotes);

    // Agar data nahi hai toh kuch mat dikhao
    if (!Array.isArray(quotes) || quotes.length === 0) return null;

    // Seamless scroll ke liye data repeat karna
    const tickerQuotes = [...quotes, ...quotes, ...quotes, ...quotes];

    return (
        <div className="w-full h-11 bg-slate-100 dark:bg-slate-900 border-b border-border overflow-hidden relative z-[50] flex items-center">
            {/* Left/Right Gradients for smooth look */}
            <div className="absolute left-0 z-10 h-full w-12 bg-linear-to-r from-slate-100 dark:from-slate-900 to-transparent pointer-events-none" />

            <div className="flex animate-ticker whitespace-nowrap hover:[animation-play-state:paused]">
                {tickerQuotes.map((quote, i) => (
                    <Link
                        key={`${quote.symbol}-${i}`}
                        href={`/market/${encodeURIComponent(quote.symbol)}`}
                        className="inline-flex items-center gap-2 px-8 border-r border-border/50 text-sm hover:bg-muted transition-colors cursor-pointer py-2 h-full"
                    >
                        <span className="font-bold text-slate-900 dark:text-white">
                            {quote.name || quote.symbol}
                        </span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                            {quote.price?.toFixed(2)}
                        </span>
                        <span
                            className={cn(
                                "flex items-center text-xs font-semibold",
                                (quote.changesPercentage || 0) >= 0 ? "text-green-600" : "text-red-600"
                            )}
                        >
                            {(quote.changesPercentage || 0) >= 0 ? (
                                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                            ) : (
                                <ArrowDownRight className="w-3 h-3 mr-0.5" />
                            )}
                            {Math.abs(quote.changesPercentage || 0).toFixed(2)}%
                        </span>
                    </Link>
                ))}
            </div>

            <div className="absolute right-0 z-10 h-full w-12 bg-linear-to-l from-slate-100 dark:from-slate-900 to-transparent pointer-events-none" />
        </div>
    );
}