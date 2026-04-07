"use client";

import { Header } from "@/components/layout/header";
import Link from "next/link";
import { motion } from "framer-motion";
import { Database, ArrowRight } from "lucide-react";

export default function DataRetentionPage() {
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
                                <Database size={18} className="text-white" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Legal</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-zinc-900 leading-[0.95] mb-4">
                            Data Retention <span className="text-[#00A651]">Policy</span>
                        </h1>
                        <p className="text-zinc-500 text-lg">Effective Date: March 25, 2026 &middot; Version v1.0</p>
                    </motion.div>
                </section>

                {/* CONTENT */}
                <section className="container mx-auto px-6 lg:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                        
                        {/* MAIN CONTENT */}
                        <div className="lg:col-span-8 prose prose-zinc prose-lg max-w-none">
                            <p className="text-lg text-zinc-600 leading-relaxed">
                                This Data Retention Policy explains how long energdive.com (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) keeps the personal information we collect and the criteria we use to determine those retention periods. This policy complements our <a href="/privacy" className="text-[#00A651] hover:underline">Privacy Policy</a> and forms part of our compliance with the Digital Personal Data Protection (DPDP) Act, 2023.
                            </p>
                            
                            <h2 className="text-2xl font-black text-zinc-900 mt-12 mb-4">1. Core Principles</h2>
                            <p>We adhere to the principle of data minimisation. We only retain personal data for as long as it is necessary to fulfil the purposes for which it was collected, or as required to comply with our legal obligations, resolve disputes, and enforce our agreements.</p>

                            <h2 className="text-2xl font-black text-zinc-900 mt-12 mb-4">2. Retention Schedule by Data Category</h2>
                            
                            <div className="not-prose mt-6">
                                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-zinc-50 border-b border-zinc-200">
                                            <tr>
                                                <th className="px-6 py-4 font-bold text-zinc-900">Data Category</th>
                                                <th className="px-6 py-4 font-bold text-zinc-900">Retention Period</th>
                                                <th className="px-6 py-4 font-bold text-zinc-900">Rationale</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-200">
                                            <tr>
                                                <td className="px-6 py-4 font-medium text-zinc-900">Active User Profiles</td>
                                                <td className="px-6 py-4 text-zinc-600">While account is active + 12 months after deactivation</td>
                                                <td className="px-6 py-4 text-zinc-600">To provide continued service, allow account recovery, and handle post-termination queries.</td>
                                            </tr>
                                            <tr className="bg-zinc-50/50">
                                                <td className="px-6 py-4 font-medium text-zinc-900">Consent Records &amp; Audits</td>
                                                <td className="px-6 py-4 text-zinc-600">7 years from the date of consent withdrawal</td>
                                                <td className="px-6 py-4 text-zinc-600">Legal proof of compliance with data protection regulations (DPDP Act).</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 font-medium text-zinc-900">Marketing &amp; Engagement Data</td>
                                                <td className="px-6 py-4 text-zinc-600">24 months from your last interaction</td>
                                                <td className="px-6 py-4 text-zinc-600">To measure campaign effectiveness and tailor relevant content.</td>
                                            </tr>
                                            <tr className="bg-zinc-50/50">
                                                <td className="px-6 py-4 font-medium text-zinc-900">Third-Party Sourced Data</td>
                                                <td className="px-6 py-4 text-zinc-600">As specified in the applicable Data Processing Agreement (DPA)</td>
                                                <td className="px-6 py-4 text-zinc-600">Compliance with specific contractual obligations with partners (e.g., TradeIndia, Backstage).</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 font-medium text-zinc-900">System Logs &amp; IP Addresses</td>
                                                <td className="px-6 py-4 text-zinc-600">12 months</td>
                                                <td className="px-6 py-4 text-zinc-600">For security monitoring, fraud prevention, and technical diagnostics.</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <h2 className="text-2xl font-black text-zinc-900 mt-12 mb-4">3. Data Sourced from Third Parties</h2>
                            <p>For individuals whose data was provided to us by third-party platforms (such as exhibition organisers or B2B directories), the retention of your data prior to your direct registration on our platform is governed by the specific Data Processing Agreement (DPA) we hold with that third party. However, once you register directly, the retention periods for <strong>Active User Profiles</strong> will apply.</p>

                            <h2 className="text-2xl font-black text-zinc-900 mt-12 mb-4">4. Deletion and Anonymisation</h2>
                            <p>Once the retention period for a data category has expired, we will securely delete or irreversibly anonymise the data. Anonymised data is no longer considered personal data because it cannot be linked back to you, and we may retain it indefinitely for statistical and analytical purposes.</p>

                            <h2 className="text-2xl font-black text-zinc-900 mt-12 mb-4">5. Early Deletion Requests</h2>
                            <p>You have the right to request the early deletion of your personal data under the DPDP Act. If you submit a valid deletion request, we will erase your data unless we are legally obligated or otherwise permitted to retain it (e.g., for unresolved disputes or to maintain our consent suppression list). Our immutable consent logs are excluded from early deletion to serve as legal proof of our compliance.</p>
                            
                            <h2 className="text-2xl font-black text-zinc-900 mt-12 mb-4">6. Contact Information</h2>
                            <p>To ask questions about this policy or to request data deletion, please contact our Data Protection Officer at:</p>
                            <ul>
                                <li><strong>Email:</strong> <a href="mailto:dpo@energdive.com" className="text-[#00A651] hover:underline">dpo@energdive.com</a></li>
                                <li><strong>Address:</strong> Data Protection Officer, EnergyClub / energdive.com, New Delhi, India</li>
                            </ul>

                            {/* CROSS LINKS */}
                            <div className="mt-16 pt-8 border-t border-zinc-200 not-prose">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-4">Related Policies</p>
                                <div className="flex flex-wrap gap-3">
                                    <Link href="/privacy" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-zinc-600 hover:text-[#00A651] transition-colors border border-zinc-200 px-4 py-2 rounded-lg">
                                        Privacy Policy <ArrowRight size={12} />
                                    </Link>
                                    <Link href="/terms" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-zinc-600 hover:text-[#00A651] transition-colors border border-zinc-200 px-4 py-2 rounded-lg">
                                        Terms & Conditions <ArrowRight size={12} />
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
