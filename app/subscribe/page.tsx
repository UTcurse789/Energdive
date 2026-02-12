"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function SubscribePage() {
    // Zoho Form URL yahan replace karein
    const ZOHO_FORM_URL = "https://forms.zohopublic.com/your_account/form/Subscription/formperma/YOUR_FORM_PERMALINK";

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-teal-50">
            <Header />

            {/* 1. HERO BANNER (Matches image_1b195d.jpg top section) */}
            <div className="w-full h-[300px] bg-black relative flex items-center justify-center overflow-hidden">
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-90"
                    style={{ backgroundImage: "url('/advertise-breadrumb.jpg')" }}
                />
                {/* Dark overlay for better text visibility */}
                <div className="absolute inset-0 bg-black/30" />
                {/* Visual spot light effect */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[100px] bg-teal-500/20 blur-[100px]" />
            </div>

            <main className="max-w-[1200px] mx-auto px-6 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-16 items-start">

                    {/* LEFT COLUMN: Content (Matches image_1b195d.jpg text) */}
                    <div className="space-y-12">
                        <section>
                            <h2 className="text-4xl font-bold tracking-tight mb-4">Subscription</h2>
                            <p className="text-xl text-teal-800 italic font-serif mb-6">
                                Access insight that shapes India's energy future
                            </p>
                            <p className="text-gray-600 leading-relaxed text-lg">
                                ENERGDIVE is more than a magazine—it is India's most trusted voice on energy transition,
                                policy, technology, and sustainability. Every issue brings sharp analysis,
                                real industry perspectives, and actionable intelligence for leaders shaping tomorrow.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-2xl font-bold mb-6">Why Subscribe?</h3>
                            <ul className="space-y-4">
                                {[
                                    { title: "Credible Knowledge", desc: "Expert opinions, policy insights & sector intelligence." },
                                    { title: "Future-Focused Content", desc: "Coverage decoding India's clean energy transformation." },
                                    { title: "Leadership & Innovation", desc: "Stories of change-makers and pioneers." },
                                    { title: "Monthly Engagement", desc: "Delivered to your doorstep and available digitally." },
                                    { title: "Community Access", desc: "Connect with decision-makers across government and industry." }
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <span className="text-black mt-1.5">•</span>
                                        <p className="text-gray-700">
                                            <strong className="text-black">{item.title}:</strong> {item.desc}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section className="pt-8 border-t border-gray-100">
                            <h3 className="text-2xl font-bold mb-4">The ENERGDIVE Advantage</h3>
                            <p className="text-gray-600 leading-relaxed italic">
                                A platform built on credibility, relevance, and influence—trusted by governments,
                                corporates, investors, and innovators committed to a sustainable energy future.
                            </p>
                            <p className="mt-4 font-bold text-black uppercase tracking-widest text-xs">
                                Join the movement shaping India's energy narrative.
                            </p>
                        </section>
                    </div>

                    {/* RIGHT COLUMN: Zoho Form Box (Matches image_1b199f.jpg) */}
                    <aside className="sticky top-28">
                        <div className="bg-white border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-3 rounded-sm">
                            <h3 className="text-2xl font-bold mb-2">Online Subscription & Payment</h3>
                            <p className="text-gray-500 text-sm mb-8">
                                Subscribe to ENERGDIVE magazine instantly using our secure online subscription and payment form.
                            </p>

                            {/* ZOHO FORM IFRAME CONTAINER */}
                            <div className="min-h-[600px] w-full bg-gray-50 rounded-md flex flex-col items-center justify-center">
                                {/* Option 1: Live Iframe */}
                                <iframe
                                    src="https://forms.zohopublic.in/itenmedia1/form/ENERGDIVEMagazineSubscriptionForm/formperma/CX7ORe1WkKQKOFusFv-6rEvYHtqmvqW9P4pP5XHOIGo"
                                    className="w-full h-[600px] border-none"
                                    title="Zoho Subscription Form"
                                />

                                {/* Option 2: Fallback button agar iframe blocks ho */}
                                <div className="mt-8 text-center border-t border-gray-100 pt-8 w-full">
                                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-4 font-bold">
                                        For specific or bulk subscription enquiries
                                    </p>
                                    <a
                                        href="https://forms.zohopublic.in/itenmedia1/form/ENERGDIVEMagazineSubscriptionForm/formperma/CX7ORe1WkKQKOFusFv-6rEvYHtqmvqW9P4pP5XHOIGo"
                                        target="_blank"
                                        className="inline-block bg-[#7D9446] hover:bg-[#6a7e3b] text-white px-10 py-3 rounded-md font-bold transition-colors"
                                    >
                                        Open Enquiry Form
                                    </a>
                                </div>
                            </div>
                        </div>
                    </aside>

                </div>
            </main>

            <Footer />
        </div>
    );
}