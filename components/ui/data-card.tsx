import { ArrowRight, BarChart3, Lock } from "lucide-react";
import Link from "next/link";

interface DataCardProps {
    title: string;
    category: string;
    description: string;
    href?: string;
}

export function DataCard({ title, category, description, href = "#" }: DataCardProps) {
    return (
        <Link href={href} className="group block bg-white border border-border p-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <BarChart3 className="w-24 h-24 text-primary" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary/80">{category}</span>
                    <Lock className="w-4 h-4 text-muted-foreground" />
                </div>

                <h3 className="font-serif text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {title}
                </h3>

                <p className="text-muted-foreground text-sm mb-6 line-clamp-3">
                    {description}
                </p>

                <div className="flex items-center text-primary font-medium text-sm group-hover:underline decoration-1 underline-offset-4">
                    Unlock Insights <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
            </div>
        </Link>
    );
}
