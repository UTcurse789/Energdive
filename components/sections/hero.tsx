import Image from "next/image";
import Link from "next/link";
import { ARTICLES } from "@/data/dummy";

// Using the first article as hero feature, and next 5 as top stories
const featuredArticle = ARTICLES[0];
const topStories = ARTICLES.slice(1, 6);

export function Hero() {
    return (
        <section className="py-8 md:py-12 border-b border-border">
            <div className="container grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">

                {/* Main Hero Story (70%) */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                    <Link href={`/news/${featuredArticle.slug}`} className="group block">
                        <div className="relative aspect-video w-full overflow-hidden bg-muted mb-4">
                            <Image
                                src={featuredArticle.image}
                                alt={featuredArticle.title}
                                fill
                                priority
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                            <span className="px-2 py-1 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider">
                                {featuredArticle.category}
                            </span>
                            <span className="text-sm text-muted-foreground">{featuredArticle.date}</span>
                            <span className="text-sm text-muted-foreground">• {featuredArticle.readTime}</span>
                        </div>

                        <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl font-black leading-[1.1] mb-4 text-foreground group-hover:text-primary transition-colors">
                            {featuredArticle.title}
                        </h1>

                        <p className="text-lg md:text-xl text-muted-foreground font-serif leading-relaxed max-w-2xl">
                            {featuredArticle.excerpt}
                        </p>

                        <div className="mt-4 flex items-center gap-3">
                            {featuredArticle.author && (
                                <>
                                    <div className="relative w-8 h-8 rounded-full overflow-hidden">
                                        <Image src={featuredArticle.author.avatar} alt={featuredArticle.author.name} fill className="object-cover" />
                                    </div>
                                    <span className="text-sm font-bold text-foreground">{featuredArticle.author.name}</span>
                                </>
                            )}
                        </div>
                    </Link>
                </div>

                {/* Top Stories Sidebar (30%) */}
                <div className="lg:col-span-4 border-l-0 lg:border-l border-border lg:pl-12">
                    <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        Top Stories
                    </h3>

                    <div className="flex flex-col gap-6">
                        {topStories.map((story, index) => (
                            <Link key={story.id} href={`/news/${story.slug}`} className="group block border-b border-border last:border-0 pb-6 last:pb-0">
                                <div className="flex gap-4 items-start">
                                    <span className="text-2xl font-serif font-bold text-border group-hover:text-primary/20 transition-colors">
                                        {index + 1}
                                    </span>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                                            {story.category}
                                        </span>
                                        <h4 className="font-serif text-lg font-bold leading-tight group-hover:text-primary transition-colors">
                                            {story.title}
                                        </h4>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
