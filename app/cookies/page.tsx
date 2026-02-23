"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Cookie, ArrowRight } from "lucide-react";

const brandGreen = "#00A651";
const lastUpdated = "February 1, 2026";

const cookieTable = [
    { name: "_energdive_session", type: "Essential", duration: "Session", purpose: "Maintains your logged-in state and session security." },
    { name: "_ed_preferences", type: "Functional", duration: "1 year", purpose: "Remembers your display settings, language, and sector preferences." },
    { name: "_ed_analytics", type: "Analytics", duration: "2 years", purpose: "Tracks page views, session duration, and user engagement patterns." },
    { name: "_ed_ab", type: "Analytics", duration: "90 days", purpose: "Enables A/B testing to improve user experience and content relevance." },
    { name: "_ed_consent", type: "Essential", duration: "1 year", purpose: "Stores your cookie consent preferences." },
    { name: "_ed_newsletter", type: "Functional", duration: "30 days", purpose: "Tracks newsletter subscription prompts and interactions." },
];

const sections = [
    {
        id: "what-are-cookies",
        title: "1. What Are Cookies?",
        content: `Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently, provide information to the owners of the site, and enhance the user experience.\n\nCookies can be "first-party" (set by EnergDive) or "third-party" (set by external services we use). They can also be "session" cookies (deleted when you close your browser) or "persistent" cookies (remain on your device until they expire or you delete them).`,
    },
    {
        id: "types",
        title: "2. Types of Cookies We Use",
        content: `**Essential Cookies**\nThese cookies are strictly necessary for the operation of our website. They enable core functionalities such as security, session management, and accessibility. You cannot opt out of essential cookies as the site cannot function properly without them.\n\n**Functional Cookies**\nThese cookies remember your preferences and settings to provide a more personalized experience. For example, they remember your preferred energy sectors, display settings, and whether you've dismissed certain notifications.\n\n**Analytics Cookies**\nWe use analytics cookies to understand how visitors interact with our website. This helps us improve our content, features, and overall user experience. These cookies collect information in an aggregated, anonymous form.\n\n**Marketing Cookies**\nThese cookies may be set through our site by our advertising partners. They may be used to build a profile of your interests and show you relevant advertisements on other sites. They do not directly store personal data but uniquely identify your browser and device.`,
    },
    {
        id: "managing",
        title: "3. Managing Your Cookies",
        content: `You have the right to decide whether to accept or reject cookies. You can manage your cookie preferences in several ways:\n\n**Browser Settings**\nMost web browsers allow you to control cookies through their settings. You can usually find these in the "Options" or "Preferences" menu. Common browsers:\n• Chrome: Settings → Privacy and Security → Cookies\n• Firefox: Settings → Privacy & Security → Cookies\n• Safari: Preferences → Privacy → Cookies\n• Edge: Settings → Privacy, Search and Services → Cookies\n\n**Opt-Out Links**\nYou can opt out of analytics cookies via:\n• Google Analytics: tools.google.com/dlpage/gaoptout\n\nPlease note that blocking certain cookies may impact your experience on our site, including the inability to log in or save your preferences.`,
    },
    {
        id: "third-party",
        title: "4. Third-Party Cookies",
        content: `Some cookies on our site are placed by third-party services that appear on our pages. We use the following third-party services that may set cookies:\n\n• **Google Analytics** — for website traffic analysis and user behavior insights\n• **Clerk** — for authentication and session management\n• **YouTube** — for embedded video content (when you play an embedded video)\n• **Social Media Platforms** — for social sharing buttons and embedded content\n\nWe do not control third-party cookies. Please refer to the respective third-party privacy policies for more information about their cookies.`,
    },
    {
        id: "updates",
        title: "5. Changes to This Policy",
        content: `We may update this Cookies Policy from time to time to reflect changes in technology, legislation, or our data practices. When we make changes, we will update the "Last updated" date at the top of this page.\n\nWe encourage you to review this policy periodically to stay informed about how we use cookies.`,
    },
    {
        id: "contact",
        title: "6. Contact Us",
        content: `If you have any questions about our use of cookies or this policy, please contact us:\n\n• Email: privacy@energdive.com\n• Address: Sector 12A, Dwarka, New Delhi 110075, India\n• Phone: +91 11 4544 4425`,
    },
];

export default function CookiesPage() {
    return (
        <>
            <Header />
            <main className="pt-32 pb-0 bg-white min-h-screen">

                {/* Hero */}
                <section className="border-b border-gray-100">
                    <div className="container mx-auto max-w-[1200px] px-6 lg:px-12 py-16">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${brandGreen}12` }}>
                                <Cookie size={20} style={{ color: brandGreen }} />
                            </div>
                            <span className="text-[11px] font-bold uppercase tracking-[2px] text-gray-400">Legal</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif font-bold text-zinc-900 mb-4">Cookies Policy</h1>
                        <p className="text-gray-500 text-lg">Last updated: {lastUpdated}</p>
                    </div>
                </section>

                {/* Content */}
                <section className="py-16">
                    <div className="container mx-auto max-w-[1200px] px-6 lg:px-12">
                        <div className="flex flex-col lg:flex-row gap-16">

                            {/* Sidebar ToC */}
                            <aside className="lg:w-72 shrink-0">
                                <div className="lg:sticky lg:top-40">
                                    <h3 className="text-[11px] font-bold uppercase tracking-[2px] text-gray-400 mb-4">Table of Contents</h3>
                                    <nav className="flex flex-col gap-1">
                                        {sections.map((s) => (
                                            <a
                                                key={s.id}
                                                href={`#${s.id}`}
                                                className="text-[13px] text-gray-500 hover:text-zinc-900 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors font-medium"
                                            >
                                                {s.title}
                                            </a>
                                        ))}
                                        <a
                                            href="#cookie-table"
                                            className="text-[13px] text-gray-500 hover:text-zinc-900 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors font-medium"
                                        >
                                            Cookie Reference Table
                                        </a>
                                    </nav>
                                    <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-[12px] text-gray-500 mb-2">Related policies:</p>
                                        <div className="flex flex-col gap-1.5">
                                            <Link href="/terms" className="text-[13px] font-medium hover:underline flex items-center gap-1" style={{ color: brandGreen }}>
                                                Terms & Conditions <ArrowRight size={12} />
                                            </Link>
                                            <Link href="/privacy" className="text-[13px] font-medium hover:underline flex items-center gap-1" style={{ color: brandGreen }}>
                                                Privacy Policy <ArrowRight size={12} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </aside>

                            {/* Main content */}
                            <div className="flex-1 min-w-0">
                                {sections.map((s) => (
                                    <div key={s.id} id={s.id} className="mb-12 scroll-mt-40">
                                        <h2 className="text-xl font-bold text-zinc-900 mb-4 pb-3 border-b border-gray-100">{s.title}</h2>
                                        <div className="text-[15px] text-gray-600 leading-[1.8] whitespace-pre-line">
                                            {s.content}
                                        </div>
                                    </div>
                                ))}

                                {/* Cookie Reference Table */}
                                <div id="cookie-table" className="mb-12 scroll-mt-40">
                                    <h2 className="text-xl font-bold text-zinc-900 mb-4 pb-3 border-b border-gray-100">Cookie Reference Table</h2>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-[13px]">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="text-left py-3 pr-4 font-bold text-zinc-900">Cookie Name</th>
                                                    <th className="text-left py-3 pr-4 font-bold text-zinc-900">Type</th>
                                                    <th className="text-left py-3 pr-4 font-bold text-zinc-900">Duration</th>
                                                    <th className="text-left py-3 font-bold text-zinc-900">Purpose</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {cookieTable.map((cookie) => (
                                                    <tr key={cookie.name} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                        <td className="py-3 pr-4 font-mono text-[12px]" style={{ color: brandGreen }}>{cookie.name}</td>
                                                        <td className="py-3 pr-4">
                                                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${cookie.type === "Essential" ? "bg-blue-50 text-blue-700" :
                                                                cookie.type === "Functional" ? "bg-purple-50 text-purple-700" :
                                                                    "bg-amber-50 text-amber-700"
                                                                }`}>
                                                                {cookie.type}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 pr-4 text-gray-500">{cookie.duration}</td>
                                                        <td className="py-3 text-gray-600">{cookie.purpose}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}
