// "use client";

// import React, { useEffect, useState } from "react";
// import Image from "next/image";
// import Link from "next/link";
// import {
//   motion,
//   useScroll,
//   useTransform,
// } from "framer-motion";
// import { ArrowUpRight, ArrowRight, Clock } from "lucide-react";

// const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL;

// /* ================================
//    FETCH REPORTS FROM STRAPI
// ================================ */

// async function fetchReports() {
//   const res = await fetch(
//     `${STRAPI}/api/contents?filters[type_of_content][name][$eq]=Reports&populate=*`,
//     { cache: "no-store" }
//   );
//   const json = await res.json();
//   return json?.data ?? [];
// }

// export default function ReportsPage() {
//   const [reports, setReports] = useState<any[]>([]);

//   const { scrollY } = useScroll();
//   const y1 = useTransform(scrollY, [0, 500], [0, 200]);
//   const opacity = useTransform(scrollY, [0, 300], [1, 0]);

//   useEffect(() => {
//     fetchReports().then((data) => {
//       const formatted = data.map((item: any) => ({
//         id: item.id,
//         title: item.Title,
//         slug: item.slug,
//         date: item.publishedAt || item.Date,
//         category: "Reports",
//         excerpt: item?.Excerpt?.[0]?.children?.[0]?.text || "",
//         image: item?.FeaturedImage?.url
//           ? `${STRAPI}${item.FeaturedImage.url}`
//           : null,
//       }));
//       setReports(formatted);
//     });
//   }, []);

//   function formatDate(dateStr: string) {
//     if (!dateStr) return "";
//     return new Date(dateStr).toLocaleDateString("en-GB", {
//       day: "numeric", month: "short", year: "numeric",
//     });
//   }

//   return (
//     <div className="min-h-screen bg-[#FDFDFD] font-sans text-zinc-900 overflow-x-hidden">
//       <main className="relative pb-32">
//         {/* HERO */}
//         <section className="relative w-full min-h-[80vh] flex items-center bg-[#0a0a0a] overflow-hidden">
//           <div className="absolute inset-0 z-0">
//             <motion.div
//               style={{ y: y1 }}
//               className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover bg-center opacity-40 scale-110"
//             />
//             <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/20 to-[#FDFDFD]" />
//           </div>

//           <div className="container mx-auto px-6 lg:px-12 max-w-[1400px] relative z-10 pt-20">
//             <motion.div
//               initial={{ opacity: 0, y: 40 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 1 }}
//               style={{ opacity }}
//               className="max-w-5xl"
//             >
//               <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black text-white leading-[0.85] uppercase mb-6 sm:mb-10">
//                 Strategic <br />
//                 <span className="text-[#00A651] italic">
//                   Reports
//                 </span>
//               </h1>

//               <p className="text-xl text-white/70 max-w-2xl mb-12">
//                 Proprietary data and deep-sector expertise mapping the
//                 future of energy infrastructure.
//               </p>

//               <motion.button
//                 whileHover={{ scale: 1.05 }}
//                 className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold text-sm uppercase"
//               >
//                 Browse All Reports
//                 <ArrowRight className="w-4 h-4" />
//               </motion.button>
//             </motion.div>
//           </div>
//         </section>

//         {/* GRID — matches Opinion listing layout */}
//         <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-[1400px] pt-12 sm:pt-20">
//           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-12 sm:gap-y-20 gap-x-8 sm:gap-x-12">
//             {reports.map((report) => (
//               <motion.div
//                 key={report.id}
//                 initial={{ opacity: 0, y: 40 }}
//                 whileInView={{ opacity: 1, y: 0 }}
//                 viewport={{ once: true }}
//                 className="group flex flex-col"
//               >
//                 {/* IMAGE */}
//                 <Link
//                   href={`/reports/${report.slug}`}
//                   className="block overflow-hidden rounded-2xl mb-8"
//                 >
//                   <div className="relative aspect-[3/4] bg-zinc-100 overflow-hidden">
//                     {report.image && (
//                       <Image
//                         src={report.image}
//                         alt={report.title}
//                         fill
//                         className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
//                       />
//                     )}

//                     <div className="absolute bottom-6 right-6 bg-white p-3 rounded-full opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-xl">
//                       <ArrowUpRight size={20} />
//                     </div>
//                   </div>
//                 </Link>

//                 {/* TEXT */}
//                 <div className="flex flex-col grow">
//                   <div className="flex items-center gap-3 mb-4 text-[10px] font-bold uppercase">
//                     <span className="text-[#00A651]">
//                       {report.category}
//                     </span>
//                     <span className="flex items-center gap-1 text-zinc-400">
//                       <Clock size={10} />
//                       {formatDate(report.date)}
//                     </span>
//                   </div>

//                   <Link href={`/reports/${report.slug}`}>
//                     <h3 className="font-serif font-bold text-3xl leading-[1.1] group-hover:text-[#00A651] mb-6">
//                       {report.title}
//                     </h3>
//                   </Link>

//                   {report.excerpt && (
//                     <p className="text-sm text-zinc-500 line-clamp-3 leading-relaxed">
//                       {report.excerpt}
//                     </p>
//                   )}
//                 </div>
//               </motion.div>
//             ))}
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }


"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, ArrowRight, Clock } from "lucide-react";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL;

async function fetchReports() {
  const res = await fetch(
    `${STRAPI}/api/contents?filters[type_of_content][name][$eq]=Reports&populate=*`,
    { cache: "no-store" }
  );
  const json = await res.json();
  return json?.data ?? [];
}

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);

  useEffect(() => {
    fetchReports().then((data) => {
      const formatted = data.map((item: any) => ({
        id: item.id,
        title: item.Title,
        slug: item.slug,
        date: item.publishedAt || item.Date,
        category: "Strategic Intelligence",
        excerpt: item?.Excerpt?.[0]?.children?.[0]?.text || "",
        image: item?.FeaturedImage?.url ? `${STRAPI}${item.FeaturedImage.url}` : null,
      }));
      setReports(formatted);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-zinc-900 overflow-x-hidden">
      <main className="relative pb-32">
        {/* CINEMATIC HERO */}
        <section className="relative w-full min-h-[70vh] flex items-center bg-[#0a0a0a] overflow-hidden">
          <div className="absolute inset-0 z-0">
            <motion.div style={{ y: y1 }} className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')] bg-cover bg-center opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#FDFDFD]" />
          </div>

          <div className="container mx-auto px-6 lg:px-12 max-w-[1400px] relative z-10 pt-20">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl">
              <h1 className="text-5xl md:text-8xl lg:text-9xl font-black text-white leading-[0.85] uppercase mb-8">
                Data <br /> <span className="text-[#00A651] italic">Intelligence</span>
              </h1>
              <p className="text-xl text-white/70 max-w-xl mb-10 font-serif italic">
                Mapping the high-priority shifts in global energy infrastructure.
              </p>

              <p className="text-xl text-white/70 max-w-2xl mb-12">
                Explore in-depth reports featuring data-driven analysis, sector insights, policy reviews,
                and market intelligence shaping India’s evolving energy landscape.
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold text-sm uppercase"
              >
                Browse All Reports
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </div>
        </section>

        {/* REFINED REPORT GRID */}
        <div className="container mx-auto px-6 lg:px-12 max-w-[1400px] -mt-20 relative z-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
            {reports.map((report) => (
              <motion.div key={report.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="group flex flex-col">
                <Link href={`/reports/${report.slug}`} className="block overflow-hidden rounded-3xl mb-8 relative aspect-[3/4] shadow-lg">
                  <div className="absolute inset-0 bg-zinc-100">
                    {report.image && (
                      <Image src={report.image} alt={report.title} fill className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000" />
                    )}
                  </div>
                  <div className="absolute bottom-6 right-6 bg-white p-4 rounded-full opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                    <ArrowUpRight size={24} className="text-[#00A651]" />
                  </div>
                </Link>
                <div className="px-2">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00A651] mb-4">{report.category}</div>
                  <Link href={`/reports/${report.slug}`}>
                    <h3 className="font-serif font-bold text-3xl leading-tight group-hover:underline decoration-[#00A651] underline-offset-8 transition-all mb-4">
                      {report.title}
                    </h3>
                  </Link>
                  <p className="text-zinc-500 text-sm line-clamp-2 italic font-serif leading-relaxed">{report.excerpt}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}