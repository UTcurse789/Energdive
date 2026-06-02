"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    Check,
    CheckCircle2,
    ChevronDown,
    FileText,
    Loader2,
    Send,
} from "lucide-react";
import UploadZone from "@/components/paper-submission/UploadZone";
import {
    POST_AUTH_REDIRECT_COOKIE,
    POST_AUTH_REDIRECT_STORAGE_KEY,
} from "@/lib/post-auth-redirect";

const PAPER_SUBMISSIONS_ENDPOINT = "/api/submit-paper";
const ABSTRACT_MIN_LENGTH = 100;

function normalizeId(value) {
    if (value === null || value === undefined) return "";
    return String(value);
}

function getErrorMessage(error) {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    return "We couldn't submit your paper. Please review the form and try again.";
}

export default function KnowledgeBasePaperForm({
    initialAuthorName = "",
    initialAuthorEmail = "",
    initialAffiliation = "",
    initialProfession = "",
    sectors = [],
}) {
    const [title, setTitle] = useState("");
    const [authorName, setAuthorName] = useState(initialAuthorName);
    const [authorEmail, setAuthorEmail] = useState(initialAuthorEmail);
    const [affiliation, setAffiliation] = useState(initialAffiliation);
    const [selectedSectorIds, setSelectedSectorIds] = useState([]);
    const [selectedSubSectorIds, setSelectedSubSectorIds] = useState([]);
    const [isSectorDropdownOpen, setIsSectorDropdownOpen] = useState(false);
    const [abstract, setAbstract] = useState("");
    const [pdfFile, setPdfFile] = useState(null);
    const [uploadZoneKey, setUploadZoneKey] = useState(0);
    const [formError, setFormError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successTitle, setSuccessTitle] = useState("");
    const sectorDropdownRef = useRef(null);

    const abstractLength = abstract.length;
    const selectedSectors = useMemo(
        () => sectors.filter((sector) => selectedSectorIds.includes(normalizeId(sector.id))),
        [sectors, selectedSectorIds]
    );

    const availableSubSectors = useMemo(
        () => selectedSectors.flatMap((sector) =>
            sector.children.map((child) => ({
                id: normalizeId(child.id),
                name: child.name,
                sectorId: normalizeId(sector.id),
            }))
        ),
        [selectedSectors]
    );

    const selectedSubSectorNames = useMemo(
        () => Array.from(new Set(
            selectedSectors.flatMap((sector) =>
                sector.children
                    .filter((child) => selectedSubSectorIds.includes(normalizeId(child.id)))
                    .map((child) => child.name)
            )
        )),
        [selectedSectors, selectedSubSectorIds]
    );

    const summaryHref = useMemo(() => {
        const params = new URLSearchParams();
        if (affiliation.trim()) params.set("institution", affiliation.trim());
        if (initialProfession) params.set("profession", initialProfession);
        const query = params.toString();
        return query ? `/knowledge-base/submit?${query}` : "/knowledge-base/submit";
    }, [affiliation, initialProfession]);

    const cardStyle = {
        background: "var(--dash-card)",
        border: "1px solid var(--dash-border)",
    };

    const mutedCardStyle = {
        background: "var(--dash-surface-2)",
        border: "1px solid var(--dash-border-subtle)",
    };

    useEffect(() => {
        if (!isSectorDropdownOpen) {
            return undefined;
        }

        const handlePointerDown = (event) => {
            if (!sectorDropdownRef.current?.contains(event.target)) {
                setIsSectorDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handlePointerDown);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
        };
    }, [isSectorDropdownOpen]);

    useEffect(() => {
        if (!successTitle) {
            return undefined;
        }

        sessionStorage.removeItem(POST_AUTH_REDIRECT_STORAGE_KEY);
        document.cookie = `${POST_AUTH_REDIRECT_COOKIE}=; path=/; max-age=0; SameSite=Lax`;

        const timeoutId = window.setTimeout(() => {
            window.location.href = `/dashboard/my-submissions?submitted=1&title=${encodeURIComponent(successTitle)}`;
        }, 900);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [successTitle]);

    const toggleSector = (sector) => {
        const sectorId = normalizeId(sector.id);
        const childIds = sector.children.map((child) => normalizeId(child.id));
        const isSelected = selectedSectorIds.includes(sectorId);

        setSelectedSectorIds((previous) =>
            isSelected
                ? previous.filter((item) => item !== sectorId)
                : [...previous, sectorId]
        );

        if (isSelected) {
            setSelectedSubSectorIds((previous) =>
                previous.filter((item) => !childIds.includes(item))
            );
        }
    };

    const toggleSubSector = (sector, child) => {
        const sectorId = normalizeId(sector.id);
        const childId = normalizeId(child.id);

        setSelectedSectorIds((previous) =>
            previous.includes(sectorId) ? previous : [...previous, sectorId]
        );

        setSelectedSubSectorIds((previous) =>
            previous.includes(childId)
                ? previous.filter((item) => item !== childId)
                : [...previous, childId]
        );
    };

    const resetForm = () => {
        setTitle("");
        setAuthorName(initialAuthorName);
        setAuthorEmail(initialAuthorEmail);
        setAffiliation(initialAffiliation);
        setSelectedSectorIds([]);
        setSelectedSubSectorIds([]);
        setAbstract("");
        setPdfFile(null);
        setFormError("");
        setUploadZoneKey((value) => value + 1);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError("");

        const normalizedTitle = title.trim();
        const normalizedAuthorName = authorName.trim();
        const normalizedAuthorEmail = authorEmail.trim();
        const normalizedAffiliation = affiliation.trim();
        const normalizedAbstract = abstract.trim();

        if (!normalizedTitle) {
            setFormError("Paper title is required.");
            return;
        }

        if (!normalizedAuthorName) {
            setFormError("Author name is required.");
            return;
        }

        if (!normalizedAuthorEmail) {
            setFormError("Author email is required.");
            return;
        }

        if (normalizedAbstract.length < ABSTRACT_MIN_LENGTH) {
            setFormError(`Abstract must be at least ${ABSTRACT_MIN_LENGTH} characters.`);
            return;
        }

        if (!pdfFile) {
            setFormError("Please upload the paper as a PDF.");
            return;
        }

        setIsSubmitting(true);

        try {
            const taxonomyIds = Array.from(
                new Set(
                    [...selectedSectorIds, ...selectedSubSectorIds]
                        .map((value) => Number(value))
                        .filter((value) => Number.isFinite(value) && value > 0)
                )
            );

            const basePayload = {
                title: normalizedTitle,
                author_name: normalizedAuthorName,
                author_email: normalizedAuthorEmail,
                affiliation: normalizedAffiliation,
                abstract: normalizedAbstract,
                submitted_date: new Date().toISOString(),
                paper_status: "submitted",
            };

            const payloadAttempts = [
                {
                    ...basePayload,
                    sector: taxonomyIds.length > 1 ? taxonomyIds : taxonomyIds[0] ?? null,
                },
            ];

            if (taxonomyIds.length > 1) {
                payloadAttempts.push({
                    ...basePayload,
                    sector: taxonomyIds[0],
                });
            }

            let successfulResponse = null;
            let finalErrorMessage = "We couldn't submit your paper. Please try again.";

            for (const payload of payloadAttempts) {
                const formData = new FormData();
                formData.append("files.pdf", pdfFile);
                formData.append("data", JSON.stringify(payload));

                const response = await fetch(PAPER_SUBMISSIONS_ENDPOINT, {
                    method: "POST",
                    body: formData,
                });

                if (response.ok) {
                    successfulResponse = response;
                    break;
                }

                const responseText = await response.text();
                let message = finalErrorMessage;

                if (responseText) {
                    try {
                        const parsed = JSON.parse(responseText);
                        message = parsed?.error?.message || parsed?.message || message;
                    } catch {
                        message = responseText;
                    }
                }

                finalErrorMessage = message;
            }

            if (!successfulResponse) {
                throw new Error(finalErrorMessage);
            }

            try {
                await fetch("/api/user/mark-submitter", { method: "POST" });
            } catch (error) {
                console.error("Failed to mark user as submitter:", error);
            }

            // TODO: Trigger submission confirmation notifications once the notification workflow is defined.
            setSuccessTitle(normalizedTitle);
            resetForm();
        } catch (error) {
            setFormError(getErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (successTitle) {
        return (
            <div className="kb-submit-theme">
                <section className="bg-[var(--dash-bg)] pb-16 md:pb-10">
                    <div className="container pt-12 pb-12 md:pt-16 md:pb-16">
                        <div className="mx-auto max-w-3xl mb-12 md:mb-20 rounded-[30px] overflow-hidden" style={cardStyle}>
                            <div className="p-8 sm:p-10">
                                <div
                                    className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl"
                                    style={{ background: "rgba(9, 182, 151, 0.12)" }}
                                >
                                    <CheckCircle2 className="h-7 w-7" style={{ color: "var(--dash-accent)" }} />
                                </div>
                                <h1 className="text-3xl font-bold" style={{ color: "var(--dash-text)" }}>
                                    Paper submitted
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-7 sm:text-base" style={{ color: "var(--dash-text-muted)" }}>
                                    <span className="font-semibold" style={{ color: "var(--dash-text)" }}>{successTitle}</span> has
                                    been added to the submission queue. Redirecting you to My Submissions.
                                </p>
                            </div>

                            <div
                                className="flex flex-col gap-3 px-8 py-5 sm:flex-row sm:px-10"
                                style={{ borderTop: "1px solid var(--dash-border)" }}
                            >
                                <Link
                                    href="/dashboard/my-submissions?submitted=1"
                                    className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition-all"
                                    style={{ background: "var(--dash-accent)", color: "#ffffff" }}
                                >
                                    Go to My Submissions
                                </Link>
                                <Link
                                    href="/knowledge-base"
                                    className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition-all hover:bg-black/5"
                                    style={{ ...mutedCardStyle, color: "var(--dash-text-muted)" }}
                                >
                                    View Knowledge Base
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="kb-submit-theme">
            <section className="bg-[var(--dash-bg)] pb-16 md:pb-10">
                <div className="container pt-12 pb-12 md:pt-16 md:pb-10">
                    <div className="mx-auto max-w-4xl">
                        <Link
                            href={summaryHref}
                            className="inline-flex items-center gap-2 text-sm transition-colors pt-10"
                            style={{ color: "var(--dash-text-dim)" }}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to extra info
                        </Link>

                        <div className="mt-6 mb-7">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--dash-accent)" }}>
                                Step 2 of 2
                            </p>
                            <h1 className="mt-4 text-4xl font-bold sm:text-5xl" style={{ color: "var(--dash-text)" }}>
                                Submit your paper
                            </h1>
                            <p className="mt-4 max-w-2xl text-sm leading-7 sm:text-base" style={{ color: "var(--dash-text-muted)" }}>
                                Your submission will be sent to the ENERGDIVE review workflow with the default status
                                of submitted.
                            </p>
                        </div>

                        <div className="mb-6 grid gap-3 md:grid-cols-2">
                            <InfoCard label="Institution" value={affiliation || "Not provided yet"} />
                            <InfoCard label="Profession / Role" value={initialProfession || "Not provided yet"} />
                        </div>

                        <form onSubmit={handleSubmit} className="overflow-hidden rounded-[30px] shadow-[0_24px_80px_rgba(0,0,0,0.06)] mb-12 md:mb-10" style={cardStyle}>
                            <div className="p-6 sm:p-7">
                                <div className="mb-7 flex items-start justify-between gap-4">
                                    <div>
                                        <div className="mb-3 flex items-center gap-3">
                                            <div
                                                className="flex h-10 w-10 items-center justify-center rounded-xl"
                                                style={{ background: "rgba(9, 182, 151, 0.12)" }}
                                            >
                                                <FileText size={18} style={{ color: "var(--dash-accent)" }} />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold" style={{ color: "var(--dash-text)" }}>
                                                    Paper Details
                                                </h2>
                                                <p className="text-sm" style={{ color: "var(--dash-text-dim)" }}>
                                                    Complete the metadata and attach the final PDF.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-6">
                                    <div className="grid gap-5 md:grid-cols-2">
                                        <Field label="Paper Title" htmlFor="kb-paper-title" required>
                                            <input
                                                id="kb-paper-title"
                                                type="text"
                                                value={title}
                                                onChange={(event) => setTitle(event.target.value)}
                                                placeholder="Enter the paper title"
                                                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[var(--dash-accent)]"
                                                style={{ background: "var(--dash-surface-2)", borderColor: "var(--dash-border-subtle)", color: "var(--dash-text)" }}
                                                disabled={isSubmitting}
                                                required
                                            />
                                        </Field>

                                        <Field label="Affiliation" htmlFor="kb-paper-affiliation">
                                            <input
                                                id="kb-paper-affiliation"
                                                type="text"
                                                value={affiliation}
                                                onChange={(event) => setAffiliation(event.target.value)}
                                                placeholder="Organisation or institution"
                                                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[var(--dash-accent)]"
                                                style={{ background: "var(--dash-surface-2)", borderColor: "var(--dash-border-subtle)", color: "var(--dash-text)" }}
                                                disabled={isSubmitting}
                                            />
                                        </Field>
                                    </div>

                                    <div className="grid gap-5 md:grid-cols-2">
                                        <Field label="Author Name" htmlFor="kb-author-name" required>
                                            <input
                                                id="kb-author-name"
                                                type="text"
                                                value={authorName}
                                                onChange={(event) => setAuthorName(event.target.value)}
                                                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[var(--dash-accent)]"
                                                style={{ background: "var(--dash-surface-2)", borderColor: "var(--dash-border-subtle)", color: "var(--dash-text)" }}
                                                disabled={isSubmitting}
                                                required
                                            />
                                        </Field>

                                        <Field label="Author Email" htmlFor="kb-author-email" required>
                                            <input
                                                id="kb-author-email"
                                                type="email"
                                                value={authorEmail}
                                                onChange={(event) => setAuthorEmail(event.target.value)}
                                                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[var(--dash-accent)]"
                                                style={{ background: "var(--dash-surface-2)", borderColor: "var(--dash-border-subtle)", color: "var(--dash-text)" }}
                                                disabled={isSubmitting}
                                                required
                                            />
                                        </Field>
                                    </div>

                                    <Field label="Sectors" htmlFor="kb-paper-sectors">
                                        <div id="kb-paper-sectors" className="space-y-3">
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div ref={sectorDropdownRef} className="relative">
                                                    <div className="overflow-hidden rounded-2xl" style={mutedCardStyle}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsSectorDropdownOpen((previous) => !previous)}
                                                            disabled={isSubmitting}
                                                            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            <div>
                                                                <div
                                                                    className="text-[11px] font-bold uppercase tracking-wider"
                                                                    style={{ color: "var(--dash-text-dim)" }}
                                                                >
                                                                    Sector
                                                                </div>
                                                                <div className="mt-1 text-sm font-medium" style={{ color: "var(--dash-text)" }}>
                                                                    {selectedSectorIds.length > 0
                                                                        ? `${selectedSectorIds.length} sector${selectedSectorIds.length > 1 ? "s" : ""} selected`
                                                                        : "Select sector"}
                                                                </div>
                                                            </div>
                                                            <ChevronDown
                                                                className={`h-4 w-4 transition-transform ${isSectorDropdownOpen ? "rotate-180" : ""}`}
                                                                style={{ color: "var(--dash-text-dim)" }}
                                                            />
                                                        </button>

                                                        {isSectorDropdownOpen ? (
                                                            <div style={{ borderTop: "1px solid var(--dash-border-subtle)" }}>
                                                                {sectors.map((sector) => {
                                                                    const sectorId = normalizeId(sector.id);
                                                                    const isSelected = selectedSectorIds.includes(sectorId);

                                                                    return (
                                                                        <button
                                                                            key={sectorId}
                                                                            type="button"
                                                                            onClick={() => toggleSector(sector)}
                                                                            disabled={isSubmitting}
                                                                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60"
                                                                            style={{
                                                                                background: isSelected ? "rgba(9, 182, 151, 0.12)" : "transparent",
                                                                                borderBottom: "1px solid var(--dash-border-subtle)",
                                                                            }}
                                                                        >
                                                                            <span
                                                                                className="flex h-5 w-5 items-center justify-center rounded border"
                                                                                style={{
                                                                                    background: isSelected ? "var(--dash-accent)" : "transparent",
                                                                                    borderColor: isSelected ? "var(--dash-accent)" : "var(--dash-border-subtle)",
                                                                                    color: isSelected ? "#ffffff" : "transparent",
                                                                                }}
                                                                            >
                                                                                <Check className="h-3.5 w-3.5" />
                                                                            </span>
                                                                            <span className="text-sm font-medium" style={{ color: "var(--dash-text)" }}>
                                                                                {sector.name}
                                                                            </span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>

                                                <div
                                                    className="overflow-hidden rounded-2xl"
                                                    style={{
                                                        ...mutedCardStyle,
                                                        opacity: selectedSectors.length === 0 ? 0.65 : 1,
                                                    }}
                                                >
                                                    <div
                                                        className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider"
                                                        style={{ color: "var(--dash-text-dim)", borderBottom: "1px solid var(--dash-border-subtle)" }}
                                                    >
                                                        Sub-Sector
                                                    </div>
                                                    <div className="max-h-80 overflow-y-auto px-4 py-4">
                                                        {selectedSectors.length === 0 ? (
                                                            <div
                                                                className="rounded-2xl px-4 py-5 text-sm"
                                                                style={{ background: "var(--dash-surface)", color: "var(--dash-text-dim)" }}
                                                            >
                                                                Select a sector first to enable sub-sector selection.
                                                            </div>
                                                        ) : availableSubSectors.length === 0 ? (
                                                            <div
                                                                className="rounded-2xl px-4 py-5 text-sm"
                                                                style={{ background: "var(--dash-surface)", color: "var(--dash-text-dim)" }}
                                                            >
                                                                No sub-sectors available for the selected sector.
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-wrap gap-2">
                                                                {availableSubSectors.map((subSector) => {
                                                                    const isChildSelected = selectedSubSectorIds.includes(subSector.id);
                                                                    const parentSector = selectedSectors.find((sector) => normalizeId(sector.id) === subSector.sectorId);
                                                                    const child = parentSector?.children.find((item) => normalizeId(item.id) === subSector.id);

                                                                    if (!parentSector || !child) {
                                                                        return null;
                                                                    }

                                                                    return (
                                                                        <button
                                                                            key={`${subSector.sectorId}-${subSector.id}`}
                                                                            type="button"
                                                                            onClick={() => toggleSubSector(parentSector, child)}
                                                                            disabled={isSubmitting}
                                                                            className="rounded-full border px-3 py-1.5 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60"
                                                                            style={{
                                                                                background: isChildSelected ? "var(--dash-accent)" : "var(--dash-surface)",
                                                                                borderColor: isChildSelected ? "var(--dash-accent)" : "var(--dash-border-subtle)",
                                                                                color: isChildSelected ? "#ffffff" : "var(--dash-text-muted)",
                                                                            }}
                                                                        >
                                                                            {subSector.name}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Field>

                                    <Field
                                        label="Abstract"
                                        htmlFor="kb-paper-abstract"
                                        required
                                        aside={(
                                            <span
                                                className="text-xs font-medium"
                                                style={{ color: abstractLength >= ABSTRACT_MIN_LENGTH ? "var(--dash-text-dim)" : "var(--dash-accent)" }}
                                            >
                                                {abstractLength} / {ABSTRACT_MIN_LENGTH} minimum
                                            </span>
                                        )}
                                    >
                                        <textarea
                                            id="kb-paper-abstract"
                                            value={abstract}
                                            onChange={(event) => setAbstract(event.target.value)}
                                            placeholder="Summarise the core argument, methods, and key findings."
                                            rows={8}
                                            className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[var(--dash-accent)]"
                                            style={{ background: "var(--dash-surface-2)", borderColor: "var(--dash-border-subtle)", color: "var(--dash-text)" }}
                                            disabled={isSubmitting}
                                            required
                                            minLength={ABSTRACT_MIN_LENGTH}
                                        />
                                        <p className="mt-2 text-sm" style={{ color: "var(--dash-text-dim)" }}>
                                            A concise abstract helps the review team assess relevance quickly.
                                        </p>
                                    </Field>

                                    <UploadZone
                                        key={uploadZoneKey}
                                        file={pdfFile}
                                        onFileSelect={setPdfFile}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="px-6 py-5 sm:px-7" style={{ borderTop: "1px solid var(--dash-border)" }}>
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-sm" style={{ color: "var(--dash-text-dim)" }}>
                                        Your paper will be timestamped and submitted directly to the review workflow.
                                    </p>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                                        style={{ background: "var(--dash-accent)", color: "#ffffff" }}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Submitting paper...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4" />
                                                Submit Paper
                                            </>
                                        )}
                                    </button>
                                </div>

                                {formError ? (
                                    <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                        <span>{formError}</span>
                                    </div>
                                ) : null}
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
}

function Field({ label, htmlFor, required = false, aside = null, children }) {
    return (
        <div>
            <div className="mb-2 flex items-center justify-between gap-3">
                <label
                    htmlFor={htmlFor}
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: "var(--dash-text-dim)" }}
                >
                    {label}
                    {required ? <span className="ml-1" style={{ color: "var(--dash-accent)" }}>*</span> : null}
                </label>
                {aside}
            </div>
            {children}
        </div>
    );
}

function InfoCard({ label, value }) {
    return (
        <div className="rounded-2xl border px-4 py-4" style={{ background: "var(--dash-card)", borderColor: "var(--dash-border)" }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--dash-text-dim)" }}>
                {label}
            </p>
            <p className="mt-2 text-sm font-medium" style={{ color: "var(--dash-text)" }}>
                {value}
            </p>
        </div>
    );
}
