"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
    content: `If you have any questions about our use of cookies or this Cookies Policy, please contact us at legal@energdive.com.\n\nYou may also review our Privacy Policy and Terms & Conditions for more information about how we collect, use, and protect your information.`,
  },
];

function renderFormattedContent(content: string) {
  return content.split("\n\n").map((paragraph, index) => {
    if (paragraph.startsWith("**") && paragraph.includes("**\n")) {
      const [heading, ...rest] = paragraph.split("\n");
      return (
        <div key={index} className="mb-6 last:mb-0">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-zinc-800">
            {heading.replace(/\*\*/g, "")}
          </p>
          <p className="leading-8 text-zinc-600 whitespace-pre-line">{rest.join("\n")}</p>
        </div>
      );
    }

    return (
      <p key={index} className="mb-6 leading-8 text-zinc-600 whitespace-pre-line last:mb-0">
        {paragraph}
      </p>
    );
  });
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-zinc-900 selection:bg-[#00A651]/20">
      <main className="relative overflow-hidden pb-28 pt-[140px]">
        <div className="absolute inset-x-0 top-0 -z-10 h-[320px] bg-gradient-to-b from-[#00A651]/[0.06] via-transparent to-transparent" />

        <section className="container mx-auto mb-16 px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm">
                <Cookie size={18} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Legal</span>
            </div>

            <h1 className="mb-4 text-5xl font-black leading-[0.95] text-zinc-900 md:text-6xl">
              Cookies <span style={{ color: brandGreen }}>Policy</span>
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-zinc-500">
              Learn which cookies EnergDive uses, why we use them, and how you can manage your preferences across the site.
            </p>
            <p className="mt-4 text-sm font-medium text-zinc-400">Last updated: {lastUpdated}</p>
          </motion.div>
        </section>

        <section className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <aside className="hidden lg:col-span-3 lg:block">
              <div className="sticky top-[180px] rounded-3xl border border-zinc-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.04)]">
                <p className="mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Contents</p>
                <nav className="space-y-1.5 border-l-2 border-zinc-100 pl-4">
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="block py-1 text-[12px] leading-snug text-zinc-500 transition-colors hover:text-[#00A651]"
                    >
                      {section.title}
                    </a>
                  ))}
                  <a
                    href="#cookie-table"
                    className="block py-1 text-[12px] leading-snug text-zinc-500 transition-colors hover:text-[#00A651]"
                  >
                    Cookie Reference Table
                  </a>
                </nav>

                <div className="mt-8 rounded-2xl bg-zinc-50 p-4">
                  <p className="mb-3 text-[10px] font-black uppercase tracking-[0.26em] text-zinc-400">Related Policies</p>
                  <div className="space-y-2">
                    <Link href="/privacy" className="flex items-center gap-1.5 text-[13px] font-semibold text-zinc-700 transition-colors hover:text-[#00A651]">
                      Privacy Policy <ArrowRight size={12} />
                    </Link>
                    <Link href="/terms" className="flex items-center gap-1.5 text-[13px] font-semibold text-zinc-700 transition-colors hover:text-[#00A651]">
                      Terms & Conditions <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            </aside>

            <div className="lg:col-span-9">
              <div className="rounded-[32px] border border-zinc-200 bg-white p-8 shadow-[0_30px_80px_rgba(0,0,0,0.05)] md:p-10 lg:p-12">
                <div className="mb-12 rounded-2xl border border-[#00A651]/15 bg-[#00A651]/[0.05] p-5">
                  <p className="text-sm leading-7 text-zinc-600">
                    This page explains our use of essential, functional, analytics, and marketing cookies. Some cookies are required for core website functionality, while others help us improve content, performance, and personalization.
                  </p>
                </div>

                {sections.map((section) => (
                  <section key={section.id} id={section.id} className="mb-12 scroll-mt-[180px] last:mb-0">
                    <h2 className="mb-4 border-b border-zinc-100 pb-3 text-2xl font-black text-zinc-900">
                      {section.title}
                    </h2>
                    <div className="text-[15px]">{renderFormattedContent(section.content)}</div>
                  </section>
                ))}

                <section id="cookie-table" className="mt-14 scroll-mt-[180px]">
                  <h2 className="mb-4 border-b border-zinc-100 pb-3 text-2xl font-black text-zinc-900">
                    Cookie Reference Table
                  </h2>
                  <div className="overflow-hidden rounded-3xl border border-zinc-200">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="bg-zinc-50">
                          <tr>
                            <th className="px-5 py-4 font-bold text-zinc-900">Cookie Name</th>
                            <th className="px-5 py-4 font-bold text-zinc-900">Type</th>
                            <th className="px-5 py-4 font-bold text-zinc-900">Duration</th>
                            <th className="px-5 py-4 font-bold text-zinc-900">Purpose</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cookieTable.map((cookie) => (
                            <tr key={cookie.name} className="border-t border-zinc-100 align-top">
                              <td className="px-5 py-4 font-mono text-[12px] font-semibold" style={{ color: brandGreen }}>
                                {cookie.name}
                              </td>
                              <td className="px-5 py-4">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                    cookie.type === "Essential"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : cookie.type === "Functional"
                                        ? "bg-violet-50 text-violet-700"
                                        : "bg-amber-50 text-amber-700"
                                  }`}
                                >
                                  {cookie.type}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-zinc-500">{cookie.duration}</td>
                              <td className="px-5 py-4 leading-7 text-zinc-600">{cookie.purpose}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
