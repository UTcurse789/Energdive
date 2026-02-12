import Link from "next/link";
import Image from "next/image";
import { OpinionCard } from "@/components/ui/opinion-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { OPINIONS } from "@/data/dummy";

const featuredOpinion = OPINIONS[0];
const opinionList = OPINIONS.slice(1, 4);

export function OpinionSection() {
    if (!featuredOpinion) return null;

    return (
        <section className="py-12 bg-white border-b border-border">
            <SectionHeading title="Opinion & Analysis" linkText="All Opinions" linkHref="/opinion" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Featured Opinion - Large */}
                <div className="lg:col-span-7 bg-muted p-8 lg:p-12 relative overflow-hidden group">
                    <div className="relative z-10">
                        <span className="text-primary font-bold tracking-wider uppercase text-xs mb-4 block">Featured Insight</span>
                        <Link href={`/opinion/${featuredOpinion.slug}`}>
                            <h3 className="font-serif text-3xl md:text-5xl font-bold mb-6 leading-tight group-hover:text-primary transition-colors">
                                {featuredOpinion.title}
                            </h3>
                        </Link>
                        <p className="text-lg text-muted-foreground mb-8 max-w-lg font-serif">
                            {featuredOpinion.excerpt}
                        </p>

                        <div className="flex items-center gap-4">
                            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary">
                                <Image src={featuredOpinion.author.image} alt={featuredOpinion.author.name} fill className="object-cover" />
                            </div>
                            <div>
                                <div className="font-bold text-lg">{featuredOpinion.author.name}</div>
                                <div className="text-sm text-muted-foreground">{featuredOpinion.author.role}</div>
                            </div>
                        </div>
                    </div>

                    {/* Decorative background element */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                </div>

                {/* Side List */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                    {opinionList.map((opinion) => (
                        <OpinionCard key={opinion.id} opinion={opinion} />
                    ))}
                </div>
            </div>
        </section>
    );
}
