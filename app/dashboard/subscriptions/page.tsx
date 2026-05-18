"use client";

import { useState } from "react";
import {
    Crown, Check, Star, Zap, Shield, BookOpen, Users, Headphones,
    ArrowRight, ExternalLink,
} from "lucide-react";
import { useDashboard } from "@/components/dashboard/dashboard-shell";

const PLANS = [
    {
        id: "free",
        name: "Free",
        price: "₹0",
        period: "forever",
        description: "Basic access to energy news and insights",
        icon: BookOpen,
        color: "#71717A",
        features: [
            "Access to free articles & news",
            "Community discussions (read-only)",
            "Weekly newsletter",
            "Basic sector updates",
        ],
        cta: "Current Plan",
        current: true,
    },
    {
        id: "pro",
        name: "Professional",
        price: "₹1,999",
        period: "/month",
        description: "For energy professionals who need deeper insights",
        icon: Zap,
        color: "#C9A84C",
        popular: true,
        features: [
            "Everything in Free",
            "Full article & report access",
            "Early Access Intelligence",
            "Community discussions (post & comment)",
            "Sector-specific alerts",
            "Monthly expert webinars",
            "ENERGDIVE Magazine (digital)",
        ],
        cta: "Coming Soon",
        current: false,
    },
    {
        id: "enterprise",
        name: "Enterprise",
        price: "Custom",
        period: "",
        description: "For organizations needing team-wide access",
        icon: Shield,
        color: "#2196F3",
        features: [
            "Everything in Professional",
            "Multi-user team access",
            "Custom data feeds & APIs",
            "Dedicated account manager",
            "Executive briefings",
            "Event priority access",
            "ENERGDIVE Magazine (print + digital)",
            "White-label reports",
        ],
        cta: "Coming Soon",
        current: false,
    },
];

export default function SubscriptionsPage() {
    const { profile } = useDashboard();
    const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

    return (
        <div className="animate-fade-in-up">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg" style={{ background: "rgba(201,168,76,0.15)" }}>
                        <Crown size={22} style={{ color: "var(--dash-accent)" }} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: "var(--dash-text)" }}>
                            Subscriptions
                        </h1>
                        <p className="text-sm" style={{ color: "var(--dash-text-dim)" }}>
                            Choose a plan that fits your energy intelligence needs
                        </p>
                    </div>
                </div>
            </div>

            {/* Blurred content + Coming Soon overlay */}
            <div className="relative">
                {/* Blurred background content */}
                <div className="select-none pointer-events-none" style={{ filter: "blur(6px)", opacity: 0.5 }}>
                    {/* Billing toggle */}
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <button
                            className="px-4 py-2 rounded-lg text-sm font-semibold"
                            style={{ background: "var(--dash-accent)", color: "#0A0A0B" }}
                        >
                            Monthly
                        </button>
                        <button
                            className="px-4 py-2 rounded-lg text-sm font-semibold relative"
                            style={{ color: "var(--dash-text-muted)" }}
                        >
                            Annual
                            <span
                                className="absolute -top-2 -right-8 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: "rgba(76,175,80,0.2)", color: "#4CAF50" }}
                            >
                                -20%
                            </span>
                        </button>
                    </div>

                    {/* Plans Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
                        {PLANS.map((plan) => {
                            const Icon = plan.icon;
                            return (
                                <div
                                    key={plan.id}
                                    className="rounded-xl p-6 relative"
                                    style={{
                                        background: "var(--dash-card)",
                                        border: plan.popular
                                            ? "2px solid var(--dash-accent)"
                                            : "1px solid var(--dash-border)",
                                    }}
                                >
                                    {plan.popular && (
                                        <div
                                            className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                                            style={{ background: "var(--dash-accent)", color: "#0A0A0B" }}
                                        >
                                            <Star size={10} /> Most Popular
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 mb-4 mt-2">
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                                            style={{ background: `${plan.color}20` }}
                                        >
                                            <Icon size={20} style={{ color: plan.color }} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg" style={{ color: "var(--dash-text)" }}>{plan.name}</h3>
                                            <p className="text-[11px]" style={{ color: "var(--dash-text-dim)" }}>{plan.description}</p>
                                        </div>
                                    </div>
                                    <div className="mb-5">
                                        <span className="text-3xl font-black" style={{ color: "var(--dash-text)" }}>{plan.price}</span>
                                        {plan.period && (
                                            <span className="text-sm ml-1" style={{ color: "var(--dash-text-dim)" }}>{plan.period}</span>
                                        )}
                                    </div>
                                    <ul className="space-y-2.5 mb-6">
                                        {plan.features.map((f, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm">
                                                <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: plan.popular ? "var(--dash-accent)" : "#4CAF50" }} />
                                                <span style={{ color: "var(--dash-text-muted)" }}>{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <button
                                        className="w-full py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                                        style={
                                            plan.current
                                                ? { background: "var(--dash-surface-2)", color: "var(--dash-text-dim)" }
                                                : plan.popular
                                                    ? { background: "var(--dash-accent)", color: "#0A0A0B" }
                                                    : { background: "var(--dash-surface-2)", color: "var(--dash-text)", border: "1px solid var(--dash-border)" }
                                        }
                                    >
                                        {plan.current ? (
                                            <><Check size={14} /> Current Plan</>
                                        ) : plan.id === "enterprise" ? (
                                            <>{plan.cta} <ExternalLink size={13} /></>
                                        ) : (
                                            <>{plan.cta} <ArrowRight size={13} /></>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Coming Soon Overlay Card */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div
                        className="rounded-2xl px-10 py-10 flex flex-col items-center text-center shadow-2xl max-w-sm w-full"
                        style={{
                            background: "var(--dash-card)",
                            border: "1px solid var(--dash-border)",
                            boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
                        }}
                    >
                        {/* Lock icon */}
                        <div
                            className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
                            style={{ background: "rgba(201,168,76,0.12)" }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="26"
                                height="26"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ color: "var(--dash-accent)" }}
                            >
                                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </div>

                        {/* Title */}
                        <h2 className="text-xl font-black uppercase tracking-wide mb-2" style={{ color: "var(--dash-text)" }}>
                            Subscriptions
                        </h2>

                        {/* Badge */}
                        <span
                            className="inline-block text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4"
                            style={{ background: "var(--dash-accent)", color: "#0A0A0B" }}
                        >
                            Coming Soon
                        </span>

                        {/* Description */}
                        <p className="text-sm leading-relaxed" style={{ color: "var(--dash-text-muted)" }}>
                            We&apos;re building premium subscription plans to unlock deeper energy intelligence, exclusive reports, and more.
                        </p>
                    </div>
                </div>
            </div>

            {/* Magazine Subscription — kept visible below */}
            <div
                className="rounded-xl p-7 mt-8"
                style={{
                    background: "linear-gradient(135deg, rgba(201,168,76,0.1) 0%, rgba(201,168,76,0.03) 100%)",
                    border: "1px solid var(--dash-border-gold)",
                }}
            >
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(201,168,76,0.15)" }}>
                        <BookOpen size={28} style={{ color: "var(--dash-accent)" }} />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-lg font-bold mb-1" style={{ color: "var(--dash-text)" }}>ENERGDIVE Magazine Subscription</h3>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--dash-text-muted)" }}>
                            Subscribe to India&apos;s premier energy journal. Get in-depth analysis, exclusive interviews, and comprehensive sector reports delivered monthly.
                        </p>
                    </div>
                    <a
                        href="https://forms.zohopublic.in/itenmedia1/form/ENERGDIVEMagazineSubscriptionForm/formperma/CX7ORe1WkKQKOFusFv-6rEvYHtqmvqW9P4pP5XHOIGo"
                        target="_blank"
                        rel="noopener"
                        className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex-shrink-0"
                        style={{ background: "var(--dash-accent)", color: "#0A0A0B" }}
                    >
                        Subscribe Now <ExternalLink size={14} />
                    </a>
                </div>
            </div>

            {/* Support footer */}
            <div className="mt-6 text-center">
                <p className="text-xs" style={{ color: "var(--dash-text-dim)" }}>
                    Questions about subscriptions?{" "}
                    <a href="mailto:subscription@energdive.com" className="font-semibold hover:underline" style={{ color: "var(--dash-accent)" }}>
                        subscription@energdive.com
                    </a>
                </p>
            </div>
        </div>
    );
}
