import { getQuotes, getIndexNews } from "@/lib/fmp";
import { MarketChart } from "@/components/features/market-chart";
import { notFound } from "next/navigation";
import { Activity, Globe, Info, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateChip } from "@/components/ui/date-chip";

export default async function Page({ params }: { params: Promise<{ symbol: string }> }) {
    const { symbol } = await params;
    const quotes = await getQuotes([symbol]);
    if (!quotes.length) notFound();

    const q = quotes[0];
    const news = await getIndexNews(symbol);
    const isPositive = q.changesPercentage >= 0;

    return (
        <div className="bg-zinc-50 dark:bg-black min-h-screen">
            <div className="container py-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 border-b border-zinc-200 dark:border-zinc-800 pb-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-zinc-500 uppercase text-xs font-bold tracking-widest">
                            <Globe className="w-3 h-3" />
                            Market Intelligence / {q.exchange}
                        </div>
                        <h1 className="text-5xl font-serif font-black tracking-tighter italic">
                            {q.name}
                        </h1>
                        <p className="text-zinc-500 font-mono">{q.symbol} • Global Index</p>
                    </div>

                    <div className="flex flex-col items-end">
                        <span className="text-6xl font-black tracking-tighter font-mono">
                            {q.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <div className={cn(
                            "flex items-center gap-2 font-bold text-lg mt-1",
                            isPositive ? "text-emerald-600" : "text-rose-600"
                        )}>
                            <span>{isPositive ? "+" : ""}{q.changesPercentage.toFixed(2)}%</span>
                            <span className="text-zinc-400 text-sm font-normal">Today</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Column: Chart & News */}
                    <div className="lg:col-span-8 space-y-12">
                        {/* Main Chart Container */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-1 shadow-2xl shadow-zinc-200/50 dark:shadow-none">
                            <MarketChart symbol={symbol} />
                        </div>

                        {/* News Feed */}
                        {/* News Feed Section */}
                        <section className="space-y-10">
                            <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
                                <Activity className="w-6 h-6 text-primary" />
                                <h3 className="text-3xl font-serif font-black italic tracking-tighter text-zinc-900 dark:text-zinc-100">
                                    Market Intelligence Feed
                                </h3>
                            </div>

                            {/* Wider Grid for News */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                {news.map((n) => (
                                    <div key={n.url} className="group cursor-pointer flex flex-col gap-4 border-b border-zinc-100 dark:border-zinc-900 pb-8 last:border-0 md:last:border-b">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-2 py-1 rounded">
                                                {n.site}
                                            </span>
                                            <DateChip value={n.publishedDate} className="text-[10px]" />
                                        </div>

                                        <h4 className="text-2xl font-bold font-serif leading-[1.2] group-hover:text-primary transition-all duration-300 decoration-primary/30 underline-offset-8 group-hover:underline">
                                            {n.title}
                                        </h4>

                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 font-serif leading-relaxed">
                                            {n.text}
                                        </p>

                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-zinc-400 group-hover:text-primary transition-colors mt-auto">
                                            Read Intelligence Report
                                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Key Stats Sidebar */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-32 space-y-6">
                            <div className="bg-zinc-900 text-white dark:bg-white dark:text-black p-8 rounded-2xl shadow-xl">
                                <div className="flex items-center gap-2 mb-6">
                                    <TrendingUp className="w-5 h-5" />
                                    <h3 className="text-xs font-black uppercase tracking-widest">Technical Overview</h3>
                                </div>

                                <div className="space-y-4 font-mono text-sm">
                                    <StatRow label="Open" value={q.open} />
                                    <StatRow label="Day High" value={q.dayHigh} highlight />
                                    <StatRow label="Day Low" value={q.dayLow} />
                                    <StatRow label="Volume" value={q.volume?.toLocaleString()} isText />
                                    <StatRow label="Exchange" value={q.exchange} isText />
                                </div>

                                <button className="w-full mt-8 bg-primary text-primary-foreground py-4 text-xs font-black uppercase tracking-[0.2em] rounded-lg hover:brightness-110 transition-all">
                                    Full Market Report
                                </button>
                            </div>

                            <div className="p-6 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900">
                                <div className="flex items-center gap-2 text-zinc-500 mb-2">
                                    <Info className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-tighter">Data Disclaimer</span>
                                </div>
                                <p className="text-[10px] text-zinc-400 leading-relaxed">
                                    Market data is delayed by at least 15 minutes. Information is provided 'as is' and solely for informational purposes, not for trading purposes or advice.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper Component for Sidebar Rows
function StatRow({ label, value, highlight = false, isText = false }: any) {
    return (
        <div className="flex justify-between items-center border-b border-zinc-700 dark:border-zinc-200 pb-2 last:border-0">
            <span className="opacity-60 text-[10px] uppercase font-bold tracking-tighter">{label}</span>
            <span className={cn("font-bold", highlight && "text-emerald-400 dark:text-emerald-600")}>
                {isText ? value : value?.toFixed(2)}
            </span>
        </div>
    );
}
