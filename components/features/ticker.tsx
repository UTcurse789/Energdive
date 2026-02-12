// components/features/ticker/index.tsx - no change needed
import Link from "next/link";
import { getQuotes, MAJOR_INDICES } from "@/lib/fmp";
import { TickerClient } from "./ticker-client";

export async function MarketTicker() {
    const data = await getQuotes(MAJOR_INDICES);
    return <TickerClient initialQuotes={data} />;
}