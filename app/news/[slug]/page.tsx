import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/buttons";
import { ArticleCard } from "@/components/ui/article-card";
import { ARTICLES } from "@/data/dummy";
import { Facebook, Linkedin, Twitter, Share2 } from "lucide-react";

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const article = ARTICLES[0]; // Mock article
    const relatedArticles = ARTICLES.slice(1, 4);

    return (
        <div className="min-h-screen bg-background font-sans">
            <Header />

            <main className="pt-24 pb-16">
                <article className="container grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Main Content (8 cols) */}
                    <div className="lg:col-span-8">
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                            <Link href="/" className="hover:text-primary">Home</Link>
                            <span>/</span>
                            <Link href="/news" className="hover:text-primary">News</Link>
                            <span>/</span>
                            <span className="text-foreground font-medium">{article.category}</span>
                        </div>

                        <h1 className="font-serif text-3xl md:text-5xl font-black leading-tight mb-4">
                            {article.title}
                        </h1>

                        <p className="text-xl md:text-2xl text-muted-foreground font-serif leading-relaxed mb-8">
                            {article.excerpt}
                        </p>

                        <div className="flex items-center justify-between border-y border-border py-4 mb-8">
                            <div className="flex items-center gap-3">
                                {article.author && (
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-10 h-10 rounded-full overflow-hidden">
                                            <Image src={article.author.avatar} alt={article.author.name} fill className="object-cover" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm">{article.author.name}</div>
                                            <div className="text-xs text-muted-foreground">{article.date} · {article.readTime}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" className="rounded-full w-8 h-8 p-0"><Twitter className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="sm" className="rounded-full w-8 h-8 p-0"><Linkedin className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="sm" className="rounded-full w-8 h-8 p-0"><Share2 className="w-4 h-4" /></Button>
                            </div>
                        </div>

                        {/* Hero Image */}
                        <div className="relative aspect-video w-full mb-8 overflow-hidden">
                            <Image src={article.image} alt={article.title} fill className="object-cover" priority />
                        </div>

                        {/* Content */}
                        <div className="prose prose-lg max-w-none font-serif prose-headings:font-sans prose-headings:font-bold prose-a:text-primary">
                            <p>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                            </p>
                            <p>
                                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                            </p>

                            <h3>The Impact on Global Markets</h3>
                            <p>
                                Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
                            </p>

                            <blockquote>
                                "The shift towards renewable energy is not just a trend, but a fundamental restructuring of the global economy."
                            </blockquote>

                            <p>
                                Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
                            </p>

                            <ul>
                                <li>Clean energy investment reached $1.1 trillion in 2024</li>
                                <li>Fossil fuel demand expected to peak by 2030</li>
                                <li>Grid modernization remains the biggest bottleneck</li>
                            </ul>
                        </div>

                        {/* Author Bio Box */}
                        <div className="bg-muted/30 p-8 mt-12 flex items-center gap-6 border border-border">
                            {article.author && (
                                <>
                                    <div className="relative w-20 h-20 rounded-full overflow-hidden shrink-0">
                                        <Image src={article.author.avatar} alt={article.author.name} fill className="object-cover" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg mb-1">About {article.author.name}</h4>
                                        <p className="text-muted-foreground text-sm mb-3">{article.author.bio}</p>
                                        <Link href="#" className="text-primary text-sm font-bold uppercase tracking-wider">View more articles</Link>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Sidebar (4 cols) */}
                    <aside className="lg:col-span-4 space-y-8">
                        {/* Newsletter Widget */}
                        <div className="bg-primary text-primary-foreground p-6">
                            <h3 className="font-serif text-xl font-bold mb-2">Daily Briefing</h3>
                            <p className="text-sm text-accent mb-4">Essential energy news, curated by our editors. Delivered every morning.</p>
                            <input type="email" placeholder="Your work email" className="w-full p-2 text-foreground text-sm mb-2" />
                            <Button variant="secondary" fullWidth>Subscribe</Button>
                        </div>

                        {/* Trending / Related */}
                        <div>
                            <h3 className="font-sans text-xs font-bold uppercase tracking-widest border-b border-border pb-2 mb-4">
                                Related Stories
                            </h3>
                            <div className="flex flex-col gap-6">
                                {relatedArticles.map((item) => (
                                    <ArticleCard key={item.id} article={item} variant="vertical" className="mb-2" />
                                ))}
                            </div>
                        </div>
                    </aside>

                </article>
            </main>

            <Footer />
        </div>
    );
}
