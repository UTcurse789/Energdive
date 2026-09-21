"use client";

import { Mail } from "lucide-react";
import { BrevoNewsletterForm } from "@/components/shared/BrevoNewsletterForm";

export function SidebarNewsletterForm() {
    return (
        <div className="bg-slate-50/60 rounded-xl border border-slate-200 p-6 sm:p-8 shadow-md ring-1 ring-slate-100">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-5">
                <Mail size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Daily Energy Briefing</h3>
            <p className="text-sm text-slate-500 mb-6 font-light">
                Get the most critical energy news and market signals delivered directly to your inbox every morning.
            </p>

            <BrevoNewsletterForm variant="light" source="Sidebar Daily Briefing CTA (Brevo)" formId="sidebar" />

            <p className="text-[10px] text-slate-400 text-center mt-4">
                By subscribing, you agree to our Terms of Service & Privacy Policy.
            </p>
        </div>
    );
}
