import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ArticleCard } from "@/components/ui/article-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { ARTICLES } from "@/data/dummy";

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
    const { category } = await params;
    const categoryTitle = category ? category.replace(/-/g, " ") : "News";
    const categoryArticles = ARTICLES; // Mock data

    return (
        <div className="min-h-screen bg-background font-sans">
            <Header />

            <main className="pt-24 pb-16">
                <div className="container">
                    <div className="mb-12 border-b border-border pb-8">
                        <h1 className="font-serif text-4xl md:text-6xl font-black capitalize mb-4">
                            {categoryTitle}
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl font-serif">
                            Latest news, analysis, and market intelligence on {categoryTitle}.
                        </p>
                    </div>

                    {/* Featured in Category */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                        <div className="lg:col-span-2">
                            <ArticleCard article={categoryArticles[0]} variant="vertical" className="h-full" />
                        </div>
                        <div className="lg:col-span-1 flex flex-col gap-6">
                            <ArticleCard article={categoryArticles[1]} variant="vertical" />
                            <ArticleCard article={categoryArticles[2]} variant="vertical" />
                        </div>
                    </div>

                    <SectionHeading title="Latest Stories" />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {categoryArticles.map((article) => (
                            <ArticleCard key={article.id} article={article} />
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
