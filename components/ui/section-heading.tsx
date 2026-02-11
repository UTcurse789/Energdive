import { cn } from "@/lib/utils";

interface SectionHeadingProps {
    title: string;
    linkText?: string;
    linkHref?: string;
    className?: string;
}

export function SectionHeading({ title, linkText, linkHref, className }: SectionHeadingProps) {
    return (
        <div className={cn("flex items-center justify-between border-t-2 border-primary pt-4 mb-6", className)}>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                {title}
            </h2>
            {linkText && linkHref && (
                <a
                    href={linkHref}
                    className="text-sm font-medium text-primary hover:text-primary/80 uppercase tracking-wider flex items-center gap-1"
                >
                    {linkText} <span aria-hidden="true">&rarr;</span>
                </a>
            )}
        </div>
    );
}
