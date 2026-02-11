import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ArticleCard } from "@/components/ui/article-card";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/buttons";
import { ARTICLES } from "@/data/dummy";

export default function SearchPage() {
    return (
        <div className="min-h-screen bg-background font-sans">
            <Header />

            <main className="pt-24 pb-16 min-h-[60vh]">
                <div className="container max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="font-serif text-3xl md:text-5xl font-bold mb-6">Search EnergDive</h1>
                        <div className="relative max-w-2xl mx-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search for news, reports, data..."
                                className="w-full pl-12 pr-4 py-4 border border-input rounded-none focus:outline-none focus:ring-2 focus:ring-primary text-lg"
                                autoFocus
                            />
                            <Button className="absolute right-2 top-2" size="sm">Search</Button>
                        </div>
                        <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
                            <span>Trending:</span>
                            {["Hydrogen", "LNG Prices", "Carbon Tax", "Offshore Wind"].map(term => (
                                <button key={term} className="hover:text-primary underline underline-offset-4">{term}</button>
                            ))}
                        </div>
                    </div>

                    {/* Mock Results */}
                    <div className="space-y-8">
                        <h3 className="font-bold text-lg border-b border-border pb-2">Top Results</h3>
                        {ARTICLES.slice(0, 3).map((article) => (
                            <ArticleCard key={article.id} article={article} variant="horizontal" />
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
