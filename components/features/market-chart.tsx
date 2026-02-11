// "use client";

// import { HistoricalData } from "@/lib/fmp";
// import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// interface MarketChartProps {
//     data: HistoricalData[];
//     color: string;
// }

// export function MarketChart({ data, color }: MarketChartProps) {
//     if (!data || data.length === 0) {
//         return (
//             <div className="flex items-center justify-center h-full text-muted-foreground">
//                 No chart data available
//             </div>
//         );
//     }

//     // Reverse data if needed (FMP often returns latest first)
//     // FMP historical-chart usually returns oldest first? Let's check docs or assume latest first. 
//     // Actually usually API returns Latest -> Oldest. Recharts wants Oldest -> Latest (Left to Right).
//     const chartData = [...data].reverse();

//     return (
//         <ResponsiveContainer width="100%" height="100%">
//             <AreaChart data={chartData}>
//                 <defs>
//                     <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
//                         <stop offset="5%" stopColor={color} stopOpacity={0.3} />
//                         <stop offset="95%" stopColor={color} stopOpacity={0} />
//                     </linearGradient>
//                 </defs>
//                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
//                 <XAxis
//                     dataKey="date"
//                     tickFormatter={(val) => {
//                         const d = new Date(val);
//                         return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//                     }}
//                     stroke="var(--muted-foreground)"
//                     fontSize={12}
//                     tickLine={false}
//                     axisLine={false}
//                     minTickGap={30}
//                 />
//                 <YAxis
//                     domain={['auto', 'auto']}
//                     orientation="right"
//                     stroke="var(--muted-foreground)"
//                     fontSize={12}
//                     tickLine={false}
//                     axisLine={false}
//                     tickFormatter={(val) => val.toFixed(0)}
//                 />
//                 <Tooltip
//                     contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
//                     labelStyle={{ color: 'var(--muted-foreground)' }}
//                     formatter={(value: any) => [Number(value).toFixed(2), "Price"]}
//                 />
//                 <Area
//                     type="monotone"
//                     dataKey="close"
//                     stroke={color}
//                     strokeWidth={2}
//                     fillOpacity={1}
//                     fill="url(#colorPrice)"
//                 />
//             </AreaChart>
//         </ResponsiveContainer>
//     );
// }


"use client";

interface Props {
    symbol: string;
}

export function MarketChart({ symbol }: Props) {
    // 1. Symbol se '^' hatao
    let cleanSymbol = symbol.startsWith('^') ? symbol.substring(1) : symbol;

    // 2. Specific mapping (TradingView compatibility)
    if (cleanSymbol === "GSPC") cleanSymbol = "SPX";
    if (cleanSymbol === "IXIC") cleanSymbol = "IXIC";
    if (cleanSymbol === "DJI") cleanSymbol = "DJI";

    return (
        <div className="w-full h-[420px] rounded-xl overflow-hidden border bg-black">
            <iframe
                src={`https://s.tradingview.com/widgetembed/?symbol=${cleanSymbol}&interval=30&theme=dark&style=1`}
                className="w-full h-full"
                frameBorder="0"
            />
        </div>
    );
}