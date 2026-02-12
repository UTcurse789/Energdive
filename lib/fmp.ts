

// lib/fmp.ts


// export interface Quote {
//     symbol: string;
//     name: string;
//     price: number;
//     changesPercentage: number;
//     change: number;
//     dayLow: number;
//     dayHigh: number;
//     yearHigh: number;
//     yearLow: number;
//     marketCap: number;
//     priceAvg50: number;
//     priceAvg200: number;
//     volume: number;
//     avgVolume: number;
//     exchange: string;
//     open: number;
//     previousClose: number;
//     eps: number;
//     pe: number;
//     earningsAnnouncement: string;
//     sharesOutstanding: number;
//     timestamp: number;
//     currency?: string;
// }

// export const MAJOR_INDICES = ["^GSPC", "^IXIC", "^DJI", "BTCUSD", "ETHUSD"];

// export async function getQuotes(symbols: string[]): Promise<Quote[]> {
//     try {
//         const symbolStr = symbols.map(s => encodeURIComponent(s)).join(",");
//         const url = `https://financialmodelingprep.com/api/v3/quote/${symbolStr}?apikey=${process.env.FMP_API_KEY}`;
//         const res = await fetch(url, { next: { revalidate: 30 } });

//         if (!res.ok) throw new Error("API Limit/Legacy Error");

//         const data = await res.json();

//         // FMP sometimes returns 200 OK with an Error Message object
//         if (data["Error Message"]) throw new Error(data["Error Message"]);
//         if (!Array.isArray(data)) throw new Error("Invalid API response format");

//         return data;
//     } catch (e) {
//         console.error("FMP API Error, using fallback:", e);
//         // Dummy data for testing UI
//         return [
//             {
//                 symbol: "^GSPC", name: "S&P 500", price: 5123.42, changesPercentage: 1.2, change: 60.5, dayLow: 5080, dayHigh: 5150, yearHigh: 5200, yearLow: 4000,
//                 marketCap: 0, priceAvg50: 5000, priceAvg200: 4800, volume: 1000000, avgVolume: 1000000, exchange: "INDEX", open: 5100, previousClose: 5060,
//                 eps: 0, pe: 0, earningsAnnouncement: "", sharesOutstanding: 0, timestamp: Date.now()
//             },
//             {
//                 symbol: "^IXIC", name: "NASDAQ", price: 16274.95, changesPercentage: -0.45, change: -73.2, dayLow: 16200, dayHigh: 16400, yearHigh: 17000, yearLow: 12000,
//                 marketCap: 0, priceAvg50: 16000, priceAvg200: 14000, volume: 1000000, avgVolume: 1000000, exchange: "INDEX", open: 16300, previousClose: 16348,
//                 eps: 0, pe: 0, earningsAnnouncement: "", sharesOutstanding: 0, timestamp: Date.now()
//             },
//             {
//                 symbol: "^DJI", name: "Dow Jones", price: 39127.14, changesPercentage: 0.15, change: 58.6, dayLow: 39000, dayHigh: 39300, yearHigh: 40000, yearLow: 32000,
//                 marketCap: 0, priceAvg50: 38000, priceAvg200: 35000, volume: 1000000, avgVolume: 1000000, exchange: "INDEX", open: 39050, previousClose: 39068,
//                 eps: 0, pe: 0, earningsAnnouncement: "", sharesOutstanding: 0, timestamp: Date.now()
//             },
//             {
//                 symbol: "BTCUSD", name: "Bitcoin", price: 63240.12, changesPercentage: 2.4, change: 1500, dayLow: 61000, dayHigh: 64000, yearHigh: 73000, yearLow: 25000,
//                 marketCap: 0, priceAvg50: 60000, priceAvg200: 45000, volume: 1000000, avgVolume: 1000000, exchange: "CRYPTO", open: 61700, previousClose: 61740,
//                 eps: 0, pe: 0, earningsAnnouncement: "", sharesOutstanding: 0, timestamp: Date.now()
//             }
//         ];
//     }
// }
// export interface NewsItem {
//     symbol: string;
//     publishedDate: string;
//     title: string;
//     image: string;
//     site: string;
//     text: string;
//     url: string;
// }

// export async function getIndexNews(symbol: string): Promise<NewsItem[]> {
//     try {
//         const url = `${BASE_URL}/stock_news?tickers=${symbol}&limit=10&apikey=${API_KEY}`;
//         const res = await fetch(url, { next: { revalidate: 3600 } });

//         if (!res.ok) {
//             console.error("Failed to fetch news:", res.status, await res.text());
//             return [];
//         }

//         return await res.json();
//     } catch (error) {
//         console.error("Error fetching news:", error);
//         return [];
//     }
// }



// lib/fmp.ts
// lib/fmp.ts
const YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";
const API_KEY = process.env.FMP_API_KEY;
const BASE_URL = "https://financialmodelingprep.com/api/v3";
export interface Quote {
    symbol: string;
    name: string;
    price: number;
    changesPercentage: number;
    change: number;
    dayLow: number;
    dayHigh: number;
    yearHigh: number;
    yearLow: number;
    marketCap: number;
    priceAvg50: number;
    priceAvg200: number;
    volume: number;
    avgVolume: number;
    exchange: string;
    open: number;
    previousClose: number;
    eps: number;
    pe: number;
    earningsAnnouncement: string;
    sharesOutstanding: number;
    timestamp: number;
    currency?: string;
}

// Yahoo Finance symbols (different from FMP)
export const MAJOR_INDICES = ["^GSPC", "^IXIC", "^DJI", "BTC-USD"];

export async function getQuotes(symbols: string[]): Promise<Quote[]> {
    try {
        const quotes = await Promise.all(
            symbols.map(async (symbol) => {
                try {
                    const url = `${YAHOO_BASE}/${symbol}?interval=1d&range=1d`;
                    const res = await fetch(url, {
                        next: { revalidate: 60 },
                        headers: {
                            'User-Agent': 'Mozilla/5.0'
                        }
                    });

                    if (!res.ok) throw new Error(`Failed to fetch ${symbol}`);

                    const data = await res.json();
                    const result = data.chart.result[0];
                    const meta = result.meta;
                    const quote = result.indicators.quote[0];

                    const currentPrice = meta.regularMarketPrice;
                    const previousClose = meta.chartPreviousClose || meta.previousClose;
                    const change = currentPrice - previousClose;
                    const changePercent = (change / previousClose) * 100;

                    // Get name mapping
                    const nameMap: Record<string, string> = {
                        "^GSPC": "S&P 500",
                        "^IXIC": "NASDAQ",
                        "^DJI": "Dow Jones",
                        "BTC-USD": "Bitcoin"
                    };

                    const quoteData: Quote = {
                        symbol,
                        name: nameMap[symbol] || meta.symbol,
                        price: currentPrice,
                        changesPercentage: changePercent,
                        change: change,
                        dayLow: meta.regularMarketDayLow || quote.low?.[0] || currentPrice,
                        dayHigh: meta.regularMarketDayHigh || quote.high?.[0] || currentPrice,
                        yearHigh: meta.fiftyTwoWeekHigh || currentPrice,
                        yearLow: meta.fiftyTwoWeekLow || currentPrice,
                        marketCap: 0,
                        priceAvg50: 0,
                        priceAvg200: 0,
                        volume: meta.regularMarketVolume || quote.volume?.[0] || 0,
                        avgVolume: 0,
                        exchange: meta.exchangeName || "INDEX",
                        open: quote.open?.[0] || currentPrice,
                        previousClose: previousClose,
                        eps: 0,
                        pe: 0,
                        earningsAnnouncement: "",
                        sharesOutstanding: 0,
                        timestamp: Date.now(),
                        currency: meta.currency
                    };

                    return quoteData;
                } catch (err) {
                    console.error(`Error fetching ${symbol}:`, err);
                    return null;
                }
            })
        );

        // Filter out nulls with proper type guard
        const validQuotes = quotes.filter((q): q is Quote => q !== null);

        if (validQuotes.length === 0) {
            throw new Error("No valid quotes");
        }

        return validQuotes;
    } catch (e) {
        console.error("[Yahoo Finance] Error, using fallback:", e);

        // Fallback data
        return [
            {
                symbol: "S&P 500",
                name: "S&P 500",
                price: 5850.34,
                changesPercentage: 0.75,
                change: 43.65,
                dayLow: 5820.12,
                dayHigh: 5862.45,
                yearHigh: 5900.00,
                yearLow: 4200.00,
                marketCap: 0,
                priceAvg50: 5750.00,
                priceAvg200: 5400.00,
                volume: 3500000000,
                avgVolume: 3200000000,
                exchange: "INDEX",
                open: 5825.00,
                previousClose: 5806.69,
                eps: 0,
                pe: 0,
                earningsAnnouncement: "",
                sharesOutstanding: 0,
                timestamp: Date.now(),
                currency: "USD"
            },
            {
                symbol: "NASDAQ",
                name: "NASDAQ",
                price: 18421.45,
                changesPercentage: -0.28,
                change: -51.89,
                dayLow: 18350.00,
                dayHigh: 18480.00,
                yearHigh: 18600.00,
                yearLow: 14200.00,
                marketCap: 0,
                priceAvg50: 18100.00,
                priceAvg200: 16800.00,
                volume: 5100000000,
                avgVolume: 4900000000,
                exchange: "NASDAQ",
                open: 18450.00,
                previousClose: 18473.34,
                eps: 0,
                pe: 0,
                earningsAnnouncement: "",
                sharesOutstanding: 0,
                timestamp: Date.now(),
                currency: "USD"
            },
            {
                symbol: "Dow Jones",
                name: "Dow Jones",
                price: 43256.78,
                changesPercentage: 0.52,
                change: 223.45,
                dayLow: 43100.00,
                dayHigh: 43300.00,
                yearHigh: 43500.00,
                yearLow: 35500.00,
                marketCap: 0,
                priceAvg50: 42800.00,
                priceAvg200: 40500.00,
                volume: 415000000,
                avgVolume: 390000000,
                exchange: "NYSE",
                open: 43120.00,
                previousClose: 43033.33,
                eps: 0,
                pe: 0,
                earningsAnnouncement: "",
                sharesOutstanding: 0,
                timestamp: Date.now(),
                currency: "USD"
            },
            {
                symbol: "BTC-USD",
                name: "Bitcoin",
                price: 98567.23,
                changesPercentage: 2.85,
                change: 2734.56,
                dayLow: 96200.00,
                dayHigh: 99100.00,
                yearHigh: 105000.00,
                yearLow: 26500.00,
                marketCap: 0,
                priceAvg50: 93000.00,
                priceAvg200: 68000.00,
                volume: 28900000000,
                avgVolume: 26000000000,
                exchange: "CRYPTO",
                open: 95832.67,
                previousClose: 95832.67,
                eps: 0,
                pe: 0,
                earningsAnnouncement: "",
                sharesOutstanding: 0,
                timestamp: Date.now(),
                currency: "USD"
            }
        ];
    }
}

export interface NewsItem {
    symbol: string;
    publishedDate: string;
    title: string;
    image: string;
    site: string;
    text: string;
    url: string;
}

export async function getIndexNews(symbol: string): Promise<NewsItem[]> {
    try {
        const url = `${BASE_URL}/stock_news?tickers=${symbol}&limit=10&apikey=${API_KEY}`;
        const res = await fetch(url, { next: { revalidate: 3600 } });

        if (!res.ok) throw new Error("API Limit or Legacy Error");

        const data = await res.json();
        if (data["Error Message"]) throw new Error(data["Error Message"]);

        return data;
    } catch (error) {
        // Fallback Section: Unique URLs are essential here to avoid React Key errors
        return [
            {
                symbol,
                publishedDate: new Date(Date.now() - 3600000).toISOString(),
                title: `${symbol} Analysis: Global Market Trends and Intelligence`,
                image: "https://placehold.co/600x400/09090b/white?text=Market+Insights",
                site: "Energdive Intelligence",
                text: "Geopolitical shifts are impacting market dynamics as investors recalibrate risk exposure in the energy sector.",
                url: `fallback-1-${symbol}-${Date.now()}` // Unique ID
            },
            {
                symbol,
                publishedDate: new Date(Date.now() - 7200000).toISOString(),
                title: `Institutional Volume Increases in ${symbol} Trading`,
                image: "https://placehold.co/600x400/09090b/white?text=Volume+Analysis",
                site: "Market Analysis",
                text: "Accumulation phase observed by lead analysts suggests a long-term bullish sentiment despite short-term volatility.",
                url: `fallback-2-${symbol}-${Date.now()}` // Unique ID
            },
            {
                symbol,
                publishedDate: new Date(Date.now() - 10800000).toISOString(),
                title: "Energy Sector Faces Headwinds as Commodity Prices Fluctuate",
                image: "https://placehold.co/600x400/09090b/white?text=Energy+Trends",
                site: "Wall Street Journal",
                text: "Oil and gas companies navigate a volatile pricing environment driven by supply chain constraints.",
                url: `fallback-3-${symbol}-${Date.now()}` // Unique ID
            }
        ];
    }
}