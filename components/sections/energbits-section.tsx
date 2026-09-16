"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Clock3, Sparkles } from "lucide-react";
import { useRef } from "react";
import SplitFlapText from "@/components/SplitFlapText";
import { formatContentDate } from "@/lib/date";
import { strapiMediaUrl } from "@/lib/strapi-image";

interface EnergbitsItem {
  id: number | string;
  Title?: string | null;
  slug?: string | null;
  type_of_content?: unknown;
  content_tag?: unknown;
  sectors?: Array<{ name?: string | null }> | null;
  Date?: string | null;
  publishedAt?: string | null;
  createdAt?: string | null;
  FeaturedImage?: unknown;
}

interface EnergbitsSectionProps { news: EnergbitsItem[]; }

function EnergbitsCard({ item, duplicate = false }: { item: EnergbitsItem; duplicate?: boolean }) {
  const href = `/energbits${item.slug ? `?bit=${encodeURIComponent(item.slug)}` : ""}`;
  const image = strapiMediaUrl(item.FeaturedImage, "/magazine-default.jpg");
  const sector = item.sectors?.[0]?.name || "Energy brief";
  const date = formatContentDate(item.Date || item.publishedAt || item.createdAt || "");

  return (
    <article className="group relative h-[320px] w-[min(78vw,280px)] shrink-0 snap-start overflow-hidden rounded-[16px] bg-slate-900 text-white shadow-xl shadow-slate-950/10 sm:h-[360px] sm:w-[280px] sm:rounded-[18px] lg:h-[380px] lg:w-[300px]">
      <Image src={image} alt="" fill sizes="(max-width: 640px) 278px, 305px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-slate-950/5" />
      <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-3.5">
        <span className="rounded-full border border-white/20 bg-slate-950/60 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] backdrop-blur-sm">{sector}</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/85 shadow-sm backdrop-blur-sm"><Sparkles className="h-3 w-3 text-emerald-600" /></span>
      </div>
      <Link href={href} tabIndex={duplicate ? -1 : undefined} className="absolute inset-0 z-10" aria-label={item.Title || "Read this energy brief"} />
      <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none p-4 sm:p-5">
        <p className="mb-2 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-400">In a minute</p>
        <h3 className="line-clamp-3 text-[15px] font-extrabold leading-[1.25] tracking-[-0.035em] text-white sm:text-[17px]">{item.Title || "The energy signal you need to know today"}</h3>
        <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-3.5 text-[9px] font-medium text-white/85 sm:text-[10px]">
          <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" /> {date || "Just in"}<span className="mx-0.5">•</span> 2 MIN READ</span>
          <span className="flex items-center gap-1 font-bold text-white transition-transform duration-300 group-hover:translate-x-1">Read <ArrowUpRight className="h-3 w-3" /></span>
        </div>
      </div>
    </article>
  );
}

export function EnergbitsSection({ news }: EnergbitsSectionProps) {
  const briefs = news.slice(0, 8);
  const railRef = useRef<HTMLDivElement>(null);

  if (briefs.length < 3) return null;

  const showNextCards = () => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: Math.min(rail.clientWidth * 0.85, 360), behavior: "smooth" });
  };
  return (
    <section className="overflow-hidden bg-white py-8 sm:py-10" aria-labelledby="energbits-heading">
      <div className="max-w-7xl mx-auto px-5 sm:px-10 lg:px-16">
        <div className="mb-7 flex flex-col gap-4 border-b border-slate-200 pb-7 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Image src="/ENERGNBITS.png" alt="Energbits" width={52} height={52} className="h-11 w-11 shrink-0 object-contain sm:h-[52px] sm:w-[52px]" />
            <div>
              <p className="mb-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-700 sm:text-[11px]">Fast energy intelligence</p>
              <h2 id="energbits-heading" className="sr-only">Energbits</h2>
              <SplitFlapText words={["ENERGBITS"]} padTo={9} fontSize={22} gap={3} tileRadius={4} tileColor="#111827" textColor="#ffffff" />
            </div>
          </div>
          <p className="max-w-sm text-xs leading-relaxed text-slate-500 sm:text-right">Quick, visual stories from the energy transition — curated for the time you have.</p>
        </div>
        <div className="relative">
          <div ref={railRef} className="energbits-marquee group/energbits snap-x snap-mandatory">
          <div className="energbits-track flex w-max">
            <div className="flex w-max gap-4 pr-4 sm:gap-5 sm:pr-5">
              {briefs.map((item) => <EnergbitsCard key={item.id} item={item} />)}
            </div>
            <div className="flex w-max gap-4 pr-4 sm:gap-5 sm:pr-5" aria-hidden="true">
              {briefs.map((item) => <EnergbitsCard key={`${item.id}-duplicate`} item={item} duplicate />)}
            </div>
          </div>
          </div>
          <button type="button" onClick={showNextCards} className="absolute right-[-14px] top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-700 shadow-xl shadow-slate-900/15 ring-1 ring-slate-200 transition-transform hover:scale-105 sm:flex" aria-label="Show more Energbits stories">
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-7 flex justify-end">
          <Link href="/energbits" className="group inline-flex items-center gap-3.5 rounded-lg border border-emerald-700 px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800 transition-colors hover:bg-emerald-700 hover:text-white sm:px-5">Explore all bits <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link>
        </div>
      </div>
    </section>
  );
}
