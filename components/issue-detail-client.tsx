"use client";

import Image from "next/image";
import Link from "next/link";
import { Download, ChevronLeft, ArrowRight } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { Issue } from "@/types";

interface IssueDetailClientProps {
    issue: Issue;
}

export function IssueDetailClient({ issue }: IssueDetailClientProps) {
    // Animation variants
    const fadeInUp: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    const staggerContainer: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <main className="min-h-screen bg-white text-slate-900 pt-24 pb-20 font-sans selection:bg-teal-100 selection:text-teal-900">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Mobile: Cover Image Top */}
                <div className="lg:hidden mb-8">
                    <div className="relative aspect-3/4 rounded-sm overflow-hidden border border-slate-200 shadow-xl">
                        <Image
                            src={issue.coverImage}
                            alt={issue.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                    <div className="mt-6">
                        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2 leading-tight">
                            {issue.month} {issue.year}
                        </h1>
                        <p className="text-slate-500 text-sm uppercase tracking-widest mb-4 border-b border-slate-200 pb-4">
                            Volume {issue.volume}, Number {issue.number}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 relative">
                    {/* LEFT CONTENT COLUMN (8 cols) */}
                    <div className="lg:col-span-8">
                        {/* Desktop Issue Header */}
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={fadeInUp}
                            className="hidden lg:block mb-16"
                        >
                            <Link
                                href="/issues"
                                className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 mb-8 transition-colors text-sm uppercase tracking-wider group font-medium"
                            >
                                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                                Back to All Issues
                            </Link>

                            <h1 className="text-6xl font-serif font-bold text-slate-900 mb-4 leading-none tracking-tight">
                                {issue.month} / {issue.year}
                            </h1>
                            <div className="flex justify-between items-end border-b border-slate-200 pb-6">
                                <p className="text-slate-500 text-sm uppercase tracking-[0.2em] font-medium">
                                    Volume {issue.volume}, Number {issue.number}
                                </p>
                                <p className="text-slate-400 text-xs italic font-serif">
                                    Energdive Magazine
                                </p>
                            </div>
                        </motion.div>

                        {/* Content List */}
                        <div className="space-y-16">
                            {issue.sections?.map((section) => (
                                <motion.section
                                    key={section.title}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, margin: "-100px" }}
                                    variants={staggerContainer}
                                >
                                    <motion.h3
                                        variants={fadeInUp}
                                        className="text-teal-600 text-xs font-bold uppercase tracking-[0.2em] mb-8 flex items-center gap-3"
                                    >
                                        {section.title}
                                        <span className="h-px w-12 bg-teal-200"></span>
                                    </motion.h3>

                                    <div className="flex flex-col gap-8">
                                        {section.articles?.map((article) => (
                                            <motion.div
                                                key={article.id}
                                                variants={fadeInUp}
                                                className="group flex flex-col md:flex-row gap-6 md:items-start border-b border-slate-100 pb-8 last:border-0 hover:bg-slate-50 -mx-4 p-4 rounded-xl transition-colors duration-300"
                                            >
                                                <div className="grow order-2 md:order-1">
                                                    <Link href={`/news/${article.slug}`} className="block">
                                                        <h4 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-teal-700 transition-colors leading-snug font-serif">
                                                            {article.title}
                                                        </h4>
                                                        <p className="text-slate-600 mb-3 text-sm leading-relaxed line-clamp-2">
                                                            {article.excerpt}
                                                        </p>
                                                    </Link>
                                                    <div className="flex items-center gap-3 text-xs text-slate-400 uppercase tracking-wider font-medium">
                                                        <span className="text-slate-700 font-bold">{article.author?.name}</span>
                                                        {article.readTime && (
                                                            <>
                                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                                <span>{article.readTime}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {article.image && (
                                                    <Link href={`/news/${article.slug}`} className="order-1 md:order-2 shrink-0 md:w-32 md:h-24 relative overflow-hidden rounded-md group-hover:shadow-md transition-all duration-500 border border-slate-100">
                                                        <Image
                                                            src={article.image}
                                                            alt={article.title}
                                                            fill
                                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                                        />
                                                    </Link>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.section>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT SIDEBAR (4 cols) - Sticky */}
                    <div className="lg:col-span-4 relative hidden lg:block">
                        <div className="sticky top-32">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="relative aspect-3/4 w-full rounded-sm overflow-hidden shadow-xl shadow-slate-200 mb-8 max-w-[320px] ml-auto border border-slate-100"
                            >
                                <Image
                                    src={issue.coverImage}
                                    alt={issue.title}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                                {/* Gloss Overlay */}
                                <div className="absolute inset-0 bg-linear-to-tr from-white/10 to-transparent pointer-events-none" />
                            </motion.div>

                            <div className="flex flex-col gap-6 max-w-[320px] ml-auto text-right">
                                <div className="space-y-4 font-sans">
                                    <Link
                                        href="/issues"
                                        className="inline-flex items-center justify-end gap-2 text-sm text-teal-600 hover:text-teal-700 transition-colors uppercase tracking-wider font-bold group"
                                    >
                                        Browse Full Archive
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </div>

                                <div className="border-t border-slate-200 pt-6">
                                    <p className="text-slate-400 text-xs uppercase tracking-widest mb-4 font-bold">Download Issue</p>
                                    <div className="flex flex-col gap-3 items-end">
                                        {['PDF', 'MOBI', 'ePub'].map((format) => (
                                            <button
                                                key={format}
                                                className="text-slate-600 hover:text-slate-900 text-sm transition-colors border-b border-transparent hover:border-teal-500 pb-0.5 flex items-center gap-2 group font-medium"
                                            >
                                                <span>Download {format}</span>
                                                <Download className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-teal-500" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
