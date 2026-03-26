"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Brain, Lightbulb, Share2, ArrowRight, CheckCircle2
} from "lucide-react";
import { title } from "process";

// --- Components ---

const SectionHeading = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <h2 className={`text-4xl md:text-5xl font-serif font-bold text-[#E5B866] mb-8 ${className}`}>
        {children}
    </h2>
);

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="bg-black/40 border border-[#E5B866]/20 p-8 rounded-2xl backdrop-blur-sm hover:border-[#E5B866]/50 transition-all text-center group"
    >
        <div className="inline-flex p-4 rounded-full bg-[#E5B866]/10 text-[#E5B866] mb-6 group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-3 uppercase tracking-wider">{title}</h3>
        <p className="text-zinc-400 leading-relaxed text-sm">{description}</p>
    </motion.div>
);

const TierCard = ({ title, price, features, recommended = false }: { title: string, price: string, features: string[], recommended?: boolean }) => (
    <div className={`relative p-8 rounded-2xl border ${recommended ? 'border-[#E5B866] bg-[#E5B866]/5' : 'border-zinc-800 bg-zinc-900/50'} flex flex-col h-full`}>
        {recommended && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#E5B866] text-black text-xs font-bold px-4 py-1 rounded-full uppercase tracking-widest">
                Recommended
            </div>
        )}
        <h3 className={`text-2xl font-serif font-bold mb-2 ${recommended ? 'text-[#E5B866]' : 'text-white'}`}>{title}</h3>
        <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider mb-6">{price}</p>
        <ul className="space-y-4 mb-8 flex-1">
            {features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 text-zinc-300 text-sm">
                    <CheckCircle2 size={16} className="text-[#E5B866] mt-0.5 shrink-0" />
                    <span className="leading-tight">{feature}</span>
                </li>
            ))}
        </ul>
        <Link href="/auth" className={`w-full py-3 rounded-lg font-bold text-sm uppercase tracking-widest transition-all block text-center ${recommended
            ? 'bg-[#E5B866] text-black hover:bg-[#d4a855]'
            : 'bg-zinc-800 text-white hover:bg-zinc-700'
            }`}>
            {recommended ? 'Join Now' : 'Coming Soon'}
        </Link>
    </div>
);

const ecosystemItems = [
    { title: "Oil & Gas", img: "https://images.unsplash.com/photo-1516937941344-00b4e0337589?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    { title: "Power & Utilities", img: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&q=80&w=800" },
    { title: "Renewables", img: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=800" },
    { title: "Transmission", img: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
    { title: "Distribution", img: "https://images.unsplash.com/photo-1548337138-e87d889cc369?auto=format&fit=crop&q=80&w=800" },
    { title: "Electricity Markets", img: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=800" },
    { title: "New Energies", img: "https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?auto=format&fit=crop&q=80&w=800" },
    { title: "Energy Storage", img: "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&q=80&w=800" },
    { title: "Sustainability & Safety", img: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=800" }

];

export default function EnergClubPage() {
    return (
        <main className="bg-black text-white min-h-screen selection:bg-[#E5B866] selection:text-black">

            {/* HERO SECTION */}
            <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black z-10" />
                    <Image
                        src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"
                        alt="Global Network"
                        fill
                        className="object-cover opacity-60"
                        priority
                    />
                </div>

                <div className="relative z-20 text-center max-w-5xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <Image
                            src="/energclub.png"
                            alt="EnergClub"
                            width={200}
                            height={200}
                            className="mx-auto mb-8"
                        />

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-8 leading-tight">
                            Powering India's Intelligent, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E5B866] to-[#FFE0B2]">
                                Innovative & Interconnected
                            </span> <br />
                            Energy Ecosystem
                        </h1>
                        <p className="text-zinc-300 text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed">
                            Join an exclusive network of industry leaders, policymakers, and innovators shaping the future of energy and sustainability in India.
                        </p>
                        <Link href="/dashboard" className="inline-flex items-center gap-2 bg-[#E5B866] text-black px-8 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-white transition-colors duration-300">
                            Explore Now <ArrowRight size={18} />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* THE CLUB */}
            <section className="py-24 relative">
                <div className="container mx-auto px-6 lg:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <SectionHeading>The Club</SectionHeading>
                            <div className="space-y-6 text-zinc-400 text-lg leading-relaxed">
                                <p>
                                    EnergClub is India's first integrated community for energy and sustainability professionals. Designed for decision-makers, innovators, CXOs, and thought leaders, we facilitate meaningful collaborations, knowledge sharing, and exclusive strategic alliances across the ecosystem.
                                </p>
                                <p>
                                    Beyond a digital interface, the Club provides a collaboration network, membership base, and empowerment platform to ensure every stakeholder finds value.
                                </p>
                            </div>
                        </motion.div>
                        <div className="relative h-[400px] rounded-2xl overflow-hidden border border-zinc-800 grayscale hover:grayscale-0 transition-all duration-700">
                            <Image
                                src="/the club.jpg"
                                alt="The Club"
                                fill
                                priority // Add this to prioritize loading for hero-section images
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                        </div>
                    </div>
                </div>
            </section>

            {/* OUR EDGE */}
            <section className="py-20 bg-zinc-900/30 border-y border-zinc-900">
                <div className="container mx-auto px-6 lg:px-12 text-center">
                    <h3 className="text-[#E5B866] font-bold text-lg uppercase tracking-[0.2em] mb-16">Our Edge</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                        <FeatureCard
                            icon={<Brain size={32} />}
                            title="Intelligent"
                            description="Insightful, knowledge-driven, and data-informed decision making."
                        />
                        <FeatureCard
                            icon={<Lightbulb size={32} />}
                            title="Innovative"
                            description="Access to cutting-edge tech, potential startups, and new ideas."
                        />
                        <FeatureCard
                            icon={<Share2 size={32} />}
                            title="Interconnected"
                            description="Strategic integration and holistic networking across sectors."
                        />
                    </div>
                </div>
            </section>

            {/* KEY OUTCOMES */}
            <section className="py-24 container mx-auto px-6 lg:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="relative h-[500px] rounded-2xl overflow-hidden border border-zinc-800 order-2 lg:order-1">
                        <Image
                            src="/key outcomes.jpg"
                            alt="Innovation"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-[#E5B866]/10 mix-blend-overlay" />
                    </div>
                    <div className="order-1 lg:order-2">
                        <SectionHeading>Key Outcomes</SectionHeading>
                        <ul className="space-y-6">
                            {[
                                "Access to India's energy ecosystem through integrated channels.",
                                "Analyze latest market trends, policies, regulations, and directions.",
                                "Network, create knowledge, insights, and innovation opportunities.",
                                "Create career enhancement tracks for talent and engagement pathways.",
                                "Synergies between energy producers, finance, tech, and intelligence professionals."
                            ].map((item, idx) => (
                                <li key={idx} className="flex gap-4 items-start group">
                                    <div className="mt-1 min-w-[20px] text-[#E5B866] group-hover:scale-125 transition-transform"><CheckCircle2 size={20} /></div>
                                    <p className="text-zinc-300 text-lg leading-relaxed">{item}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* ONE ECOSYSTEM BANNER */}
            <section className="py-24 bg-gradient-to-r mt-20 from-zinc-900 via-zinc-800 to-zinc-900 border-y border-[#E5B866]/20">
                <div className="container mx-auto px-6 text-center max-w-4xl">
                    <h3 className="text-3xl md:text-4xl font-serif font-bold text-[#E5B866] mb-6">
                        One Ecosystem. One Community. One Platform.
                    </h3>
                    <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
                        An integrated digital platform for India's energy professionals. All figures, power, generation, markets, storage, policy, and one goal: To Access Insights, Fuel Innovation, and Sustain Power for a better ecosystem.
                    </p>
                    <Link href="/auth" className="bg-[#E5B866] text-black px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-white transition-colors duration-300 shadow-[0_0_20px_rgba(229,184,102,0.3)] inline-block">
                        Join Nowx
                    </Link>
                </div>
            </section>

            {/* THE ECOSYSTEM - Slow Motion & Grab Effect */}
            <section className="py-24 overflow-hidden relative">
                <div className="text-center mb-16 px-6">
                    <SectionHeading className="mb-2">The Ecosystem</SectionHeading>
                    <p className="text-zinc-500 uppercase tracking-widest text-sm">Diverse sectors integrated on one common canvas</p>
                </div>

                {/* Wrapper to hide scrollbar */}
                <div className="relative overflow-hidden w-full cursor-grab active:cursor-grabbing">
                    <motion.div
                        className="flex gap-4 px-4"
                        drag="x"
                        dragConstraints={{ right: 0, left: -2000 }} // Adjust based on content width
                        animate={{ x: ["0%", "-50%"] }}
                        transition={{
                            x: {
                                repeat: Infinity,
                                repeatType: "loop",
                                duration: 60, // Speed slow karne ke liye duration badha di (30 se 60)
                                ease: "linear",
                            },
                        }}
                        style={{
                            width: "max-content",
                            display: "flex",
                        }}
                    >
                        {[...ecosystemItems, ...ecosystemItems].map((item, idx) => (
                            <div
                                key={idx}
                                className="group relative w-[280px] md:w-[350px] shrink-0 aspect-[3/4] rounded-2xl overflow-hidden select-none"
                            >
                                <Image
                                    src={item.img}
                                    alt={item.title}
                                    fill
                                    draggable={false} // Image drag prevent karne ke liye
                                    className="object-cover group-hover:scale-110 transition-transform duration-700 pointer-events-none"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 pointer-events-none" />
                                <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
                                    <span className="text-[#E5B866] text-sm font-bold uppercase tracking-[0.3em] border-b border-[#E5B866]/50 pb-2">
                                        {item.title}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    {/* Side Fading Overlays */}
                    <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
                    <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
                </div>

                {/* Global CSS to hide that annoying scrollbar for good */}
                <style jsx global>{`
        ::-webkit-scrollbar {
            display: none !important;
        }
        body {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    `}</style>
            </section>

            {/* MEMBERSHIP TIERS */}
            <section id="membership" className="py-24 bg-zinc-900/20">
                <div className="container mx-auto px-6 lg:px-12">
                    <div className="text-center mb-16">
                        <SectionHeading className="mb-2">Membership Tiers</SectionHeading>
                        <p className="text-zinc-500 uppercase tracking-widest text-sm">Select the tier that matches your engagement ambitions</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        <TierCard
                            title="Premier"
                            price="Paid"
                            features={[
                                "Complimentary Subscription to EnergDive Magazine (12 Issues)",
                                "Publish view points, technical papers & research on our Digital Feed",
                                "Priority invite to EnergDive Global Forums",
                                "One complimentary research report per year"
                            ]}
                        />
                        <TierCard
                            title="Standard"
                            price="Free"
                            recommended={true}
                            features={[
                                "Early access to EnergDive featured content",
                                "Join multiple digital sub-communities",
                                "Personalized Newsletter (Sector & Region)",
                                "10% discount on single reports and magazines",
                                "Complimentary access to EnergClub Digital Hangout & Virtual Roundtables",
                                "Digital Membership Card"
                            ]}
                        />
                        <TierCard
                            title="Executive"
                            price="Invite / Corporate"
                            features={[
                                "Reserved for CXOs, Founder, Directors, Policy Makers",
                                "Complimentary Print Edition of EnergDive Magazine",
                                "VIP Invites to EnergDive Group Events & Dinners",
                                "Speaking opportunities at global and domestic events",
                                "Access to exclusive management level forums",
                                "Thought Leadership profiling in our print/digital media",
                                "Exclusive Executive Member Club Card"
                            ]}
                        />
                    </div>
                </div>
            </section>

            {/* LINK INTO ECOSYSTEM */}
            <section className="py-24 container mx-auto px-6 lg:px-12 relative overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <SectionHeading>Link Into the Ecosystem</SectionHeading>
                        <div className="space-y-10">
                            <div>
                                <h4 className="text-[#E5B866] font-bold text-lg mb-3">Who Energizes the Network?</h4>
                                <p className="text-zinc-400 leading-relaxed">
                                    Professionals across operations, policymakers, startups, investors, researchers, and leaders who fuel the energy of India and the ecosystem.
                                </p>
                            </div>
                            <div>
                                <h4 className="text-[#E5B866] font-bold text-lg mb-3">Why energize your journey?</h4>
                                <ul className="space-y-2 text-zinc-400 list-disc list-inside marker:text-[#E5B866]">
                                    <li>Assess risk, advice on policy and strategy concepts.</li>
                                    <li>Find opportunities, unlock new intelligence.</li>
                                    <li>Create new collaborative partnership platforms.</li>
                                    <li>Exchange dialogue with peers/experts.</li>
                                    <li>A lifetime of market data and finance intelligence access.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="relative aspect-square w-full max-w-md mx-auto">
                            <div className="absolute inset-0 bg-[#E5B866]/20 rounded-full blur-[100px]" />
                            <Image
                                src="/join.jpg"
                                alt="Network Globe"
                                fill
                                className="object-cover rounded-full mix-blend-screen opacity-80"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER / ACTIVATE MEMBERSHIP */}
            <section className="py-20 bg-[#111]">
                <div className="container mx-auto px-6 text-center max-w-3xl">
                    <h3 className="text-2xl md:text-3xl font-serif font-bold text-[#E5B866] mb-6">
                        Activate Your Membership
                    </h3>
                    <p className="text-zinc-400 mb-10 leading-relaxed">
                        Your access to India's most influential energy community is just one step away. Join now and start engaging with policymakers, industry giants, and opportunities that matter to your journey.
                    </p>
                    <Link href="/auth" className="bg-[#E5B866] text-black px-12 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-white transition-colors duration-300 shadow-[0_0_30px_rgba(229,184,102,0.4)] inline-block">
                        Join Now
                    </Link>

                    <div className="mt-20 pt-10 border-t border-zinc-800">
                        <div className="flex flex-col items-center gap-6">
                            <Image
                                src="/energclub.png"
                                alt="EnergClub"
                                width={200}
                                height={200}
                                className="m-8"
                            />
                            <p className="text-xs text-zinc-700 uppercase tracking-widest mt-4">
                                © 2026 ENERGDIVE. All Rights Reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}