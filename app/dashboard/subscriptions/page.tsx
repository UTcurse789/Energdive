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
        cta: "Upgrade to Pro",
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
        cta: "Contact Sales",
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

            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-3 mb-8">
                <button
                    onClick={() => setBillingCycle("monthly")}
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={billingCycle === "monthly"
                        ? { background: "var(--dash-accent)", color: "#0A0A0B" }
                        : { color: "var(--dash-text-muted)" }}
                >
                    Monthly
                </button>
                <button
                    onClick={() => setBillingCycle("annual")}
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-all relative"
                    style={billingCycle === "annual"
                        ? { background: "var(--dash-accent)", color: "#0A0A0B" }
                        : { color: "var(--dash-text-muted)" }}
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
                    const displayPrice = plan.id === "pro" && billingCycle === "annual" ? "₹1,599" : plan.price;
                    return (
                        <div
                            key={plan.id}
                            className="rounded-xl p-6 relative transition-all hover:shadow-lg"
                            style={{
                                background: "var(--dash-card)",
                                border: plan.popular
                                    ? "2px solid var(--dash-accent)"
                                    : "1px solid var(--dash-border)",
                            }}
                        >
                            {/* Popular badge */}
                            {plan.popular && (
                                <div
                                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                                    style={{ background: "var(--dash-accent)", color: "#0A0A0B" }}
                                >
                                    <Star size={10} /> Most Popular
                                </div>
                            )}

                            {/* Plan icon + name */}
                            <div className="flex items-center gap-3 mb-4 mt-2">
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{ background: `${plan.color}20` }}
                                >
                                    <Icon size={20} style={{ color: plan.color }} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg" style={{ color: "var(--dash-text)" }}>
                                        {plan.name}
                                    </h3>
                                    <p className="text-[11px]" style={{ color: "var(--dash-text-dim)" }}>
                                        {plan.description}
                                    </p>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="mb-5">
                                <span className="text-3xl font-black" style={{ color: "var(--dash-text)" }}>
                                    {displayPrice}
                                </span>
                                {plan.period && (
                                    <span className="text-sm ml-1" style={{ color: "var(--dash-text-dim)" }}>
                                        {plan.period}
                                    </span>
                                )}
                            </div>

                            {/* Features */}
                            <ul className="space-y-2.5 mb-6">
                                {plan.features.map((f, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm">
                                        <Check
                                            size={14}
                                            className="mt-0.5 flex-shrink-0"
                                            style={{ color: plan.popular ? "var(--dash-accent)" : "#4CAF50" }}
                                        />
                                        <span style={{ color: "var(--dash-text-muted)" }}>{f}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            <button
                                className="w-full py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                                disabled={plan.current}
                                style={
                                    plan.current
                                        ? { background: "var(--dash-surface-2)", color: "var(--dash-text-dim)", cursor: "default" }
                                        : plan.popular
                                            ? { background: "var(--dash-accent)", color: "#0A0A0B" }
                                            : { background: "var(--dash-surface-2)", color: "var(--dash-text)", border: "1px solid var(--dash-border)" }
                                }
                            >
                                {plan.current ? (
                                    <>
                                        <Check size={14} /> Current Plan
                                    </>
                                ) : plan.id === "enterprise" ? (
                                    <>
                                        {plan.cta} <ExternalLink size={13} />
                                    </>
                                ) : (
                                    <>
                                        {plan.cta} <ArrowRight size={13} />
                                    </>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Magazine Subscription */}
            <div
                className="rounded-xl p-7"
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
                        rel="noopener noreferrer"
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
