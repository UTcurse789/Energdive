"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL;

/* ================================
   FETCH OPINIONS FROM STRAPI
================================ */

async function fetchOpinions() {
  const res = await fetch(
    `${STRAPI}/api/contents?filters[type_of_content][name][$eq]=Opinion&populate[author][populate]=avatar&populate=FeaturedImage`,
    { cache: "no-store" }
  );

  const json = await res.json();
  return json?.data ?? [];
}

export default function OpinionPage() {
  const [opinions, setOpinions] = useState<any[]>([]);

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
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-zinc-900">
      <Header />

      <main className="relative pt-[80px] pb-32">
        <div className="container mx-auto px-6 lg:px-12">

          {/* HEADER */}
          <header className="mb-24 max-w-3xl">
            <h1 className="text-6xl md:text-8xl font-black uppercase italic">
              Expert{" "}
              <span className="text-[#00A651] not-italic">
                Perspectives
              </span>
            </h1>
          </header>

          {/* GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-20 gap-x-12">
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
                  <div className="relative aspect-[3/4] bg-zinc-100 overflow-hidden">
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
                    <h3 className="font-serif font-bold text-3xl leading-[1.1] group-hover:text-[#00A651] mb-6">
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

                    <div className="text-[11px] font-black uppercase">
                      {opinion.authorName}
                    </div>
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