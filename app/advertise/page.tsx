"use client";

import { Header } from "@/components/layout/header";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Download, Mail, CheckCircle, Sparkles, Target, Globe, Users, BarChart3, Megaphone } from "lucide-react";

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
    }),
};

const advantages = [
    {
        title: "Contextual Credibility",
        description: "Placement within India\u2019s most respected editorial ecosystem.",
        icon: Sparkles,
    },
    {
        title: "Policy Adjacency",
        description: "Direct visibility among government, PSU, and regulatory decision-makers.",
        icon: Target,
    },
    {
        title: "Thought Leadership",
        description: "Association with authoritative analysis and future-shaping dialogue.",
        icon: Globe,
    },
    {
        title: "Sustained Recall",
        description: "Monthly engagement through both print and digital circulation.",
        icon: BarChart3,
    },
    {
        title: "Integrated Value",
        description: "The combined reach of ITEN Media, ENCIS, and ClariSector\u2019s technology-driven outreach network.",
        icon: Users,
    },
];

export default function AdvertisePage() {
    return (
        <div className="min-h-screen bg-[#FDFDFD] font-sans text-zinc-900 selection:bg-[#00A651]/30">
            <Header />

            <main className="relative pt-[0px] pb-32">

                {/* 1. HERO SECTION */}
                <section className="relative overflow-hidden bg-zinc-900 py-24 md:py-32 mb-15">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{
                            backgroundImage: "radial-gradient(circle at 20% 50%, #00A651 0%, transparent 50%), radial-gradient(circle at 80% 20%, #00A651 0%, transparent 40%)"
                        }} />
                    </div>
                    <div className="container mx-auto px-6 lg:px-12 relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="max-w-4xl"
                        >
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-[#00A651] flex items-center justify-center">
                                    <Megaphone size={18} className="text-white" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#00A651]">
                                    Partner With EnergDive
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[0.95] mb-8">
                                Influence That Shapes <br />
                                <span className="text-[#00A651]">the Future</span>
                            </h1>
                            <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-3xl mb-10">
                                Advertising in ENERGDIVE is not a transaction—it’s an alignment with India’s most credible energy narrative. Every placement, partnership, and feature represents a statement of leadership, signalling that your brand stands at the heart of India’s clean energy transformation.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link
                                    href="/download-media-kit"
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-[#00A651] text-white font-bold text-[13px] uppercase tracking-wider rounded-xl hover:bg-[#008f45] transition-colors"
                                >
                                    <Download size={16} /> Download Media Kit
                                </Link>
                                <Link
                                    href="/advertisement-enquiry"
                                    className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/20 text-white font-bold text-[13px] uppercase tracking-wider rounded-xl hover:bg-white/10 transition-colors"
                                >
                                    <Mail size={16} /> Advertisement Enquiry
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* 2. WHY PARTNER */}
                <section className="container mx-auto px-6 lg:px-12 relative -mt-12 md:-mt-16 z-20 mb-16 md:mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.55, ease: "easeOut" }}
                        className="rounded-[28px] border border-zinc-200/80 bg-white/95 backdrop-blur-sm shadow-[0_20px_60px_rgba(2,6,23,0.08)] p-8 md:p-12 lg:p-14"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-14 items-start">
                            <div className="lg:col-span-5">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00A651] mb-4 block">Why Partner with ENERGDIVE?</span>
                                <h2 className="text-4xl md:text-5xl font-black text-zinc-900 leading-[0.95] mb-8">
                                    More Than <br />
                                    <span className="text-zinc-400">Reach.</span>
                                </h2>
                                <div className="bg-[#00A651]/5 border-l-4 border-[#00A651] p-6 rounded-r-xl">
                                    <p className="text-base text-zinc-600 leading-relaxed">
                                        For governments, it is a channel of policy communication. For corporates, a platform of thought leadership. For investors and innovators, a bridge to India&apos;s most strategic markets.
                                    </p>
                                </div>
                            </div>
                            <div className="lg:col-span-7">
                                <p className="text-2xl md:text-3xl font-serif text-zinc-700 leading-relaxed mb-8">
                                    In a world overflowing with information, influence belongs to those who curate knowledge with clarity and purpose.
                                </p>
                                <p className="text-lg text-zinc-500 leading-relaxed mb-8">
                                    ENERGDIVE distinguishes itself as a <strong>Strategic Intelligence Platform</strong> where insight meets action and content creates credibility.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="flex items-start gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                                        <CheckCircle size={15} className="text-[#00A651] mt-0.5 shrink-0" />
                                        <p className="text-sm text-zinc-600">Access to policy-aware and business-critical audiences.</p>
                                    </div>
                                    <div className="flex items-start gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                                        <CheckCircle size={15} className="text-[#00A651] mt-0.5 shrink-0" />
                                        <p className="text-sm text-zinc-600">Brand placement in a trusted editorial context.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 pt-8 border-t border-zinc-200/80 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
                                <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-bold">Audience Quality</p>
                                <p className="text-zinc-700 font-semibold mt-1">Decision-makers, investors, and policy stakeholders.</p>
                            </div>
                            <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
                                <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-bold">Editorial Trust</p>
                                <p className="text-zinc-700 font-semibold mt-1">High-signal content with deep domain credibility.</p>
                            </div>
                            <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
                                <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-bold">Brand Recall</p>
                                <p className="text-zinc-700 font-semibold mt-1">Consistent visibility across digital and print touchpoints.</p>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* 3. THE ENERGDIVE ADVANTAGE */}
                <section className="bg-zinc-50 border-y border-zinc-100 py-24 md:py-32 mt-15">
                    <div className="container mx-auto px-6 lg:px-12">
                        <div className="text-center mb-16">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00A651] mb-4 block">Platform</span>
                            <h2 className="text-4xl md:text-5xl font-black text-zinc-900 leading-tight">
                                The ENERGDIVE Advantage
                            </h2>
                            <p className="text-lg text-zinc-500 mt-4 max-w-2xl mx-auto">
                                For advertisers, ENERGDIVE offers unmatched positioning within India&apos;s energy ecosystem.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {advantages.map((item, i) => (
                                <motion.div
                                    key={item.title}
                                    custom={i}
                                    variants={fadeUp}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    className="bg-white rounded-2xl p-8 border border-zinc-100 hover:border-[#00A651]/20 hover:shadow-lg transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-[#00A651]/10 flex items-center justify-center mb-6 group-hover:bg-[#00A651]/20 transition-colors">
                                        <item.icon size={22} className="text-[#00A651]" />
                                    </div>
                                    <h3 className="text-xl font-bold text-zinc-900 mb-3">{item.title}</h3>
                                    <p className="text-[14px] text-zinc-500 leading-relaxed">{item.description}</p>
                                    <CheckCircle size={16} className="text-[#00A651] mt-4" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 4. CTA BANNER */}
                <section className="container mx-auto px-6 lg:px-12 py-24 md:py-32">
                    <div className="bg-zinc-900 rounded-3xl p-12 md:p-20 text-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20">
                            <div className="absolute inset-0" style={{
                                backgroundImage: "radial-gradient(circle at 50% 0%, #00A651 0%, transparent 60%)"
                            }} />
                        </div>
                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                                Ready to Amplify <br />Your Brand?
                            </h2>
                            <p className="text-lg text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
                                Let&apos;s discuss how ENERGDIVE can help you reach the energy industry&apos;s most influential audience.
                            </p>
                            <div className="flex flex-wrap justify-center gap-4">
                                <Link
                                    href="/advertisement-enquiry"
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-[#00A651] text-white font-bold text-[13px] uppercase tracking-wider rounded-xl hover:bg-[#008f45] transition-colors"
                                >
                                    Advertisement Enquiry <ArrowRight size={16} />
                                </Link>
                                <Link
                                    href="/download-media-kit"
                                    className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/20 text-white font-bold text-[13px] uppercase tracking-wider rounded-xl hover:bg-white/10 transition-colors"
                                >
                                    <Download size={16} /> Download Media Kit
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
}
