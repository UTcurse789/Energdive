"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Mail, LogIn } from "lucide-react";
import { useAuthModal } from "@/hooks/use-auth-modal";

export function SubscriptionsCTASection() {
  const { openAuthModal } = useAuthModal();

  return (
    <section className="bg-white py-10 lg:py-12 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-5 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">

          {/* CTA 1: Login CTA */}
          <div className="relative overflow-hidden bg-slate-50/80 border border-slate-200/90 p-6 sm:p-8 rounded-2xl shadow-xs flex flex-col justify-between group hover:border-emerald-500/50 hover:bg-slate-50 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-200 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800 mb-4">
                <LogIn className="w-3.5 h-3.5 text-emerald-700" />
                Member Access
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight tracking-tight mb-3">
                Login to ENERGClub
              </h3>

              <p className="text-sm text-slate-600 leading-relaxed font-normal mb-6">
                Sign in to access your subscriptions, saved intelligence reports, executive digests, and premium portal features.
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={() => openAuthModal("/dashboard")}
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.16em] rounded-xl transition-all shadow-xs hover:shadow-md group/btn cursor-pointer"
              >
                Log In To Your Account
                <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
              </button>
            </div>
          </div>

          {/* CTA 2: Print Subscription */}
          <div className="relative overflow-hidden bg-slate-50/80 border border-slate-200/90 p-6 sm:p-8 rounded-2xl shadow-xs flex flex-col justify-between group hover:border-emerald-500/50 hover:bg-slate-50 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-200 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800 mb-4">
                <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                Print Edition
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight tracking-tight mb-3">
                Subscribe to ENERGDIVE Magazine
              </h3>

              <p className="text-sm text-slate-600 leading-relaxed font-normal mb-6">
                Get in-depth sector intelligence, expert commentary, and comprehensive monthly market analysis delivered straight to your desk or organization.
              </p>
            </div>

            <div>
              <Link
                href="/subscribe"
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-[0.16em] rounded-xl transition-all shadow-xs hover:shadow-md group/btn"
              >
                Subscribe Print Edition
                <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* CTA 3: Newsletter Subscription */}
          <div className="relative overflow-hidden bg-slate-50/80 border border-slate-200/90 p-6 sm:p-8 rounded-2xl shadow-xs flex flex-col justify-between group hover:border-emerald-500/50 hover:bg-slate-50 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-all" />

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100/80 border border-teal-200 text-[10px] font-black uppercase tracking-[0.2em] text-teal-800 mb-4">
                <Mail className="w-3.5 h-3.5 text-teal-700" />
                Daily & Weekly Briefings
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight tracking-tight mb-3">
                Join ENERGDIVE Newsletter
              </h3>

              <p className="text-sm text-slate-600 leading-relaxed font-normal mb-6">
                Stay updated with breaking energy news, policy insights, and exclusive executive digests directly in your email inbox every morning.
              </p>
            </div>

            <div>
              <Link
                href="/newsletter"
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-slate-900 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.16em] rounded-xl transition-all shadow-xs hover:shadow-md group/btn"
              >
                Join Newsletter Free
                <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
