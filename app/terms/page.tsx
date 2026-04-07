"use client";

import { Header } from "@/components/layout/header";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, ArrowRight } from "lucide-react";

const sections = [
    { id: "acceptance", title: "1. Acceptance of Terms" },
    { id: "changes", title: "2. Changes to Terms" },
    { id: "services", title: "3. About Our Services" },
    { id: "accounts", title: "4. User Accounts & Registration" },
    { id: "use", title: "5. Use of the Services" },
    { id: "ip", title: "6. Intellectual Property Rights" },
    { id: "ugc", title: "7. User-Generated Content" },
    { id: "thirdparty", title: "8. Third-Party Links & External Content" },
    { id: "accuracy", title: "9. Accuracy & Reliability" },
    { id: "ads", title: "10. Advertisements & Marketing" },
    { id: "payments", title: "11. Payments & Transactions" },
    { id: "termination", title: "12. Termination of Access" },
    { id: "warranties", title: "13. Disclaimer of Warranties" },
    { id: "liability", title: "14. Limitation of Liability" },
    { id: "indemnification", title: "15. Indemnification" },
    { id: "data-transfer", title: "16. Data Transfer & Cross-Platform Sharing" },
    { id: "governing", title: "17. Governing Law & Jurisdiction" },
    { id: "severability", title: "18. Severability" },
    { id: "entire", title: "19. Entire Agreement" },
    { id: "contact", title: "20. Contact Information" },
];

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#FDFDFD] font-sans text-zinc-900 selection:bg-[#00A651]/30">
            <Header />

            <main className="relative pt-[140px] pb-32">

                {/* HERO */}
                <section className="container mx-auto px-6 lg:px-12 mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-3xl"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center">
                                <FileText size={18} className="text-white" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Legal</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-zinc-900 leading-[0.95] mb-4">
                            Terms & <span className="text-[#00A651]">Conditions</span>
                        </h1>
                        <p className="text-zinc-500 text-lg">Last Updated: March 25, 2026</p>
                    </motion.div>
                </section>

                {/* CONTENT */}
                <section className="container mx-auto px-6 lg:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                        {/* SIDEBAR TOC */}
                        <aside className="lg:col-span-3 hidden lg:block">
                            <div className="sticky top-[180px]">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-4">Contents</p>
                                <nav className="space-y-1.5 border-l-2 border-zinc-100 pl-4">
                                    {sections.map((s) => (
                                        <a
                                            key={s.id}
                                            href={`#${s.id}`}
                                            className="block text-[12px] text-zinc-500 hover:text-[#00A651] transition-colors py-1 leading-snug"
                                        >
                                            {s.title}
                                        </a>
                                    ))}
                                </nav>
                            </div>
                        </aside>

                        {/* MAIN CONTENT */}
                        <div className="lg:col-span-9 prose prose-zinc prose-lg max-w-none">
                            <p className="text-lg text-zinc-600 leading-relaxed">
                                Welcome to energdive.com (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;). These Terms & Conditions (&quot;Terms&quot;, &quot;Agreement&quot;) govern your access to and use of the website www.energdive.com and any associated digital products, insights, content solutions, or services that reference these Terms (collectively, the &quot;Services&quot;).
                            </p>
                            <p className="text-lg text-zinc-600 leading-relaxed">
                                By accessing or using the Services, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree, please stop using the Services immediately.
                            </p>
                            <p className="text-lg text-zinc-600 leading-relaxed mb-12">
                                These Terms apply to all users, including visitors, registered users, contributors, and any person or entity accessing the Services.
                            </p>

                            <h2 id="acceptance" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">1. Acceptance of Terms</h2>
                            <p>By using the Services, you confirm that:</p>
                            <ul>
                                <li>You have the legal capacity to enter into this Agreement.</li>
                                <li>You are at least the minimum age required under applicable law in your jurisdiction.</li>
                                <li>Your use of the Services does not violate any applicable laws or regulations.</li>
                                <li>If you are using the Services on behalf of an organisation, you have authority to bind that organisation.</li>
                            </ul>

                            <h2 id="changes" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">2. Changes to Terms</h2>
                            <p>We may update or modify these Terms from time to time. When changes are made, we will update the effective date. Continued use of the Services constitutes acceptance of the revised Terms.</p>

                            <h2 id="services" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">3. About Our Services</h2>
                            <p>energdive.com provides digital content, analysis, insights, reports, articles, interviews, market intelligence, and related features focused on the energy and climate ecosystem.</p>
                            <p>We may update, modify, suspend, or discontinue any part of the Services at any time without notice.</p>

                            <h2 id="accounts" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">4. User Accounts & Registration</h2>
                            <p>By creating an account, you agree to:</p>
                            <ul>
                                <li>Provide accurate and complete information</li>
                                <li>Keep your login credentials secure</li>
                                <li>Not share your account with others</li>
                                <li>Notify us of any unauthorised access</li>
                            </ul>

                            <h2 id="use" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">5. Use of the Services</h2>
                            <p>You agree to use the Services lawfully. You must not:</p>
                            <ul>
                                <li>Engage in fraudulent or unlawful activities</li>
                                <li>Attempt unauthorised access</li>
                                <li>Disrupt website operations</li>
                                <li>Upload malware or harmful scripts</li>
                                <li>Commercially exploit content without permission</li>
                                <li>Use bots or scrapers without consent</li>
                                <li>Impersonate others</li>
                            </ul>

                            <h2 id="ip" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">6. Intellectual Property Rights</h2>
                            <p>All content on energdive.com is protected by copyright, trademark, and intellectual property laws. Unauthorised use may result in legal action.</p>

                            <h2 id="ugc" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">7. User-Generated Content</h2>
                            <p>By submitting content, you grant us a worldwide, royalty-free licence to use, reproduce, and distribute it.</p>

                            <h2 id="thirdparty" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">8. Third-Party Links & External Content</h2>
                            <p>Third-party links are provided for convenience only. We are not responsible for external content, policies, or practices.</p>

                            <h2 id="accuracy" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">9. Accuracy & Reliability</h2>
                            <p>While we strive for accuracy, we do not guarantee completeness or reliability. Users must independently verify information.</p>

                            <h2 id="ads" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">10. Advertisements & Marketing</h2>
                            <p>Advertisements may appear on the Services. We are not responsible for advertiser claims or offerings.</p>

                            <h2 id="payments" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">11. Payments & Transactions</h2>
                            <p>Payments are processed through third-party gateways. We do not store sensitive payment details.</p>

                            <h2 id="termination" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">12. Termination of Access</h2>
                            <p>We may suspend or terminate access if these Terms are violated or required by law.</p>

                            <h2 id="warranties" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">13. Disclaimer of Warranties</h2>
                            <p>Services are provided &quot;as is&quot; without warranties of any kind.</p>

                            <h2 id="liability" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">14. Limitation of Liability</h2>
                            <p>We are not liable for any direct or indirect damages arising from use of the Services.</p>

                            <h2 id="indemnification" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">15. Indemnification</h2>
                            <p>You agree to indemnify energdive.com against claims arising from misuse or violations.</p>

                            <h2 id="data-transfer" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">16. Data Transfer &amp; Cross-Platform Sharing</h2>
                            <p>By using the Services, you acknowledge and consent to the transfer of your personal data to third-party platforms as necessary for service delivery:</p>
                            <ul>
                                <li><strong>CRM Systems (Zoho CRM):</strong> Your registration data, membership details, community preferences, and engagement data are transferred to our CRM for lead management, membership services, and communications.</li>
                                <li><strong>Email Marketing (Brevo/Sendinblue):</strong> Your email address, name, and preference data are shared for newsletters, alerts, event notifications, and transactional emails.</li>
                                <li><strong>Analytics Platforms:</strong> Anonymised usage data and session information may be shared with analytics providers for performance measurement.</li>
                            </ul>
                            <p>For data sourced from third-party platforms (including but not limited to Backstage, TradeIndia, Meta Ads, and Google Ads):</p>
                            <ul>
                                <li>We maintain written Data Processing Agreements (DPAs) with each data source provider.</li>
                                <li>Third-party sourced data is clearly marked with its origin and is subject to re-consent before activation.</li>
                                <li>Platform-specific restrictions on data portability and usage are respected at all times.</li>
                                <li>You have the right to request details of any DPA under which your data was received.</li>
                            </ul>
                            <p>All cross-platform data transfers are conducted in compliance with the Digital Personal Data Protection (DPDP) Act, 2023 and with appropriate technical and organisational safeguards.</p>

                            <h2 id="governing" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">17. Governing Law &amp; Jurisdiction</h2>
                            <p>These Terms are governed by the laws of India, with jurisdiction in New Delhi.</p>

                            <h2 id="severability" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">18. Severability</h2>
                            <p>If any provision is invalid, remaining provisions remain effective.</p>

                            <h2 id="entire" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">19. Entire Agreement</h2>
                            <p>These Terms constitute the complete agreement between you and energdive.com.</p>

                            <h2 id="contact" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">20. Contact Information</h2>
                            <p>If you have questions about these Terms, contact us at <a href="mailto:legal@energdive.com" className="text-[#00A651] hover:underline">legal@energdive.com</a></p>

                            {/* CROSS LINKS */}
                            <div className="mt-16 pt-8 border-t border-zinc-200 not-prose">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-4">Related Policies</p>
                                <div className="flex flex-wrap gap-3">
                                    <Link href="/privacy" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-zinc-600 hover:text-[#00A651] transition-colors border border-zinc-200 px-4 py-2 rounded-lg">
                                        Privacy Policy <ArrowRight size={12} />
                                    </Link>
                                    <Link href="/data-retention" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-zinc-600 hover:text-[#00A651] transition-colors border border-zinc-200 px-4 py-2 rounded-lg">
                                        Data Retention Policy <ArrowRight size={12} />
                                    </Link>
                                    <Link href="/cookies" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-zinc-600 hover:text-[#00A651] transition-colors border border-zinc-200 px-4 py-2 rounded-lg">
                                        Cookies Policy <ArrowRight size={12} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
}
