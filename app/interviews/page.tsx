"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { slugify } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { DateChip } from "@/components/ui/date-chip";
import { strapiImageUrl } from "@/lib/strapi-image";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL;

function formatOpinionDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/* ================================
   FETCH INTERVIEWS FROM STRAPI
================================ */

async function fetchInterviews() {
  const res = await fetch(
    `${STRAPI}/api/contents?filters[type_of_content][name][$eq]=Opinion&populate[FeaturedImage]=true&populate[content_tag]=true&populate[author][populate]=avatar&sort=Date:desc`,
    { cache: "no-store" } // Force fresh fetch to bust old cached response without content_tag
  );

  const json = await res.json();
  return json?.data ?? [];
}

/** Extract content_tag title from various Strapi shapes */
function extractContentTagTitle(contentTag: any): string | null {
  if (!contentTag) return null;

  // Normalize data (handle .data or .attributes or direct)
  const d = contentTag.data?.attributes || contentTag.data || contentTag.attributes || contentTag;

  if (Array.isArray(d)) {
    const first = d[0]?.attributes || d[0];
    return first?.title || first?.Title || null;
  }

  return d.title || d.Title || null;
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    fetchInterviews().then((data) => {
      const formatted = data.map((item: any) => {
        const contentTag = extractContentTagTitle(item.content_tag);
        return {
          id: item.id,
          title: item.Title,
          slug: item.slug,
          date: item.Date,
          sector:
            item?.sectors?.[0]?.name ||
            item?.sectors?.data?.[0]?.attributes?.name ||
            item?.sector?.name ||
            item?.sector?.data?.attributes?.name ||
            item?.category ||
            "OPINION",
          category: "OPINION",
          contentTag,

          image:
            item?.FeaturedImage?.url
              ? strapiImageUrl(item.FeaturedImage.url)
              : null,

          authorName: item?.author?.name,
          authorAvatar:
            item?.author?.avatar?.url
              ? strapiImageUrl(item.author.avatar.url)
              : null,
        };
      });

      // Filter: ONLY show items with content_tag = Interview
      const interviewsList = formatted.filter(
        (a: any) => a.contentTag && a.contentTag.toLowerCase() === "interview"
      );

      setInterviews(interviewsList);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <div className="pt-20">
        <div className="w-full h-[60vh] bg-zinc-900 flex items-center px-4 lg:px-8">
          <div className="max-w-5xl w-full">
            <Skeleton className="h-20 w-3/4 mb-6 bg-white/20" />
            <Skeleton className="h-6 w-1/2 mb-10 bg-white/10" />
            <Skeleton className="h-12 w-48 rounded-full bg-white/20" />
          </div>
        </div>
        <div className="container mx-auto px-4 lg:px-12 py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-6">
                <Skeleton className="aspect-3/4 w-full rounded-2xl" />
                <div className="space-y-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-full" />
                  <div className="flex gap-3 pt-4 border-t">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4 w-32 mt-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-zinc-900 overflow-x-hidden">
      <main className="relative pb-32">
        {/* HERO */}
        <section className="relative w-full min-h-[80vh] flex items-center bg-[#0a0a0a] overflow-hidden">
          <div className="absolute inset-0 z-0">
            <motion.div
              style={{ y: y1 }}
              className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551818255-e6e10975bc17?q=80&w=2073')] bg-cover bg-center opacity-40 scale-110"
            />
            <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/20 to-[#FDFDFD]" />
          </div>

          <div className="container mx-auto px-4 lg:px-8 relative z-10 pt-20">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              style={{ opacity }}
              className="max-w-5xl"
            >
              <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-[8rem] font-black leading-[0.85] tracking-tight uppercase mb-6 sm:mb-10">
                <span className="text-[#00A651]">
                  Interview
                </span>
              </h1>

              <p className="text-xl text-white/70 max-w-2xl mb-12">
                Gain direct insights from industry leaders, policymakers, and innovators driving the global energy transition forward.
              </p>
            </motion.div>
          </div>
        </section>

        <div className="container mx-auto px-4 sm:px-6 lg:px-12 pt-12 sm:pt-20">

          {/* ── GRID ── */}
          {interviews.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-12 sm:gap-y-20 gap-x-8 sm:gap-x-12"
            >
              {interviews.map((item) => (
                <motion.div
                  key={item.id}
                  className="group flex flex-col"
                >
                  <Link
                    href={`/interviews/${item.slug}`}
                    className="block overflow-hidden rounded-2xl mb-8"
                  >
                    <div className="relative aspect-3/4 bg-zinc-100 overflow-hidden">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                        />
                      )}
                      <div className="absolute bottom-6 right-6 bg-white p-3 rounded-full opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-xl">
                        <ArrowUpRight size={20} />
                      </div>
                    </div>
                  </Link>
                  <div className="flex flex-col grow">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <span className="text-[8px] font-bold uppercase text-zinc-400 tracking-wider">
                        <DateChip value={item.date} />
                      </span>
                    </div>
                    <Link href={`/interviews/${item.slug}`}>
                      <h3 className="font-serif font-bold text-2xl leading-[1.1] group-hover:text-[#00A651] mb-6">
                        {item.title}
                      </h3>
                    </Link>
                    <div className="mt-auto pt-6 flex items-center gap-4 border-t">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border">
                        {item.authorAvatar && (
                          <Image
                            src={item.authorAvatar}
                            alt={item.authorName}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <Link href={`/author/${slugify(item.authorName)}`} className="text-[11px] font-black uppercase hover:text-[#00A651] transition-colors">
                        {item.authorName}
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-gray-500 font-serif text-xl border-l-4 border-teal-500 inline-block pl-4">No interviews found.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
