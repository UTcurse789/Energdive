"use client";

import { useState, useMemo, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock3, ChevronDown, ChevronRight, Heart, Link2, MessageCircle, MoreVertical, Reply, Repeat2, Share2, SlidersHorizontal, Sparkles, ThumbsUp, X } from "lucide-react";
import { buildContentUrl } from "@/lib/content-routes";
import { strapiMediaUrl } from "@/lib/strapi-image";
import { formatContentDate } from "@/lib/date";
import TextLoop from "@/components/TextLoop";
import SplitFlapText from "@/components/SplitFlapText";
import { useAuthModal } from "@/hooks/use-auth-modal";

/* ── Sector Data ───────────────────────────────────────────────────────── */

interface SubSector {
  name: string;
  slug: string;
}

interface SectorDef {
  name: string;
  slug: string;
  subSectors: SubSector[];
}

const SECTORS: SectorDef[] = [
  {
    name: "Oil & Gas",
    slug: "oil-gas",
    subSectors: [
      { name: "Upstream", slug: "upstream" },
      { name: "Midstream", slug: "midstream" },
      { name: "Downstream", slug: "downstream" },
      { name: "LNG", slug: "lng" },
      { name: "CGD", slug: "cgd" },
      { name: "Refining", slug: "refining" },
      { name: "Petrochemicals", slug: "petrochemicals" },
    ],
  },
  {
    name: "Power Generation",
    slug: "power-generation",
    subSectors: [
      { name: "Thermal", slug: "thermal" },
      { name: "Hydro", slug: "hydro" },
      { name: "Nuclear", slug: "nuclear" },
      { name: "Gas-to-Power", slug: "gas-to-power" },
      { name: "Cogeneration", slug: "cogeneration" },
    ],
  },
  {
    name: "Renewables",
    slug: "renewables",
    subSectors: [
      { name: "Solar", slug: "solar" },
      { name: "Wind", slug: "wind" },
      { name: "Hydro", slug: "hydro" },
      { name: "Biopower", slug: "biopower" },
      { name: "Waste-to-Energy", slug: "waste-to-energy" },
    ],
  },
  {
    name: "Transmission",
    slug: "transmission",
    subSectors: [
      { name: "HVDC", slug: "hvdc" },
      { name: "Interconnectors", slug: "interconnectors" },
      { name: "Grid Infrastructure", slug: "grid-infrastructure" },
      { name: "Smart Grid", slug: "smart-grid" },
    ],
  },
  {
    name: "Distribution",
    slug: "distribution",
    subSectors: [
      { name: "Smart Meters & AMI", slug: "smart-meters-ami" },
      { name: "EV Charging", slug: "ev-charging" },
      { name: "Data Centres", slug: "data-centres" },
      { name: "Smart Cities", slug: "smart-cities" },
      { name: "Rural Electrification", slug: "rural-electrification" },
    ],
  },
  {
    name: "Electricity Markets",
    slug: "electricity-markets",
    subSectors: [
      { name: "Power Markets", slug: "power-markets" },
      { name: "Carbon Markets", slug: "carbon-markets" },
      { name: "RCO", slug: "rco" },
      { name: "Power Exchange", slug: "power-exchange" },
    ],
  },
  {
    name: "New Energies",
    slug: "new-energies",
    subSectors: [
      { name: "Green Hydrogen", slug: "green-hydrogen" },
      { name: "Green Ammonia", slug: "green-ammonia" },
      { name: "E-Fuels", slug: "e-fuels" },
      { name: "CCUS", slug: "ccus" },
      { name: "Biofuels", slug: "biofuels" },
    ],
  },
  {
    name: "Energy Storage",
    slug: "energy-storage",
    subSectors: [
      { name: "BESS", slug: "bess" },
      { name: "Pumped Hydro", slug: "pumped-hydro" },
      { name: "CAES", slug: "caes" },
      { name: "Flywheel", slug: "flywheel" },
      { name: "Thermal Storage", slug: "thermal-storage" },
    ],
  },
  {
    name: "Sustainability & Safety",
    slug: "sustainability-and-safety",
    subSectors: [
      { name: "ESG", slug: "esg" },
      { name: "HSSE", slug: "hsse" },
      { name: "Safety", slug: "safety" },
      { name: "Net Zero", slug: "net-zero" },
      { name: "Environment", slug: "environment" },
      { name: "Energy Efficiency", slug: "energy-efficiency" },
    ],
  },
];

/* ── Helpers ───────────────────────────────────────────────────────────── */

function extractExcerpt(article: any): string {
  const excerpt = article?.Excerpt;
  if (!excerpt) return "";
  if (typeof excerpt === "string") return excerpt;
  if (!Array.isArray(excerpt)) return "";
  return excerpt
    .map((block: any) =>
      (block.children || []).map((child: any) => child.text || "").join("")
    )
    .filter(Boolean)
    .join(" ")
    .trim();
}

function matchesSector(item: any, sectorSlug: string): boolean {
  const sectors = item.sectors || [];
  return sectors.some(
    (s: any) =>
      s.slug === sectorSlug ||
      s.name?.toLowerCase().includes(
        SECTORS.find((sec) => sec.slug === sectorSlug)?.name.toLowerCase() || ""
      )
  );
}

function matchesSubSector(item: any, subName: string): boolean {
  const sectors = item.sectors || [];
  const tags = item.content_tag;
  const tagName =
    typeof tags === "string"
      ? tags
      : tags?.title || tags?.name || tags?.Title || tags?.Name || "";
  const lower = subName.toLowerCase();
  return (
    sectors.some((s: any) => s.name?.toLowerCase().includes(lower)) ||
    tagName.toLowerCase().includes(lower)
  );
}

/* ── Feed Card ─────────────────────────────────────────────────────────── */

function FeedCard({ item }: { item: any }) {
  const { isSignedIn } = useAuth();
  const { openAuthModal } = useAuthModal();
  const href = buildContentUrl({
    slug: item.slug || "",
    type_of_content: item.type_of_content,
    content_tag: item.content_tag,
  });
  const image = strapiMediaUrl(item.FeaturedImage, "/magazine-default.jpg");
  const sectorName = item.sectors?.[0]?.name || "Energy";
  const date = formatContentDate(
    item.Date || item.publishedAt || item.createdAt || ""
  );
  const excerpt = extractExcerpt(item);
  const contentType = item.type_of_content?.name || "News";
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<string[]>([]);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [shared, setShared] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [likedComments, setLikedComments] = useState<number[]>([]);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const toggleLike = () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((count) => Math.max(0, count + (nextLiked ? 1 : -1)));
    if (nextLiked) {
      setShowConfetti(true);
      window.setTimeout(() => setShowConfetti(false), 800);
    }
  };

  const submitComment = () => {
    if (!isSignedIn) {
      openAuthModal("/energbits");
      return;
    }
    const comment = commentText.trim();
    if (!comment) return;
    setComments((current) => [...current, replyingTo === null ? comment : `Reply: ${comment}`]);
    setCommentText("");
    setReplyingTo(null);
  };

  const openComments = () => {
    setShowComments(true);
  };

  const toggleCommentLike = (index: number) => {
    setLikedComments((current) => current.includes(index)
      ? current.filter((commentIndex) => commentIndex !== index)
      : [...current, index]);
  };

  const startReply = (index: number) => {
    if (!isSignedIn) {
      openAuthModal("/energbits");
      return;
    }
    setReplyingTo(index);
  };

  const copyStoryLink = async () => {
    const shareUrl = `${window.location.origin}${href}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch {
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    }
  };
  const shareUrl = typeof window === "undefined" ? href : `${window.location.origin}${href}`;
  const encodedShareUrl = encodeURIComponent(shareUrl);
  return (
    <article className="group relative h-[min(680px,calc(100svh-180px))] w-full shrink-0 snap-start snap-always rounded-[22px] bg-slate-950 shadow-xl shadow-slate-950/15 sm:h-[calc(100svh-200px)] sm:rounded-[28px] lg:h-[calc(100dvh-270px)] lg:w-[420px]">
      <Link href={href} className="absolute inset-0 block overflow-hidden rounded-[22px] sm:rounded-[28px]">
        <Image
          src={image}
          alt={item.Title || ""}
          fill
          sizes="(max-width: 640px) 88vw, 420px"
          className="object-contain sm:object-cover sm:group-hover:scale-[1.03] transition-transform duration-700"
        />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="bg-slate-900/75 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md">
            {sectorName}
          </span>
          <span className="bg-emerald-600/90 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md">
            {contentType}
          </span>
        </div>
      </Link>

      <div className="absolute inset-0 rounded-[22px] bg-gradient-to-t from-black via-black/35 to-transparent pointer-events-none sm:rounded-[28px]" />

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-5 pr-16 sm:p-7 lg:pr-16">
        <Link href={href}>
          <h3
            className="text-[23px] sm:text-[25px] font-extrabold text-white leading-[1.15] tracking-[-0.03em] line-clamp-4"
            style={{ fontFamily: "var(--font-playfair, serif)" }}
          >
            {item.Title}
          </h3>
        </Link>

        {excerpt && (
          <p className="mt-3 text-[13px] text-white/75 leading-relaxed line-clamp-2">
            {excerpt}
          </p>
        )}

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between pt-4 border-t border-white/20">
          <div className="flex items-center gap-3 text-[11px] text-white/80 font-medium">
            {date && (
              <>
                <span className="text-slate-300">·</span>
                <span className="flex items-center gap-1">
                  <Clock3 className="h-3 w-3" /> {date}
                </span>
              </>
            )}
            <span className="text-slate-300">·</span>
            <span>2 min read</span>
          </div>
          <Link
            href={href}
            className="flex items-center gap-1 text-[11px] font-bold text-white"
          >
            Read <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {showConfetti && (
        <div aria-hidden="true" className="pointer-events-none absolute bottom-[17rem] right-5 z-30 hidden h-8 w-8 sm:hidden">
          {Array.from({ length: 16 }, (_, index) => (
            <span
              key={index}
              className="energbits-confetti-piece"
              style={{
                "--confetti-x": `${((index % 4) - 1.5) * 24}px`,
                "--confetti-y": `${-28 - Math.floor(index / 4) * 18}px`,
                backgroundColor: ["#f43f5e", "#facc15", "#34d399", "#60a5fa"][index % 4],
                animationDelay: `${index * 18}ms`,
              } as CSSProperties}
            />
          ))}
        </div>
      )}

      <div className="absolute bottom-20 right-3 z-20 flex flex-col items-center gap-4 text-white sm:hidden lg:left-[calc(100%+22px)] lg:right-auto lg:top-1/2 lg:bottom-auto lg:flex lg:-translate-y-1/2 lg:gap-5">
        <button type="button" aria-label="Like this story" onClick={toggleLike} className={`relative flex flex-col items-center gap-1 drop-shadow-md transition-colors lg:h-14 lg:w-14 lg:justify-center lg:rounded-full lg:bg-slate-900/90 lg:shadow-lg ${liked ? "text-rose-400" : "text-white"}`}>
          <Heart className={`h-6 w-6 ${liked ? "fill-current" : ""}`} strokeWidth={2} />
          <span className="text-[10px] font-bold lg:absolute lg:top-full lg:mt-1 lg:text-slate-700">{likeCount || "Like"}</span>
          {showConfetti && <span aria-hidden="true" className="absolute -top-3 text-2xl animate-ping">✨</span>}
        </button>
        <button type="button" aria-label="Comment on this story" onClick={openComments} className="relative flex flex-col items-center gap-1 text-white drop-shadow-md lg:h-14 lg:w-14 lg:justify-center lg:rounded-full lg:bg-slate-900/90 lg:shadow-lg">
          <MessageCircle className="h-6 w-6" strokeWidth={2} />
          <span className="text-[10px] font-bold lg:absolute lg:top-full lg:mt-1 lg:text-slate-700">{comments.length || "Comment"}</span>
        </button>
        <button type="button" aria-label="Share this story" onClick={() => setShowShare(true)} className="relative flex flex-col items-center gap-1 text-white drop-shadow-md lg:h-14 lg:w-14 lg:justify-center lg:rounded-full lg:bg-slate-900/90 lg:shadow-lg">
          <Share2 className="h-6 w-6" strokeWidth={2} />
          <span className="text-[10px] font-bold lg:absolute lg:top-full lg:mt-1 lg:text-slate-700">{shared ? "Copied" : "Share"}</span>
        </button>
        <button type="button" aria-label="More stories" className="flex flex-col items-center gap-1 drop-shadow-md lg:hidden">
          <Repeat2 className="h-6 w-6" strokeWidth={2} />
          <span className="text-[10px] font-bold">More</span>
        </button>
      </div>

      {showComments && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end bg-black/65 lg:pointer-events-none lg:block lg:bg-transparent" role="dialog" aria-modal="true" aria-label="Comments">
          <div className="energbits-comments-drawer flex h-[78svh] w-full flex-col rounded-t-[26px] bg-[#212121] text-white shadow-2xl lg:pointer-events-auto lg:fixed lg:right-8 lg:top-[265px] lg:h-[calc(100dvh-270px)] lg:w-[600px] lg:rounded-[20px]">
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-baseline gap-2">
                <h4 className="text-base font-black">Comments</h4>
                <span className="text-sm text-white/60">{comments.length}</span>
              </div>
              <div className="flex items-center gap-5 text-white/80">
                <SlidersHorizontal className="h-5 w-5" />
                <button type="button" onClick={() => setShowComments(false)} aria-label="Close comments">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {comments.length ? comments.map((comment, index) => (
                <div key={`${comment}-${index}`} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-black">E</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold text-white/80">@energbits-reader <span className="font-normal text-white/45">just now</span></p>
                      <MoreVertical className="h-4 w-4 text-white/60" />
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-white">{comment}</p>
                    <div className="mt-2 flex items-center gap-5 text-xs font-semibold text-white/80">
                      <button type="button" onClick={() => toggleCommentLike(index)} className={`flex items-center gap-1 transition-colors ${likedComments.includes(index) ? "text-emerald-400" : ""}`}><ThumbsUp className={`h-4 w-4 ${likedComments.includes(index) ? "fill-current" : ""}`} /> {likedComments.includes(index) ? "Liked" : "Like"}</button>
                      <button type="button" onClick={() => startReply(index)} className="flex items-center gap-1"><Reply className="h-4 w-4" /> Reply</button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <MessageCircle className="h-9 w-9 text-white/30" />
                  <p className="mt-3 text-sm font-semibold text-white/75">No comments yet</p>
                  <p className="mt-1 text-xs text-white/45">Start the conversation on this Energbits story.</p>
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-3 border-t border-white/10 bg-[#272727] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-black">E</div>
              <input value={commentText} readOnly={!isSignedIn} onFocus={() => { if (!isSignedIn) openAuthModal("/energbits"); }} onChange={(event) => setCommentText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submitComment(); }} placeholder={isSignedIn ? (replyingTo === null ? "Add a comment..." : "Write a reply...") : "Sign in to add a comment"} className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/50" />
              <button type="button" onClick={() => isSignedIn ? submitComment() : openAuthModal("/energbits")} disabled={isSignedIn && !commentText.trim()} className="text-sm font-bold text-emerald-400 disabled:text-white/30">{isSignedIn ? "Post" : "Sign in"}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showShare && createPortal(
        <div className="fixed inset-0 z-[110] flex items-end bg-black/55 p-3 lg:items-center lg:justify-center" role="dialog" aria-modal="true" aria-label="Share story">
          <div className="w-full rounded-2xl bg-[#242424] p-5 text-white shadow-2xl lg:max-w-[560px]">
            <div className="mb-5 flex items-center justify-between">
              <h4 className="text-base font-bold">Share</h4>
              <button type="button" onClick={() => setShowShare(false)} aria-label="Close share options"><X className="h-6 w-6" /></button>
            </div>
            <div className="mb-6 flex justify-between gap-3 overflow-x-auto pb-1">
              <a href={`https://wa.me/?text=${encodedShareUrl}`} target="_blank" rel="noreferrer" className="flex flex-1 flex-col items-center gap-2 text-[11px] font-semibold">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-2xl">W</span>WhatsApp
              </a>
              <a href={`sms:?body=${encodedShareUrl}`} className="flex flex-1 flex-col items-center gap-2 text-[11px] font-semibold">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2f77e5] text-2xl">M</span>Messages
              </a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedShareUrl}`} target="_blank" rel="noreferrer" className="flex flex-1 flex-col items-center gap-2 text-[11px] font-semibold">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#4267B2] text-2xl font-black">f</span>Facebook
              </a>
              <a href={`https://x.com/intent/post?url=${encodedShareUrl}`} target="_blank" rel="noreferrer" className="flex flex-1 flex-col items-center gap-2 text-[11px] font-semibold">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-2xl">𝕏</span>X
              </a>
              <a href={`mailto:?body=${encodedShareUrl}`} className="flex flex-1 flex-col items-center gap-2 text-[11px] font-semibold">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-400 text-2xl">✉</span>Email
              </a>
              <button type="button" onClick={copyStoryLink} className="flex flex-1 flex-col items-center gap-2 text-[11px] font-semibold">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 text-2xl"><ChevronRight className="h-7 w-7" /></span>More
              </button>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-black/30 p-1.5 pl-3">
              <Link2 className="h-4 w-4 shrink-0 text-white/60" />
              <p className="min-w-0 flex-1 truncate text-xs text-white/75">{shareUrl}</p>
              <button type="button" onClick={copyStoryLink} className="rounded-xl border border-white/20 px-4 py-2 text-xs font-bold">{shared ? "Copied" : "Copy"}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </article>
  );
}

/* ── Sidebar ───────────────────────────────────────────────────────────── */

function Sidebar({
  activeFilter,
  onFilter,
}: {
  activeFilter: string;
  onFilter: (slug: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggleExpand = (slug: string) => {
    setExpanded((prev) => (prev === slug ? null : slug));
  };

  return (
    <aside className="sticky top-24 z-20 hidden w-[240px] shrink-0 self-start lg:absolute lg:left-0 lg:top-0 lg:block">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <p className="mb-3 px-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
          Explore sectors &amp; sub-sectors
        </p>

        {/* All Content */}
        <button
          onClick={() => onFilter("all")}
          className={`w-full text-left px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all mb-1 ${
            activeFilter === "all"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
              : "text-slate-700 hover:bg-slate-50 border border-transparent"
          }`}
        >
          All Content
        </button>

        {/* Sector Groups */}
        <div className="mt-2 flex flex-col gap-0.5">
          {SECTORS.map((sector) => {
            const isExpanded = expanded === sector.slug;
            const isActive = activeFilter === sector.slug;
            const hasActiveSub = sector.subSectors.some(
              (sub) => activeFilter === `${sector.slug}::${sub.slug}`
            );

            return (
              <div key={sector.slug}>
                <div className="flex items-center">
                  <button
                    onClick={() => onFilter(sector.slug)}
                    className={`flex-1 text-left px-3 py-2 rounded-l-xl text-[12px] font-bold transition-all truncate ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : hasActiveSub
                        ? "text-emerald-600"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {sector.name}
                  </button>
                  <button
                    onClick={() => toggleExpand(sector.slug)}
                    className={`px-2 py-2 rounded-r-xl transition-colors ${
                      isActive || hasActiveSub
                        ? "bg-emerald-50 text-emerald-600"
                        : "text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                {/* Sub-sectors */}
                {isExpanded && (
                  <div className="ml-4 mt-0.5 mb-1 flex flex-col gap-0.5 border-l-2 border-slate-100 pl-2">
                    {sector.subSectors.map((sub) => {
                      const subKey = `${sector.slug}::${sub.slug}`;
                      return (
                        <button
                          key={sub.slug}
                          onClick={() => onFilter(subKey)}
                          className={`text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                            activeFilter === subKey
                              ? "bg-emerald-50 text-emerald-700"
                              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {sub.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

/* ── Mobile Filter Bar ─────────────────────────────────────────────────── */

function MobileFilterBar({
  activeFilter,
  onFilter,
}: {
  activeFilter: string;
  onFilter: (slug: string) => void;
}) {
  return (
    <div className="lg:hidden overflow-x-auto scrollbar-none -mx-5 px-5 mb-6">
      <div className="flex gap-2 w-max">
        <button
          onClick={() => onFilter("all")}
          className={`shrink-0 px-4 py-2 rounded-full text-[11px] font-bold transition-all border ${
            activeFilter === "all"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
              : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
          }`}
        >
          All
        </button>
        {SECTORS.map((sector) => {
          const isActive =
            activeFilter === sector.slug ||
            activeFilter.startsWith(`${sector.slug}::`);
          return (
            <button
              key={sector.slug}
              onClick={() => onFilter(sector.slug)}
              className={`shrink-0 px-4 py-2 rounded-full text-[11px] font-bold transition-all border whitespace-nowrap ${
                isActive
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
              }`}
            >
              {sector.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────────────── */

interface EnergbitsFeedProps {
  contents: any[];
  selectedSlug?: string;
}

export function EnergbitsFeed({ contents, selectedSlug }: EnergbitsFeedProps) {
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered = useMemo(() => {
    const orderedContents = selectedSlug
      ? [...contents].sort((a, b) => Number(b.slug === selectedSlug) - Number(a.slug === selectedSlug))
      : contents;

    if (activeFilter === "all") return orderedContents;

    // Sub-sector filter: "sector-slug::sub-slug"
    if (activeFilter.includes("::")) {
      const [sectorSlug, subSlug] = activeFilter.split("::");
      const sector = SECTORS.find((s) => s.slug === sectorSlug);
      const sub = sector?.subSectors.find((ss) => ss.slug === subSlug);
      if (!sub) return orderedContents;
      return orderedContents.filter((item) => matchesSubSector(item, sub.name));
    }

    // Sector filter
    return orderedContents.filter((item) => matchesSector(item, activeFilter));
  }, [contents, activeFilter, selectedSlug]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50/60 lg:h-[calc(100dvh-100px)] lg:min-h-0">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-24 z-0 hidden opacity-[0.1] sm:block">
        <TextLoop text="ENERGbits" uppercase={false} shape="wave" speed={56} separator="✦" curviness={62} fontSize={48} fontWeight={900} letterSpacing={2} color="#ffffff" ribbon ribbonColor="#000000" ribbonWidth={82} className="min-w-[760px]" />
      </div>
      <div aria-hidden="true" className="hidden">
        <TextLoop text="ENERGbits" uppercase={false} path="M -240 100 L 1440 100" viewHeight={200} speed={24} separator="•" fontSize={105} letterSpacing={5} ribbon={false} color="#008a67" />
      </div>
      <div className="relative z-10 mx-auto max-w-7xl px-3 py-3 sm:px-10 sm:py-8 lg:flex lg:h-full lg:flex-col lg:px-16 lg:py-10">
        {/* Page Header */}
        <div className="mb-8 hidden flex-col gap-5 border-b border-slate-200 pb-7 sm:flex sm:flex-row sm:items-center sm:justify-between lg:mb-4">
          <div className="flex items-center gap-4">
          <Image
            src="/ENERGNBITS.png"
            alt="Energbits"
            width={52}
            height={52}
            className="h-11 w-11 shrink-0 object-contain sm:h-[52px] sm:w-[52px]"
          />
          <div>
            <p className="mb-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-700 sm:text-[11px]">Fast energy intelligence</p>
            <h1 className="sr-only">Energbits</h1>
            <SplitFlapText words={["ENERGBITS"]} padTo={9} fontSize={22} gap={3} tileRadius={4} tileColor="#111827" textColor="#ffffff" />
          </div>
          </div>
          <p className="max-w-sm text-xs leading-relaxed text-slate-500 sm:text-right">Quick, visual stories from the energy transition — curated for the time you have.</p>
        </div>

        <div className="hidden">
          <TextLoop text="ENERGbits" uppercase={false} shape="wave" speed={56} separator="✦" curviness={62} fontSize={48} fontWeight={900} letterSpacing={2} color="#ffffff" ribbon ribbonColor="#5227ff" ribbonWidth={82} className="min-w-[760px]" />
        </div>

        {/* Mobile Filter */}
        <div className="hidden sm:block">
          <MobileFilterBar activeFilter={activeFilter} onFilter={setActiveFilter} />
        </div>

        {/* Desktop Layout */}
        <div className="flex items-start gap-8 lg:relative lg:block lg:min-h-0 lg:flex-1">
          {/* Sidebar */}
          <Sidebar activeFilter={activeFilter} onFilter={setActiveFilter} />

          {/* Feed */}
          <div className="flex min-w-0 flex-1 justify-center lg:absolute lg:left-1/2 lg:top-0 lg:w-full lg:-translate-x-1/2">
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <Sparkles className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-medium">No stories found for this filter.</p>
                <button
                  onClick={() => setActiveFilter("all")}
                  className="mt-3 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Show all content →
                </button>
              </div>
            ) : (
              <div
                className="h-[min(680px,calc(100svh-180px))] w-full max-w-[420px] snap-y snap-mandatory overflow-y-auto overscroll-contain scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:h-[calc(100svh-200px)] lg:h-[calc(100dvh-270px)] lg:max-w-[600px]"
                aria-label="Energbits vertical news feed"
              >
                <div className="flex flex-col items-center gap-5 pb-5">
                  {filtered.map((item: any) => (
                    <FeedCard key={item.id || item.documentId} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
