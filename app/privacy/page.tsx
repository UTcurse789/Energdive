"use client";

import { Header } from "@/components/layout/header";
import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, ArrowRight } from "lucide-react";

const sections = [
    { id: "collect", title: "1. What information do we collect?" },
    { id: "lead-sources", title: "2. Data collection by source" },
    { id: "how-use", title: "3. How and why do we use it?" },
    { id: "sharing", title: "4. Sharing your personal information" },
    { id: "dpa", title: "5. Data Processing Agreements" },
    { id: "cookies", title: "6. Cookies and tracking technologies" },
    { id: "retention", title: "7. Data retention" },
    { id: "security", title: "8. Data security" },
    { id: "rights", title: "9. Your rights and choices" },
    { id: "transfers", title: "10. International data transfers" },
    { id: "children", title: "11. Children\u2019s privacy" },
    { id: "dpo", title: "12. Data Protection Officer" },
    { id: "changes", title: "13. Changes to this policy" },
    { id: "contact", title: "14. Contact us" },
];

export default function PrivacyPage() {
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
                                <Shield size={18} className="text-white" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Legal</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-zinc-900 leading-[0.95] mb-4">
                            Privacy <span className="text-[#00A651]">Policy</span>
                        </h1>
                        <p className="text-zinc-500 text-lg">Effective Date: March 25, 2026 &middot; Version v2.1</p>
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
                                We at energdive.com (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, share, and protect your personal information when you access or use our website www.energdive.com and related services.
                            </p>
                            <p className="text-lg text-zinc-600 leading-relaxed">
                                By using our Services, you agree to the practices described in this Privacy Policy. If you do not agree, please do not use the Services.
                            </p>
                            <p className="text-lg text-zinc-600 leading-relaxed mb-12">
                                Links from our Services may lead to external websites not covered by this Privacy Policy. We are not responsible for their privacy practices.
                            </p>

                            {/* SECTION 1 */}
                            <h2 id="collect" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">1. What information do we collect about you and how do we collect it?</h2>

                            <h3 className="text-xl font-bold text-zinc-800 mt-8 mb-3">1.1 Information you provide directly</h3>
                            <p>We may collect personal information when you:</p>
                            <ul>
                                <li>Create or manage an account on energdive.com</li>
                                <li>Fill out forms or submit information</li>
                                <li>Request access to insights, reports, or content</li>
                                <li>Subscribe to newsletters or alerts</li>
                                <li>Participate in surveys, feedback, or promotions</li>
                                <li>Communicate with us via email or contact forms</li>
                            </ul>
                            <p>This may include:</p>
                            <ul>
                                <li><strong>Identity details:</strong> name, title, organisation, industry, country</li>
                                <li><strong>Contact details:</strong> email, phone number, postal address</li>
                                <li><strong>Account information:</strong> username, preferences, settings</li>
                                <li><strong>Communication data:</strong> queries, feedback, correspondence</li>
                                <li><strong>Marketing preferences:</strong> newsletter and alert choices</li>
                            </ul>

                            <h3 className="text-xl font-bold text-zinc-800 mt-8 mb-3">1.2 Payment and transaction information</h3>
                            <p>Payment details are processed by authorised payment gateways. We receive limited transaction data for billing, access, and record-keeping. Full card details are not stored by energdive.com.</p>

                            <h3 className="text-xl font-bold text-zinc-800 mt-8 mb-3">1.3 Information collected automatically</h3>
                            <ul>
                                <li>Pages visited, content viewed, navigation patterns</li>
                                <li>IP address, approximate location, time zone</li>
                                <li>Device and browser information</li>
                                <li>Session duration and technical logs</li>
                            </ul>

                            {/* SECTION 2 — LEAD SOURCES */}
                            <h2 id="lead-sources" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">2. Data collection by source</h2>
                            <p>We collect personal data from multiple sources. Each source has distinct consent and processing requirements:</p>

                            <h3 className="text-xl font-bold text-zinc-800 mt-8 mb-3">2.1 Show Lead Forms (Own Portal)</h3>
                            <p>When you register directly on our portal (energdive.com), we collect your information through our registration and onboarding forms. This represents direct, first-party data collection.</p>
                            <ul>
                                <li>A mandatory checkbox confirms your acceptance of these Terms and Privacy Policy</li>
                                <li>Your consent timestamp and IP address are recorded</li>
                                <li>The exact consent text shown to you is stored as a snapshot</li>
                            </ul>

                            <h3 className="text-xl font-bold text-zinc-800 mt-8 mb-3">2.2 Ad Lead Forms (Meta/Google Ads)</h3>
                            <p>Data may be collected through advertising platforms such as Meta Lead Ads or Google Ads lead forms. When collected this way:</p>
                            <ul>
                                <li>We obtain a second layer of consent via a welcome/verification email</li>
                                <li>Each lead is linked to its originating campaign ID</li>
                                <li>Platform-specific terms may limit how your data can be used or transferred</li>
                                <li>Double opt-in (email verification) is required before activation</li>
                            </ul>

                            <h3 className="text-xl font-bold text-zinc-800 mt-8 mb-3">2.3 Third-Party Platforms (Backstage, TradeIndia, etc.)</h3>
                            <p>Data sourced from third-party platforms (B2B platforms, event platforms, etc.) is handled with additional safeguards:</p>
                            <ul>
                                <li>All third-party data is marked with its external source origin</li>
                                <li>Re-consent is required before your data is activated in our systems</li>
                                <li>A valid Data Processing Agreement (DPA) is maintained with each third-party provider</li>
                                <li>The DPA reference is stored alongside your consent record</li>
                            </ul>

                            {/* SECTION 3 */}
                            <h2 id="how-use" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">3. How and why do we use your personal information?</h2>

                            <h3 className="text-xl font-bold text-zinc-800 mt-8 mb-3">3.1 To provide and manage services</h3>
                            <ul>
                                <li>Account creation and management</li>
                                <li>Providing access to content and insights</li>
                                <li>Responding to queries and support requests</li>
                                <li>Website performance and maintenance</li>
                            </ul>

                            <h3 className="text-xl font-bold text-zinc-800 mt-8 mb-3">3.2 Communications and marketing</h3>
                            <p>We may send newsletters, alerts, and updates you opt into. You may unsubscribe at any time.</p>

                            {/* SECTION 4 */}
                            <h2 id="sharing" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">4. Sharing your personal information</h2>
                            <p>We do not sell your personal data. Information may be shared with:</p>
                            <ul>
                                <li><strong>CRM platforms</strong> (Zoho CRM) for lead management and member services</li>
                                <li><strong>Email marketing platforms</strong> (Brevo/Sendinblue) for communications</li>
                                <li><strong>Analytics partners</strong> for website performance measurement</li>
                                <li><strong>Legal authorities</strong> where required by law</li>
                            </ul>
                            <p>All data sharing is governed by Data Processing Agreements and complies with the DPDP Act.</p>

                            {/* SECTION 5 — DPA */}
                            <h2 id="dpa" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">5. Data Processing Agreements</h2>
                            <p>We maintain written Data Processing Agreements (DPAs) with all third-party platforms from which we receive user data. These agreements specify:</p>
                            <ul>
                                <li>The purpose and scope of data processing</li>
                                <li>Security measures and safeguards in place</li>
                                <li>Sub-processor disclosure obligations</li>
                                <li>Data breach notification procedures</li>
                                <li>Data deletion and return obligations upon termination</li>
                            </ul>
                            <p>Current DPA partners include Backstage and TradeIndia. Users whose data originates from these platforms will be clearly informed of the third-party source.</p>

                            {/* SECTION 6 */}
                            <h2 id="cookies" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">6. Cookies and tracking technologies</h2>
                            <ul>
                                <li>Essential cookies for functionality</li>
                                <li>Analytics cookies for performance measurement</li>
                                <li>Advertising cookies for campaign optimisation</li>
                            </ul>

                            {/* SECTION 7 — EXPANDED RETENTION */}
                            <h2 id="retention" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">7. Data retention</h2>
                            <p>We retain your personal data only as long as necessary for the purposes set out in this policy. Our retention schedule:</p>
                            <ul>
                                <li><strong>Active user profiles:</strong> Retained while your account is active, plus 12 months after deactivation</li>
                                <li><strong>Consent records:</strong> Retained for 7 years as required for legal compliance and audit trails</li>
                                <li><strong>Marketing engagement data:</strong> Retained for 24 months from your last interaction</li>
                                <li><strong>Third-party sourced data:</strong> Subject to terms of the applicable Data Processing Agreement</li>
                                <li><strong>System and security logs:</strong> Retained for 12 months</li>
                            </ul>
                            <p>After the retention period, data is securely deleted or anonymised. For full details, see our <a href="/data-retention" className="text-[#00A651] hover:underline">Data Retention Policy</a>.</p>

                            {/* SECTION 8 */}
                            <h2 id="security" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">8. Data security</h2>
                            <p>We use technical and organisational safeguards to protect your data, including encryption in transit and at rest, access controls, and regular security audits. However, no online transmission is fully secure.</p>

                            {/* SECTION 9 */}
                            <h2 id="rights" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">9. Your rights and choices</h2>
                            <p>Under the Digital Personal Data Protection (DPDP) Act, 2023, you have the right to:</p>
                            <ul>
                                <li>Access and obtain a copy of your personal data</li>
                                <li>Correct inaccurate or incomplete data</li>
                                <li>Request deletion (erasure) of your data</li>
                                <li>Restrict or object to certain processing activities</li>
                                <li>Withdraw your consent at any time</li>
                                <li>Data portability where applicable</li>
                                <li>Lodge a grievance with our Data Protection Officer</li>
                            </ul>
                            <p>To exercise any of these rights, contact our Data Protection Officer at <a href="mailto:dpo@energdive.com" className="text-[#00A651] hover:underline">dpo@energdive.com</a>.</p>

                            {/* SECTION 10 */}
                            <h2 id="transfers" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">10. International data transfers</h2>
                            <p>Your data may be processed outside your jurisdiction with appropriate safeguards, including data processing agreements with all receiving parties.</p>

                            {/* SECTION 11 */}
                            <h2 id="children" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">11. Children&apos;s privacy</h2>
                            <p>Our services are not intended for children below 18 years. We do not knowingly collect their data. If you become aware that a child has provided us with personal data, please contact us immediately.</p>

                            {/* SECTION 12 — DPO */}
                            <h2 id="dpo" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">12. Data Protection Officer</h2>
                            <p>We have designated a Data Protection Officer (DPO) responsible for overseeing data protection strategy and compliance. You may contact the DPO for any data-related queries or to exercise your rights:</p>
                            <ul>
                                <li><strong>Email:</strong> <a href="mailto:dpo@energdive.com" className="text-[#00A651] hover:underline">dpo@energdive.com</a></li>
                                <li><strong>Address:</strong> Data Protection Officer, EnergyClub / energdive.com, New Delhi, India</li>
                            </ul>

                            {/* SECTION 13 */}
                            <h2 id="changes" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">13. Changes to this policy</h2>
                            <p>We may update this policy periodically. Changes will be reflected with an updated effective date and consent version. Users will be notified of material changes via email.</p>

                            {/* SECTION 14 */}
                            <h2 id="contact" className="text-2xl font-black text-zinc-900 mt-12 mb-4 scroll-mt-[200px]">14. Contact us</h2>
                            <p>For privacy-related queries, reach us at <a href="mailto:legal@energdive.com" className="text-[#00A651] hover:underline">legal@energdive.com</a></p>

                            {/* CROSS LINKS */}
                            <div className="mt-16 pt-8 border-t border-zinc-200 not-prose">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-4">Related Policies</p>
                                <div className="flex flex-wrap gap-3">
                                    <Link href="/terms" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-zinc-600 hover:text-[#00A651] transition-colors border border-zinc-200 px-4 py-2 rounded-lg">
                                        Terms & Conditions <ArrowRight size={12} />
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
