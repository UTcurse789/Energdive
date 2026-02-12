import { ISSUES } from "@/data/dummy";
import { IssueCard } from "@/components/ui/issue-card";
import { SectionHeading } from "@/components/ui/section-heading";

export default function IssuesPage() {
    return (
        <main className="min-h-screen bg-slate-50 pt-32 pb-20">
            <div className="container mx-auto px-4">
                <div className="max-w-3xl mb-16">
                    <SectionHeading title="Magazine Issues - Archives" />
                    <p className="text-lg text-slate-600 mt-4 italic font-serif leading-relaxed">
                        Explore our deep-dive reports and monthly magazine editions covering the global energy landscape, transition strategies, and market intelligence.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {ISSUES.map((issue) => (
                        <IssueCard key={issue.id} issue={issue} />
                    ))}
                </div>

                {/* Newsletter Section */}
                <div className="mt-32 p-12 rounded-3xl bg-linear-to-br from-teal-50 to-blue-50 border border-slate-200 relative overflow-hidden shadow-sm">
                    <div className="relative z-10 max-w-2xl">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4 font-serif">
                            Subscribe to Energdive Magazine
                        </h2>
                        <p className="text-slate-600 mb-8 text-lg">
                            Get the latest issues delivered directly to your inbox. Join 50,000+ energy professionals.
                        </p>
                        <form className="flex flex-col sm:flex-row gap-4">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="grow bg-white border border-slate-200 rounded-xl px-6 py-4 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-teal-500 transition-colors shadow-xs"
                                required
                            />
                            <button className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-10 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg">
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
}
