"use client";

import { useEffect } from "react";
import Image from "next/image";
import { ArrowUpRight, Globe, Users, Award } from "lucide-react";

const STATS = [
    { label: "Active Readers", value: "50K+", icon: Users },
    { label: "Global Reach", value: "12+ Countries", icon: Globe },
    { label: "Industry Awards", value: "08", icon: Award },
];

const WHY_SUBSCRIBE = [
    { title: "Strategic Intelligence", desc: "Hard-hitting policy analysis and executive-level sector insights." },
    { title: "Clean Tech Roadmap", desc: "Exclusive coverage of India's multi-gigawatt energy transformation." },
    { title: "Executive Profiles", desc: "Conversations with the CEOs and Ministers driving the narrative." },
    { title: "Quarterly Trends", desc: "Deep-dive data reports on solar, wind, and green hydrogen." },
];

export default function SubscribePage() {

    useEffect(() => {
        try {
            const containerId = "zf_div_CX7ORe1WkKQKOFusFv-6rEvYHtqmvqW9P4pP5XHOIGo";
            const container = document.getElementById(containerId);

            if (container && !container.querySelector("iframe")) {
                const f = document.createElement("iframe");
                let ifrmSrc = 'https://forms.zohopublic.in/itenmedia1/form/ENERGDIVEMagazineSubscriptionForm/formperma/CX7ORe1WkKQKOFusFv-6rEvYHtqmvqW9P4pP5XHOIGo?zf_rszfm=1';

                f.src = ifrmSrc;
                f.style.border = "none";
                f.style.height = "1100px";
                f.style.width = "100%";
                f.style.transition = "all 0.5s ease";
                f.setAttribute("aria-label", 'ENERGDIVE Magazine Subscription Form');

                container.appendChild(f);

                window.addEventListener('message', (event) => {
                    const evntData = event.data;
                    if (evntData && typeof evntData === "string") {
                        const zf_ifrm_data = evntData.split("|");
                        if (zf_ifrm_data.length >= 2) {
                            const zf_perma = zf_ifrm_data[0];
                            const zf_ifrm_ht_nw = (parseInt(zf_ifrm_data[1], 10) + 15) + "px";
                            const iframe = container.querySelector("iframe");
                            if (iframe && iframe.src.includes(zf_perma)) {
                                iframe.style.height = zf_ifrm_ht_nw;
                            }
                        }
                    }
                }, false);
            }
        } catch (e) { console.error(e); }
    }, []);

    return (
        <div className="min-h-screen bg-[#F1F3F6] text-slate-900 selection:bg-[#00A651]/20 font-sans">

            {/* Header Section */}
            <header className="relative bg-slate-950 pt-32 pb-48 px-6 overflow-hidden">
                <div className="absolute inset-0 opacity-40">
                    <Image src="/advertise-breadrumb.jpg" alt="Background" fill className="object-cover grayscale" />
                </div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />

                <div className="relative z-10 max-w-7xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-[#00A651]/40 bg-[#00A651]/10 text-[#00D9B1] text-xs font-bold tracking-widest uppercase mb-6">
                        Corporate Access
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-none mb-6">
                        ENERGY <br /> <span className="text-[#00A651]">INTELLIGENCE.</span>
                    </h1>
                    <p className="max-w-2xl text-slate-400 text-lg md:text-xl font-light leading-relaxed">
                        Join the ecosystem of decision-makers. ENERGDIVE delivers actionable intelligence
                        to the leaders steering India's energy transformation.
                    </p>
                </div>
            </header>

            {/* Stats Bar */}
            <div className="relative z-20 -mt-20 max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-1 bg-white border border-slate-200 shadow-2xl rounded-xl overflow-hidden">
                    {STATS.map((stat) => (
                        <div key={stat.label} className="flex items-center gap-5 p-8 bg-white hover:bg-slate-50 transition-colors">
                            <stat.icon size={28} className="text-[#00A651]" />
                            <div>
                                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-20">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-16">

                    {/* Left Side: Restored Bold Styling */}
                    <div className="xl:col-span-5">
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-[#00A651] mb-4">Subscription Benefits</h2>
                        <h3 className="text-4xl font-bold text-slate-900 mb-10 tracking-tight">Stay Ahead of the Curve.</h3>

                        <div className="space-y-10">
                            {WHY_SUBSCRIBE.map((item, idx) => (
                                <div key={idx} className="relative pl-12">
                                    <div className="absolute left-0 top-0 text-5xl font-black text-slate-100 -z-10 tracking-tighter">0{idx + 1}</div>
                                    <h4 className="text-lg font-bold text-slate-900 mb-1">{item.title}</h4>
                                    <p className="text-slate-600 leading-relaxed text-sm md:text-base">{item.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Bulk Box Restored */}
                        <div className="mt-16 p-8 rounded-2xl bg-slate-900 text-white relative overflow-hidden group">
                            <h4 className="text-xl font-bold mb-2">Bulk & Institutional Access</h4>
                            <p className="text-slate-400 text-sm mb-6">Equip your entire team with premium energy intelligence and regional reports.</p>
                            <button className="flex items-center gap-2 text-[#00D9B1] text-xs font-black uppercase tracking-widest group-hover:gap-4 transition-all">
                                Corporate Enquiry <ArrowUpRight size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Right Side: Advantage Block + Form with NO extra footer */}
                    <div className="xl:col-span-7">
                        <div className="space-y-8">

                            {/* New Advantage Block as requested */}
                            <div className="bg-white border-l-4 border-[#00A651] p-8 rounded-r-2xl shadow-sm">
                                <h3 className="text-2xl font-bold text-slate-900 mb-3">The ENERGDIVE Advantage</h3>
                                <p className="text-slate-600 leading-relaxed mb-4">
                                    A platform built on credibility, relevance, and influence—trusted by governments,
                                    corporates, investors, and innovators committed to a sustainable energy future.
                                </p>
                                <p className="font-bold text-[#00A651] text-sm tracking-tight uppercase">
                                    Join the movement shaping India’s energy narrative.
                                </p>
                            </div>

                            {/* Clean Form Card - No Footer, No Extra Space */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden mb-0">
                                <div className="p-2 md:p-6 pb-0"> {/* Bottom padding removed to avoid extra space */}
                                    <div id="zf_div_CX7ORe1WkKQKOFusFv-6rEvYHtqmvqW9P4pP5XHOIGo">
                                        {/* Zoho Form Injected Here */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}