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

interface MarketChartProps {
    symbol: string;
}

export function MarketChart({ symbol }: MarketChartProps) {
    let cleanSymbol = decodeURIComponent(symbol);
    cleanSymbol = cleanSymbol.replace('^', '');

    // Precise mapping for TradingView symbols
    const symbolMap: Record<string, string> = {
        "GSPC": "TVC:SPX",
        "DJI": "TVC:DJI",
        "IXIC": "NASDAQ:IXIC",
        "RUT": "TVC:RUT",
        "VIX": "TVC:VIX",
        "BTCUSD": "COINBASE:BTCUSD", // Example for crypto if needed
    };

    const tvSymbol = symbolMap[cleanSymbol] || cleanSymbol;

    return (
        <div className="w-full h-[450px] rounded-xl overflow-hidden border border-border bg-black shadow-lg">
            <iframe
                src={`https://s.tradingview.com/widgetembed/?symbol=${tvSymbol}&interval=D&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hide_side_toolbar=1&allow_symbol_change=0&save_image=0&details=1`}
                className="w-full h-full"
                style={{ border: 0 }}
                title={`Market Chart for ${tvSymbol}`}
                loading="lazy"
                // @ts-expect-error - allowTransparency is a non-standard attribute but required for some iframes
                allowtransparency="true"
            />
        </div>
    );
}