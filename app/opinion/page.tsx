"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { slugify } from "@/lib/utils";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL;

/* ================================
   FETCH OPINIONS FROM STRAPI
================================ */

async function fetchOpinions() {
  const res = await fetch(
    `${STRAPI}/api/contents?filters[type_of_content][name][$eq]=Opinion&populate[author][populate]=avatar&populate=FeaturedImage`,
    { next: { revalidate: 120 } }
  );

  const json = await res.json();
  return json?.data ?? [];
}

export default function OpinionPage() {
  const [opinions, setOpinions] = useState<any[]>([]);

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    fetchOpinions().then((data) => {
      const formatted = data.map((item: any) => ({
        id: item.id,
        title: item.Title,
        slug: item.slug,
        date: item.Date,
        category: "Opinion",

        image:
          item?.FeaturedImage?.url
            ? `${STRAPI}${item.FeaturedImage.url}`
            : null,

        authorName: item?.author?.name,
        authorAvatar:
          item?.author?.avatar?.url
            ? `${STRAPI}${item.author.avatar.url}`
            : null,
      }));

      setOpinions(formatted);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-zinc-900 overflow-x-hidden">
      <Header />

      <main className="relative pb-32">
        {/* HERO */}
        <section className="relative w-full min-h-[80vh] flex items-center bg-[#0a0a0a] overflow-hidden">
          <div className="absolute inset-0 z-0">
            <motion.div
              style={{ y: y1 }}
              className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=2070')] bg-cover bg-center opacity-40 scale-110"
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
                  Opinion
                </span>
              </h1>

              <p className="text-xl text-white/70 max-w-2xl mb-12">
                Discover perspectives that matter with ENERGDIVE Opinion, where thought leaders share analysis, commentary, and forward-looking views on key energy and sustainability issues.
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold text-sm uppercase"
              >
                Browse All Opinions
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </div>
        </section>

        <div className="container mx-auto px-4 sm:px-6 lg:px-12 pt-12 sm:pt-20">

          {/* GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-12 sm:gap-y-20 gap-x-8 sm:gap-x-12">
            {opinions.map((opinion) => (
              <motion.div
                key={opinion.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group flex flex-col"
              >
                {/* IMAGE */}
                <Link
                  href={`/opinion/${opinion.slug}`}
                  className="block overflow-hidden rounded-2xl mb-8"
                >
                  <div className="relative aspect-3/4 bg-zinc-100 overflow-hidden">
                    {opinion.image && (
                      <Image
                        src={opinion.image}
                        alt={opinion.title}
                        fill
                        className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                      />
                    )}

                    <div className="absolute bottom-6 right-6 bg-white p-3 rounded-full opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-xl">
                      <ArrowUpRight size={20} />
                    </div>
                  </div>
                </Link>

                {/* TEXT */}
                <div className="flex flex-col grow">
                  <div className="flex items-center gap-3 mb-4 text-[10px] font-bold uppercase">
                    <span className="text-[#00A651]">
                      {opinion.category}
                    </span>
                    <span className="text-zinc-400">
                      {opinion.date}
                    </span>
                  </div>

                  <Link href={`/opinion/${opinion.slug}`}>
                    <h3 className="font-serif font-bold text-2xl leading-[1.1] group-hover:text-[#00A651] mb-6">
                      {opinion.title}
                    </h3>
                  </Link>

                  {/* AUTHOR */}
                  <div className="mt-auto pt-6 flex items-center gap-4 border-t">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border">
                      {opinion.authorAvatar && (
                        <Image
                          src={opinion.authorAvatar}
                          alt={opinion.authorName}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>

                    <Link href={`/author/${slugify(opinion.authorName)}`} className="text-[11px] font-black uppercase hover:text-[#00A651] transition-colors">
                      {opinion.authorName}
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

    </div>
  );
}