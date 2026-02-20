"use client";

import { Mail, ArrowRight } from "lucide-react";

const ZOHO_FORM_URL =
    "https://forms.zohopublic.in/itenmedia1/form/ENERGDIVEMagazineSubscriptionForm/formperma/CX7ORe1WkKQKOFusFv-6rEvYHtqmvqW9P4pP5XHOIGo";

export function SidebarSubscribe() {
    return (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6 text-white shadow-2xl">
            {/* Decorative accents */}
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-teal-500/20 blur-2xl" />
            <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-emerald-500/15 blur-2xl" />

            <div className="relative z-10">
                <div className="mb-1 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-teal-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-400">
                        Daily Updates
                    </span>
                </div>

                <h3 className="mb-2 font-serif text-xl font-bold leading-tight">
                    Stay Ahead of the Curve
                </h3>

                <p className="mb-6 text-sm leading-relaxed text-gray-400">
                    Get exclusive energy insights, market analysis, and expert commentary
                    delivered to your inbox.
                </p>

                <a
                    href={ZOHO_FORM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-teal-500/25 transition-all duration-300 hover:shadow-teal-500/40 hover:brightness-110 active:scale-[0.98]"
                >
                    Subscribe Now
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>

                <p className="mt-4 text-center text-[10px] text-gray-500">
                    Free • No spam • Unsubscribe anytime
                </p>
            </div>
        </div>
    );
}