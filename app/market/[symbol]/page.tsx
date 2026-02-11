import { getQuotes, getIndexNews } from "@/lib/fmp";
import { MarketChart } from "@/components/features/market-chart";
import { notFound } from "next/navigation";


export default async function Page({ params }: { params: Promise<{ symbol: string }> }) {
    const { symbol } = await params;

    const quotes = await getQuotes([symbol]);

    if (!quotes.length) notFound();

    const q = quotes[0];
    const news = await getIndexNews(symbol);

    return (
        <div className="container py-10 grid grid-cols-12 gap-8">

            <div className="col-span-8">
                <h1 className="text-4xl font-black">{q.name}</h1>

                <p className="text-3xl mt-2">{q.price}</p>

                <MarketChart symbol={symbol} />

                <h3 className="text-xl font-bold mt-8 mb-4">Index News</h3>

                <div className="space-y-4">
                    {news.map(n => (
                        <div key={n.url} className="border-b pb-3">
                            <p className="font-bold">{n.title}</p>
                            <p className="text-sm text-muted-foreground">{n.site}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="col-span-4 border-l pl-6">
                <p>Open: {q.open}</p>
                <p>High: {q.dayHigh}</p>
                <p>Low: {q.dayLow}</p>
                <p>Volume: {q.volume}</p>
                <p>Exchange: {q.exchange}</p>
            </div>

        </div>
    );
}
