import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

export type IssueArticle = {
  id: string;
  title: string;
  excerpt: string;
  authorName: string;
  image: string;
  href: string;
  section: string;
  date?: string;
};

export type CurrentIssueSectionProps = {
  month: string;
  year: string;
  coverImage: string;
  issueSlug: string;
  articles?: IssueArticle[];
};

function IssueLink({
  href,
  children,
  tone = "default",
}: {
  href: string;
  children: ReactNode;
  tone?: "default" | "red";
}) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex w-fit items-center gap-1 border-b pb-1 font-serif text-sm leading-none transition-colors sm:text-base",
        tone === "red"
          ? "border-[#D71913] text-[#D71913] hover:text-red-800"
          : "border-slate-950 text-slate-950 hover:text-[#007A3D]",
      ].join(" ")}
    >
      {children}
      <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
    </Link>
  );
}

export function CurrentIssueSection({
  month,
  year,
  coverImage,
  issueSlug,
  articles = [],
}: CurrentIssueSectionProps) {
  const displayArticles = articles.slice(0, 4);

  if (!issueSlug || displayArticles.length === 0) return null;

  const issueHref = `/issues/${issueSlug}`;
  const issueLabel = [month, year].filter(Boolean).join(" ") || "Latest Issue";

  return (
    <section className="bg-white py-8 lg:py-7">
      <div className="w-full">
        <div className="border-t border-slate-200 pt-8">
          <header className="mb-6 text-center sm:text-left">
            <p className="font-serif text-xl font-normal italic leading-tight text-[#D71913] sm:text-2xl">
                Current Issue
            </p>
            <h2 className="mt-1.5 font-serif text-xl font-bold leading-tight tracking-normal text-slate-950 sm:text-2xl">
              {issueLabel}
            </h2>
          </header>

          <div className="grid items-start gap-8 lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[200px_minmax(0,1fr)] xl:gap-12">
            <aside className="flex min-w-0 flex-col items-center sm:items-start text-center sm:text-left">

            <Link href={issueHref} className="group block w-fit mx-auto sm:mx-0" aria-label={`Open ${issueLabel} issue`}>
              <div className="bg-slate-50 p-2 shadow-md ring-1 ring-slate-200/80 rounded-md">
                <Image
                  src={coverImage || "/current-magazine.jpg"}
                  alt={`ENERGDIVE ${issueLabel} cover`}
                  width={220}
                  height={293}
                  sizes="(max-width: 640px) 200px, (max-width: 1024px) 170px, 190px"
                  className="h-auto w-[180px] sm:w-[170px] lg:w-[190px] bg-white object-cover transition-transform duration-500 group-hover:scale-[1.02] rounded-xs"
                  unoptimized
                />
              </div>
            </Link>

            <nav className="mt-5 flex flex-col items-center sm:items-start gap-3 w-full" aria-label="Current issue actions">
              <IssueLink href={issueHref}>Full Table of Contents</IssueLink>
              <IssueLink href="/subscribe" tone="red">
                Subscribe
              </IssueLink>
            </nav>
            </aside>

          <div className="min-w-0">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {displayArticles.map((article, index) => {
                const isLast = index === displayArticles.length - 1;
                const hasDesktopBottomBorder = index < 2 && displayArticles.length > 2;

                return (
                  <Link
                    key={article.id}
                    href={article.href}
                    className={[
                      "group grid grid-cols-[minmax(0,1fr)_4rem] items-start gap-4 py-4 transition-colors hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_4.5rem] sm:gap-5 xl:grid-cols-[minmax(0,1fr)_5rem]",
                      !isLast ? "border-b border-slate-200" : "",
                      hasDesktopBottomBorder ? "md:border-b md:border-slate-200" : "md:border-b-0",
                      index % 2 === 0 ? "md:pr-6 xl:pr-8" : "md:pl-6 xl:pl-8",
                      index < 2 ? "md:pt-0" : "md:pb-0",
                    ].join(" ")}
                  >
                    <div className="min-w-0">
                      <h3 className="font-serif text-sm font-bold leading-[1.25] tracking-normal text-slate-950 transition-colors group-hover:text-[#007A3D] sm:text-[15px] lg:text-base">
                        {article.title}
                      </h3>

                      {article.date && (
                        <time
                          dateTime={article.date}
                          className="mt-1 block text-[10px] text-slate-400 font-medium uppercase tracking-wide"
                        >
                          {article.date}
                        </time>
                      )}

                      {article.excerpt && (
                        <p className="mt-1.5 line-clamp-2 font-serif text-xs leading-snug text-slate-500 sm:text-[13px]">
                          {article.excerpt}
                        </p>
                      )}

                      {article.authorName && (
                        <p className="mt-2 font-serif text-[11px] font-bold leading-tight text-slate-950 sm:text-xs">
                          {article.authorName}
                        </p>
                      )}
                    </div>

                    <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                      <Image
                        src={article.image || "/magazine-default.jpg"}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 64px, (max-width: 1280px) 72px, 84px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
