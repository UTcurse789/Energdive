// const FMP_API_KEY = "TBohKroMmZXDeAGVqLEVlv0M40oreFDG";
// const BASE_URL = "https://financialmodelingprep.com/api/v3";

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

// export interface HistoricalData {
//     date: string;
//     open: number;
//     high: number;
//     low: number;
//     close: number;
//     adjClose: number;
//     volume: number;
//     unadjustedVolume: number;
//     change: number;
//     changePercent: number;
//     vwap: number;
//     label: string;
//     changeOverTime: number;
// }

// export const MAJOR_INDICES = [
//     "^GSPC", // S&P 500
//     "^IXIC", // Nasdaq
//     "^DJI",  // Dow Jones
//     "^NSEI", // Nifty 50
//     "^BSESN", // Sensex
//     "BTCUSD", // Bitcoin
//     "CLUSD", // Crude Oil (WTI) - relevant for Energy news
//     "NGUSD"  // Natural Gas - relevant for Energy news
// ];

// export async function getQuotes(symbols: string[]): Promise<Quote[]> {
//     const symbolString = symbols.join(",");

//     try {
//         const res = await fetch(`${BASE_URL}/quote/${symbolString}?apikey=${FMP_API_KEY}`, { next: { revalidate: 60 } });

//         // If response is not OK or contains error message (FMP sometimes returns 200 with error body)
//         if (res.ok) {
//             const data = await res.json();
//             // Check if data is array and not an error object
//             if (Array.isArray(data) && data.length > 0) {
//                 return data;
//             }
//             // Check for specific error message in object
//             if (data["Error Message"]) {
//                 console.warn("FMP API Error:", data["Error Message"]);
//             }
//         } else {
//             const errorText = await res.text();
//             // Suppress error logging for known legacy endpoint restriction to avoid console noise
//             if (res.status === 403 && errorText.includes("Legacy Endpoint")) {
//                 // specific log for debugging if needed, or just silent fallback
//                 // console.log("FMP API Legacy Endpoint restriction detected. Using mock data.");
//             } else {
//                 console.error("Failed to fetch quotes, HTTP error:", res.status, errorText);
//             }
//         }
//     } catch (e) {
//         console.error("FMP API Fetch Failed", e);
//     }

//     // Fallback if API fails or returns legacy error (handled inside logic above but let's be safe)
//     // If we are here, it means we don't have data, so we let the fallback run.

//     // Fallback Mock Data
//     console.log("Using Mock Market Data due to API failure.");
//     return [
//         { symbol: "^GSPC", name: "S&P 500", price: 5893.62, changesPercentage: 0.40, change: 23.4, dayLow: 5870, dayHigh: 5900, yearHigh: 6000, yearLow: 4000, marketCap: 0, priceAvg50: 5700, priceAvg200: 5400, volume: 1000000, avgVolume: 1000000, exchange: "INDEX", open: 5870, previousClose: 5870.22, eps: 0, pe: 0, earningsAnnouncement: "", sharesOutstanding: 0, timestamp: Date.now() },
//         { symbol: "^IXIC", name: "Nasdaq", price: 18432.55, changesPercentage: 0.65, change: 110.2, dayLow: 18300, dayHigh: 18500, yearHigh: 19000, yearLow: 13000, marketCap: 0, priceAvg50: 18000, priceAvg200: 16000, volume: 1000000, avgVolume: 1000000, exchange: "INDEX", open: 18320, previousClose: 18322.35, eps: 0, pe: 0, earningsAnnouncement: "", sharesOutstanding: 0, timestamp: Date.now() },
//         { symbol: "^DJI", name: "Dow Jones", price: 42875.12, changesPercentage: -0.12, change: -50.5, dayLow: 42800, dayHigh: 43000, yearHigh: 43500, yearLow: 33000, marketCap: 0, priceAvg50: 42000, priceAvg200: 39000, volume: 1000000, avgVolume: 1000000, exchange: "INDEX", open: 42925, previousClose: 42925.62, eps: 0, pe: 0, earningsAnnouncement: "", sharesOutstanding: 0, timestamp: Date.now() },
//         { symbol: "CLUSD", name: "Crude Oil", price: 71.24, changesPercentage: 1.25, change: 0.88, dayLow: 70.1, dayHigh: 71.5, yearHigh: 90, yearLow: 65, marketCap: 0, priceAvg50: 72, priceAvg200: 75, volume: 100000, avgVolume: 100000, exchange: "COMMODITY", open: 70.36, previousClose: 70.36, eps: 0, pe: 0, earningsAnnouncement: "", sharesOutstanding: 0, timestamp: Date.now() },
//         { symbol: "NGUSD", name: "Natural Gas", price: 2.85, changesPercentage: -0.50, change: -0.015, dayLow: 2.8, dayHigh: 2.9, yearHigh: 3.5, yearLow: 1.5, marketCap: 0, priceAvg50: 2.5, priceAvg200: 2.3, volume: 100000, avgVolume: 100000, exchange: "COMMODITY", open: 2.86, previousClose: 2.86, eps: 0, pe: 0, earningsAnnouncement: "", sharesOutstanding: 0, timestamp: Date.now() }
//     ].filter(q => symbols.includes(q.symbol));
// }

// export async function getHistoricalChart(symbol: string, interval: '1min' | '5min' | '15min' | '30min' | '1hour' | '4hour' = '1hour'): Promise<HistoricalData[]> {
//     const res = await fetch(`${BASE_URL}/historical-chart/${interval}/${symbol}?apikey=${FMP_API_KEY}`, { next: { revalidate: 3600 } });
//     if (!res.ok) {
//         const errorText = await res.text();
//         if (res.status === 403 && errorText.includes("Legacy Endpoint")) {
//             // console.log("FMP Historical Data Legacy restriction. Returning empty.");
//             return [];
//         }
//         console.error("Failed to fetch historical data", errorText);
//         return [];
//     }
//     return res.json();
// }


// lib/fmp.ts
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

export const MAJOR_INDICES = ["^GSPC", "^IXIC", "^DJI", "BTCUSD", "ETHUSD"];

export async function getQuotes(symbols: string[]): Promise<Quote[]> {
    try {
        const symbolStr = symbols.map(s => encodeURIComponent(s)).join(",");
        const url = `https://financialmodelingprep.com/api/v3/quote/${symbolStr}?apikey=${process.env.FMP_API_KEY}`;
        const res = await fetch(url, { next: { revalidate: 30 } });

        if (!res.ok) throw new Error("API Limit/Legacy Error");

        const data = await res.json();

        // FMP sometimes returns 200 OK with an Error Message object
        if (data["Error Message"]) throw new Error(data["Error Message"]);
        if (!Array.isArray(data)) throw new Error("Invalid API response format");

        return data;
    } catch (e) {
        // Log warning instead of error for expected API limits to avoid cluttering terminal
        if (e instanceof Error && (e.message.includes("API Limit") || e.message.includes("Legacy"))) {
            console.warn(`[FMP] API Limit or Legacy Endpoint usage detected. Switching to fallback data. (${e.message})`);
        } else {
            console.error("[FMP] Failed to fetch quotes:", e);
        }

        // Return robust fallback data
        return [
            {
                symbol: "^GSPC", name: "S&P 500", price: 5123.42, changesPercentage: 1.2, change: 60.5, dayLow: 5080, dayHigh: 5150, yearHigh: 5200, yearLow: 4000,
                marketCap: 0, priceAvg50: 5000, priceAvg200: 4800, volume: 1000000, avgVolume: 1000000, exchange: "INDEX", open: 5100, previousClose: 5060,
                eps: 0, pe: 0, earningsAnnouncement: "", sharesOutstanding: 0, timestamp: Date.now()
            },
            {
                symbol: "^IXIC", name: "NASDAQ", price: 16274.95, changesPercentage: -0.45, change: -73.2, dayLow: 16200, dayHigh: 16400, yearHigh: 17000, yearLow: 12000,
                marketCap: 0, priceAvg50: 16000, priceAvg200: 14000, volume: 1000000, avgVolume: 1000000, exchange: "INDEX", open: 16300, previousClose: 16348,
                eps: 0, pe: 0, earningsAnnouncement: "", sharesOutstanding: 0, timestamp: Date.now()
            },
            {
                symbol: "^DJI", name: "Dow Jones", price: 39127.14, changesPercentage: 0.15, change: 58.6, dayLow: 39000, dayHigh: 39300, yearHigh: 40000, yearLow: 32000,
                marketCap: 0, priceAvg50: 38000, priceAvg200: 35000, volume: 1000000, avgVolume: 1000000, exchange: "INDEX", open: 39050, previousClose: 39068,
                eps: 0, pe: 0, earningsAnnouncement: "", sharesOutstanding: 0, timestamp: Date.now()
            },
            {
                symbol: "BTCUSD", name: "Bitcoin", price: 63240.12, changesPercentage: 2.4, change: 1500, dayLow: 61000, dayHigh: 64000, yearHigh: 73000, yearLow: 25000,
                marketCap: 0, priceAvg50: 60000, priceAvg200: 45000, volume: 1000000, avgVolume: 1000000, exchange: "CRYPTO", open: 61700, previousClose: 61740,
                eps: 0, pe: 0, earningsAnnouncement: "", sharesOutstanding: 0, timestamp: Date.now()
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
        const res = await fetch(url);
        if (!res.ok) throw new Error("Legacy API");
        return await res.json();
    } catch (error) {
        // Fallback dummy news for UI testing
        return [
            {
                symbol: symbol,
                publishedDate: "2026-02-11",
                title: `${symbol} showing strong resilience in current energy market`,
                site: "Energdive Insights",
                url: "#",
                text: "Full analysis on market trends...",
                image: ""
            }
        ];
    }
}