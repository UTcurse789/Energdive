"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Building2, BriefcaseBusiness } from "lucide-react";
import { PAPER_PROFESSION_OPTIONS } from "@/lib/paper-submission-taxonomy";

export default function KnowledgeBaseExtraInfoForm({
    defaultInstitution = "",
    defaultProfession = "",
}) {
    const router = useRouter();
    const [institution, setInstitution] = useState(defaultInstitution);
    const [profession, setProfession] = useState(defaultProfession);

    const handleContinue = (event) => {
        event.preventDefault();

        const params = new URLSearchParams();
        if (institution.trim()) {
            params.set("institution", institution.trim());
        }
        if (profession) {
            params.set("profession", profession);
        }

        const nextPath = params.toString()
            ? `/dashboard/my-submissions/new?${params.toString()}`
            : "/dashboard/my-submissions/new";

        router.push(nextPath);
    };

    return (
        <div className="kb-submit-theme">
            <section className="bg-[var(--dash-bg)] pb-16 md:pb-28">
                <div className="container pt-12 pb-12 md:pt-16 md:pb-16">
                    <div className="mx-auto max-w-3xl">
                        <Link
                            href="/knowledge-base"
                            className="inline-flex items-center gap-2 text-sm transition-colors mt-10"
                            style={{ color: "var(--dash-text-dim)" }}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Knowledge Base
                        </Link>

                        <div className="mt-6 mb-12 md:mb-20 rounded-[30px] border p-8 shadow-[0_24px_80px_rgba(0,0,0,0.06)] sm:p-10" style={{ background: "var(--dash-card)", borderColor: "var(--dash-border)" }}>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--dash-accent)" }}>
                                Step 1 of 2
                            </p>
                            <h1 className="mt-4 text-4xl font-bold" style={{ color: "var(--dash-text)" }}>
                                Tell us a little more
                            </h1>
                            <p className="mt-4 max-w-2xl text-sm leading-7 sm:text-base" style={{ color: "var(--dash-text-muted)" }}>
                                We only need two details before you continue to the paper submission form.
                            </p>

                            <form onSubmit={handleContinue} className="mt-8 space-y-6">
                                <Field label="University / Institution" htmlFor="kb-institution" icon={Building2}>
                                    <input
                                        id="kb-institution"
                                        type="text"
                                        value={institution}
                                        onChange={(event) => setInstitution(event.target.value)}
                                        placeholder="Enter your university, institution, or organization"
                                        className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[var(--dash-accent)]"
                                        style={{
                                            background: "var(--dash-surface-2)",
                                            borderColor: "var(--dash-border-subtle)",
                                            color: "var(--dash-text)",
                                        }}
                                    />
                                </Field>

                                <Field label="Profession / Role" htmlFor="kb-profession" icon={BriefcaseBusiness}>
                                    <select
                                        id="kb-profession"
                                        value={profession}
                                        onChange={(event) => setProfession(event.target.value)}
                                        className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all focus:border-[var(--dash-accent)]"
                                        style={{
                                            background: "var(--dash-surface-2)",
                                            borderColor: "var(--dash-border-subtle)",
                                            color: "var(--dash-text)",
                                        }}
                                    >
                                        <option value="">Select your role</option>
                                        {PAPER_PROFESSION_OPTIONS.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--dash-border)" }}>
                                    <p className="text-sm" style={{ color: "var(--dash-text-dim)" }}>
                                        Your paper submission will open next with your institution pre-filled.
                                    </p>
                                    <button
                                        type="submit"
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all"
                                        style={{ background: "var(--dash-accent)", color: "#ffffff" }}
                                    >
                                        Continue
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function Field({ label, htmlFor, icon: Icon, children }) {
    return (
        <div>
            <label
                htmlFor={htmlFor}
                className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: "var(--dash-text-dim)" }}
            >
                <Icon className="h-4 w-4" style={{ color: "var(--dash-accent)" }} />
                {label}
            </label>
            {children}
        </div>
    );
}
