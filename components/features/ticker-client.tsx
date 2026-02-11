// components/features/ticker/ticker-client.tsx
"use client";

import { Quote } from "@/lib/fmp";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { MoveUpRight, MoveDownRight } from "lucide-react";
import { useState } from "react";

interface TickerClientProps {
    initialQuotes: Quote[];
}

export function TickerClient({ initialQuotes }: TickerClientProps) {
    const [quotes] = useState(initialQuotes);

    if (!Array.isArray(quotes) || quotes.length === 0) return null;

    const tickerQuotes = [...quotes, ...quotes, ...quotes, ...quotes];

    return (
        <div className="sticky top-16 w-full h-12 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 overflow-hidden z-40 flex items-center shadow-sm">
            {/* Left gradient - FIXED */}
            <div className="absolute left-0 z-10 h-full w-20 bg-linear-to-r from-white dark:from-zinc-950 to-transparent pointer-events-none" />

            <div className="flex animate-ticker whitespace-nowrap hover:[animation-play-state:paused] w-full">
                {tickerQuotes.map((quote, i) => (
                    <Link
                        key={`${quote.symbol}-${i}`}
                        href={`/market/${encodeURIComponent(quote.symbol)}`}
                        className="inline-flex items-center gap-3 px-10 border-r border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer py-3 h-full group"
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                            {quote.name || quote.symbol}
                        </span>

                        <span className="font-mono font-bold text-sm tracking-tighter text-zinc-900 dark:text-zinc-100">
                            {quote.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>

                        <span
                            className={cn(
                                "flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full",
                                (quote.changesPercentage || 0) >= 0
                                    ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10"
                                    : "text-rose-700 bg-rose-50 dark:bg-rose-500/10"
                            )}
                        >
                            {(quote.changesPercentage || 0) >= 0 ? (
                                <MoveUpRight className="w-3 h-3 mr-1" />
                            ) : (
                                <MoveDownRight className="w-3 h-3 mr-1" />
                            )}
                            {Math.abs(quote.changesPercentage || 0).toFixed(2)}%
                        </span>
                    </Link>
                ))}
            </div>

            {/* Right gradient - FIXED */}
            <div className="absolute right-0 z-10 h-full w-20 bg-linear-to-l from-white dark:from-zinc-950 to-transparent pointer-events-none" />
        </div>
    );
}