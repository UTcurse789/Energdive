"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MapPin, Mail, Phone, Briefcase, Feather, Megaphone,
    HelpCircle, FileText, ArrowRight, Copy, Check
} from "lucide-react";

// --- 1. NEW: Energy Background Component ---
const EnergyBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        {/* Soft Gradient Orb (Top Right) */}
        <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-[#00A651]/5 rounded-full blur-[120px]" />

        {/* Soft Gradient Orb (Bottom Left) */}
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#00A651]/5 rounded-full blur-[100px]" />

        {/* Technical Grid Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>

        {/* Dynamic Energy Waves SVG */}
        <svg className="absolute top-0 left-0 w-full h-full opacity-30" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <motion.path
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
                d="M-100 600 C 200 500, 600 800, 1600 200"
                stroke="#00A651"
                strokeWidth="1"
                strokeDasharray="10 10"
                fill="none"
                className="opacity-20"
            />
            <path d="M-100 800 C 300 700, 700 900, 1600 400" stroke="#00A651" strokeWidth="2" strokeOpacity="0.1" fill="none" />
            <path d="M-100 400 C 400 300, 800 600, 1600 100" stroke="black" strokeWidth="1" strokeOpacity="0.05" fill="none" />
        </svg>
    </div>
);

// --- 2. CopyButton Component ---
const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 transition-all ml-2"
            title="Copy to clipboard"
        >
            {copied ? <Check size={16} className="text-[#00A651]" /> : <Copy size={16} />}
        </button>
    );
};

// --- 3. Data Structure ---
const tabs = [
    {
        id: "address",
        label: "Office Address",
        description: "Visit our headquarters",
        icon: <MapPin size={20} />,
        content: (
            <div className="h-full flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00A651]/10 text-[#00A651] text-xs font-bold uppercase tracking-widest w-fit mb-6">
                    Headquarters
                </div>
                <h3 className="text-3xl font-serif font-bold text-zinc-900 mb-2">ENERGDIVE Insights & Market Intelligence</h3>
                <p className="text-zinc-500 font-medium mb-8">A unit of ClariSector Technologies Pvt. Ltd.</p>

                <div className="p-8 rounded-3xl bg-zinc-50 border border-zinc-100 space-y-4">
                    <div className="flex gap-4">
                        <div className="mt-1 min-w-[24px] text-[#00A651]"><MapPin /></div>
                        <p className="text-zinc-600 leading-relaxed text-lg">
                            4th Floor, Janki House, Plot No. 33, <br />
                            Sector 12A, Dwarka, <br />
                            New Delhi 110075, India
                        </p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: "general",
        label: "General Support",
        description: "For general inquiries",
        icon: <HelpCircle size={20} />,
        content: (
            <div className="h-full flex flex-col justify-center">
                <h3 className="text-3xl font-serif font-bold text-zinc-900 mb-6">General Queries</h3>
                <p className="text-zinc-500 text-lg mb-8 leading-relaxed">
                    Have a question about our platform, navigating the interface, or need technical support? Our team is ready to assist.
                </p>
                <div className="space-y-4">
                    <div className="group p-6 rounded-2xl bg-white border border-zinc-100 shadow-sm hover:border-[#00A651] transition-all flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[#00A651]/10 text-[#00A651] rounded-full">
                                <Mail size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-zinc-400 uppercase tracking-wider font-bold">Email Us</p>
                                <a href="mailto:info@energdive.com" className="text-xl text-zinc-900 font-medium hover:text-[#00A651] transition-colors">info@energdive.com</a>
                            </div>
                        </div>
                        <CopyButton text="info@energdive.com" />
                    </div>

                    <div className="group p-6 rounded-2xl bg-white border border-zinc-100 shadow-sm hover:border-[#00A651] transition-all flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[#00A651]/10 text-[#00A651] rounded-full">
                                <Phone size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-zinc-400 uppercase tracking-wider font-bold">Call Us</p>
                                <a href="tel:+911145444425" className="text-xl text-zinc-900 font-medium hover:text-[#00A651] transition-colors">+91-11-45444425</a>
                            </div>
                        </div>
                        <CopyButton text="+911145444425" />
                    </div>
                </div>
            </div>
        )
    },
    {
        id: "advertisement",
        label: "Advertising",
        description: "Brand partnerships",
        icon: <Megaphone size={20} />,
        content: (
            <div className="h-full flex flex-col justify-center">
                <h3 className="text-3xl font-serif font-bold text-zinc-900 mb-6">Advertise with Us</h3>
                <p className="text-zinc-500 text-lg mb-8 leading-relaxed">
                    Connect with decision-makers in India’s energy ecosystem. We offer bespoke advertising solutions for brands looking for high-impact visibility.
                </p>
                <div className="bg-linear-to-br from-[#00A651]/10 to-transparent p-1 rounded-3xl">
                    <div className="bg-white rounded-[1.3rem] p-10 text-center border border-[#00A651]/20 shadow-lg shadow-[#00A651]/5">
                        <Mail size={32} className="mx-auto text-[#00A651] mb-4" />
                        <p className="text-zinc-400 mb-6">Send your media kit request to</p>
                        <div className="flex items-center justify-center gap-2">
                            <a href="mailto:advertisement@energdive.com" className="text-2xl font-bold text-zinc-900 hover:text-[#00A651] transition-colors">
                                advertisement@energdive.com
                            </a>
                            <CopyButton text="advertisement@energdive.com" />
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: "editorial",
        label: "Editorial",
        description: "Pitch stories & ideas",
        icon: <Feather size={20} />,
        content: (
            <div className="h-full flex flex-col justify-center">
                <h3 className="text-3xl font-serif font-bold text-zinc-900 mb-6">Editorial Collaborations</h3>
                <p className="text-zinc-500 text-lg mb-8 leading-relaxed">
                    Are you a thought leader, researcher, or policymaker? We are always looking for compelling narratives and expert analysis on the energy sector.
                </p>
                <a href="mailto:editorial@energdive.com" className="group relative overflow-hidden block p-8 rounded-3xl bg-zinc-50 hover:bg-white hover:shadow-xl transition-all border border-zinc-200">
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <p className="text-[#00A651] font-bold uppercase tracking-widest text-xs mb-3">Contact Editorial Team</p>
                            <h4 className="text-2xl text-zinc-900 font-serif group-hover:text-[#00A651] transition-colors">editorial@energdive.com</h4>
                        </div>
                        <div className="h-12 w-12 bg-zinc-200 rounded-full flex items-center justify-center group-hover:bg-[#00A651] group-hover:text-white transition-all">
                            <ArrowRight size={20} />
                        </div>
                    </div>
                </a>
            </div>
        )
    },
    {
        id: "career",
        label: "Careers",
        description: "Join the team",
        icon: <Briefcase size={20} />,
        content: (
            <div className="h-full flex flex-col justify-center">
                <h3 className="text-3xl font-serif font-bold text-zinc-900 mb-6">Join the Movement</h3>
                <p className="text-zinc-500 text-lg mb-8 leading-relaxed">
                    Build your career with Energdive. We are looking for passionate individuals ready to shape India’s energy narrative.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    {['Journalism', 'Data Analysis', 'Web Development', 'Marketing'].map((role) => (
                        <div key={role} className="p-4 bg-zinc-50 rounded-xl text-zinc-600 font-medium text-sm text-center border border-zinc-100">
                            {role}
                        </div>
                    ))}
                </div>

                <div className="text-center">
                    <a href="mailto:career@energdive.com" className="inline-flex items-center gap-2 text-[#00A651] font-bold hover:text-zinc-900 border-b-2 border-[#00A651]/20 hover:border-[#00A651] pb-1 transition-all">
                        Send your CV to career@energdive.com <ArrowRight size={16} />
                    </a>
                </div>
            </div>
        )
    },
    {
        id: "subscription",
        label: "Subscriptions",
        description: "Plans & Access",
        icon: <FileText size={20} />,
        content: (
            <div className="h-full flex flex-col justify-center">
                <h3 className="text-3xl font-serif font-bold text-zinc-900 mb-6">Unlock Intelligence</h3>
                <p className="text-zinc-500 text-lg mb-8 leading-relaxed">
                    Need help with your account access, enterprise plans, or billing? Our subscription support team is here to ensure seamless access.
                </p>
                <div className="p-8 rounded-3xl bg-zinc-50 border-l-4 border-[#00A651] flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                    <div>
                        <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">Support Email</p>
                        <a href="mailto:subscription@energdive.com" className="text-2xl text-zinc-900 font-serif hover:text-[#00A651] transition-colors">
                            subscription@energdive.com
                        </a>
                    </div>
                    <CopyButton text="subscription@energdive.com" />
                </div>
            </div>
        )
    },
];

export default function ContactPage() {
    const [activeTab, setActiveTab] = useState(tabs[0].id);

    return (
        <main className="min-h-screen pt-[50px] pb-20 bg-[#FDFDFD] text-zinc-900 selection:bg-[#00A651]/30 relative">

            {/* ADDED: Background Element */}
            <EnergyBackground />

            <section className="container mx-auto px-6 lg:px-12 relative z-10">

                {/* Header Section */}
                <div className="max-w-4xl mx-auto text-center mb-20 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-zinc-200 bg-white text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mb-4 shadow-sm"
                    >
                        <span className="w-2 h-2 rounded-full bg-[#00A651] animate-pulse"></span>
                        Get in Touch
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-black font-serif tracking-tight text-zinc-900 leading-tight"
                    >
                        Let's Start a <br />
                        <span className="text-[#00A651] italic">Conversation.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-zinc-500 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto"
                    >
                        We believe great ideas grow through collaboration. If you wish to partner, advertise, contribute editorially, or require subscription assistance, connect with us—we’re always ready to engage. Together, let’s build an intelligent, sustainable energy future for India.

                    </motion.p>
                </div>

                {/* Main Interface: Bento/Dashboard Style */}
                <div className="max-w-6xl mx-auto bg-white/80 backdrop-blur-md border border-zinc-200 rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] flex flex-col md:flex-row min-h-[600px]">

                    {/* LEFT: Navigation Sidebar */}
                    <div className="w-full md:w-1/3 border-r border-zinc-100 bg-zinc-50/50 p-6 flex flex-col gap-2">
                        <div className="mb-4 px-4 pt-2 pb-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Departments</span>
                        </div>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`group relative flex items-center gap-4 px-4 py-4 rounded-2xl text-left transition-all duration-300
                                    ${activeTab === tab.id ? "bg-white text-zinc-900 shadow-md shadow-zinc-200/50" : "text-zinc-500 hover:text-zinc-900 hover:bg-white/60"}
                                `}
                            >
                                {/* Active Indicator Line */}
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="active-indicator"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-[#00A651] rounded-r-full"
                                    />
                                )}

                                <div className={`p-2 rounded-xl transition-colors ${activeTab === tab.id ? "bg-[#00A651] text-white" : "bg-zinc-200/50 text-zinc-500 group-hover:text-zinc-900"}`}>
                                    {tab.icon}
                                </div>
                                <div>
                                    <span className="block font-bold text-sm tracking-wide">{tab.label}</span>
                                    <span className="block text-xs opacity-60 font-medium mt-0.5">{tab.description}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* RIGHT: Content Area */}
                    <div className="w-full md:w-2/3 p-8 md:p-16 relative flex items-center bg-white/50">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="w-full relative z-10"
                            >
                                {tabs.find(t => t.id === activeTab)?.content}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                </div>

            </section>
        </main>
    );
}