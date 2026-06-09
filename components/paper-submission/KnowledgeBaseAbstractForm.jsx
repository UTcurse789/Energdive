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

const SUBMISSIONS_ENDPOINT = "/api/submit-abstract";
const ABSTRACT_MIN_LENGTH = 200;
const ABSTRACT_PDF_MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const ABSTRACT_PDF_MAX_FILE_SIZE_LABEL = "20 MB";

function normalizeId(value) {
    if (value === null || value === undefined) return "";
    return String(value);
}

function getErrorMessage(error) {
    if (error instanceof Error && error.message) {
        return error.message;
    }
    return "We couldn't submit your abstract. Please review the form and try again.";
}

function getSubmissionErrorMessage(response, responseText) {
    const fallback = "We couldn't submit your abstract. Please try again.";

    if (response.status === 413) {
        return `The server rejected this PDF before it could be uploaded. Files up to ${ABSTRACT_PDF_MAX_FILE_SIZE_LABEL} are allowed here, but the deployment upload limit needs to be increased.`;
    }

    if (!responseText) {
        return fallback;
    }

    try {
        const parsed = JSON.parse(responseText);
        const message = parsed?.error?.message || parsed?.message || parsed?.error;
        return typeof message === "string" && message.trim() ? message : fallback;
    } catch {
        if (/<html[\s>]/i.test(responseText) || /<body[\s>]/i.test(responseText)) {
            return fallback;
        }

        return responseText;
    }
}

export default function KnowledgeBaseAbstractForm({
    initialTitle = "",
    initialAuthorName = "",
    initialAuthorEmail = "",
    initialCoAuthor = "",
    initialCoAuthorEmail = "",
    initialAffiliation = "",
    initialProfession = "",
    initialAbstract = "",
    sectors = [],
    variant = "public",
    returnHref,
    returnLabel = "Back to extra info",
    secondarySuccessHref = "/knowledge-base",
    secondarySuccessLabel = "View Knowledge Base",
}) {
    const [title, setTitle] = useState(initialTitle);
    const [authorName, setAuthorName] = useState(initialAuthorName);
    const [authorEmail, setAuthorEmail] = useState(initialAuthorEmail);
    const [coAuthor, setCoAuthor] = useState(initialCoAuthor);
    const [coAuthorEmail, setCoAuthorEmail] = useState(initialCoAuthorEmail);
    const [affiliation, setAffiliation] = useState(initialAffiliation);
    const [selectedSectorIds, setSelectedSectorIds] = useState([]);
    const [selectedSubSectorIds, setSelectedSubSectorIds] = useState([]);
    const [isSectorDropdownOpen, setIsSectorDropdownOpen] = useState(false);
    const [abstract, setAbstract] = useState(initialAbstract);
    const [pdfFile, setPdfFile] = useState(null);
    const [uploadZoneKey, setUploadZoneKey] = useState(0);
    const [formError, setFormError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successTitle, setSuccessTitle] = useState("");
    const sectorDropdownRef = useRef(null);
    const isDashboardVariant = variant === "dashboard";
    const accentTextColor = isDashboardVariant ? "#0A0A0B" : "#ffffff";

    const abstractLength = abstract.length;
    const trimmedAbstractLength = abstract.trim().length;
    const isAbstractTooShort = trimmedAbstractLength < ABSTRACT_MIN_LENGTH;
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

    const summaryHref = useMemo(() => {
        const params = new URLSearchParams();
        if (affiliation.trim()) params.set("institution", affiliation.trim());
        if (initialProfession) params.set("profession", initialProfession);
        const query = params.toString();
        if (returnHref) return returnHref;
        return query ? `/knowledge-base/submit?${query}` : "/knowledge-base/submit";
    }, [affiliation, initialProfession, returnHref]);

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
            window.location.href = `/dashboard/my-submissions?view=abstract&submitted=1&title=${encodeURIComponent(successTitle)}`;
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
        setTitle(initialTitle);
        setAuthorName(initialAuthorName);
        setAuthorEmail(initialAuthorEmail);
        setCoAuthor(initialCoAuthor);
        setCoAuthorEmail(initialCoAuthorEmail);
        setAffiliation(initialAffiliation);
        setSelectedSectorIds([]);
        setSelectedSubSectorIds([]);
        setAbstract(initialAbstract);
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
        const normalizedCoAuthor = coAuthor.trim();
        const normalizedCoAuthorEmail = coAuthorEmail.trim();
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
            setFormError("Please upload the abstract as a PDF.");
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

            const payload = {
                title: normalizedTitle,
                author_name: normalizedAuthorName,
                author_email: normalizedAuthorEmail,
                co_author: normalizedCoAuthor || null,
                co_author_email: normalizedCoAuthorEmail || null,
                affiliation: normalizedAffiliation,
                profession: initialProfession,
                abstract: normalizedAbstract,
                submitted_date: new Date().toISOString(),
                paper_status: "submitted",
                sector: taxonomyIds.length > 1 ? taxonomyIds : taxonomyIds[0] ?? null,
            };

            const formData = new FormData();
            formData.append("files.pdf", pdfFile);
            formData.append("data", JSON.stringify(payload));

            const response = await fetch(SUBMISSIONS_ENDPOINT, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const responseText = await response.text();
                throw new Error(getSubmissionErrorMessage(response, responseText));
            }

            // Flag the user as abstract submitter locally
            try {
                await fetch("/api/user/mark-abstract-submitter", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        institution: normalizedAffiliation,
                        profession: initialProfession,
                    }),
                });
            } catch (err) {
                console.error("Failed to mark user as abstract submitter:", err);
            }

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
            <div className={isDashboardVariant ? "" : "kb-submit-theme"}>
                <section className={isDashboardVariant ? "pb-8" : "bg-[var(--dash-bg)] pb-16 md:pb-10"}>
                    <div className={isDashboardVariant ? "pb-8" : "container pt-12 pb-12 md:pt-16 md:pb-16"}>
                        <div className="mx-auto max-w-3xl overflow-hidden rounded-[30px]" style={cardStyle}>
                            <div className="p-8 sm:p-10">
                                <div
                                    className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl"
                                    style={{ background: "rgba(9, 182, 151, 0.12)" }}
                                >
                                    <CheckCircle2 className="h-7 w-7" style={{ color: "var(--dash-accent)" }} />
                                </div>
                                <h1 className="text-3xl font-bold" style={{ color: "var(--dash-text)" }}>
                                    Abstract submitted
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
                                    href="/dashboard/my-submissions?view=abstract&submitted=1"
                                    className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition-all"
                                    style={{ background: "var(--dash-accent)", color: accentTextColor }}
                                >
                                    Go to My Submissions
                                </Link>
                                <Link
                                    href={secondarySuccessHref}
                                    className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition-all hover:bg-black/5"
                                    style={{ ...mutedCardStyle, color: "var(--dash-text-muted)" }}
                                >
                                    {secondarySuccessLabel}
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className={isDashboardVariant ? "" : "kb-submit-theme"}>
            <section className={isDashboardVariant ? "pb-8" : "bg-[var(--dash-bg)] pb-16 md:pb-10"}>
                <div className={isDashboardVariant ? "pb-8" : "container pt-12 pb-12 md:pt-16 md:pb-10"}>
                    <div className={isDashboardVariant ? "max-w-5xl" : "mx-auto max-w-4xl"}>
                        <Link
                            href={summaryHref}
                            className={`inline-flex items-center gap-2 text-sm transition-colors ${isDashboardVariant ? "" : "pt-10"}`}
                            style={{ color: "var(--dash-text-dim)" }}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            {returnLabel}
                        </Link>

                        <div className="mt-6 mb-7">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--dash-accent)" }}>
                                Step 2 of 2
                            </p>
                            <h1 className={isDashboardVariant ? "mt-4 text-3xl font-bold sm:text-4xl" : "mt-4 text-4xl font-bold sm:text-5xl"} style={{ color: "var(--dash-text)" }}>
                                Submit your abstract
                            </h1>
                            <p className="mt-4 max-w-2xl text-sm leading-7 sm:text-base" style={{ color: "var(--dash-text-muted)" }}>
                                Your abstract submission will be sent to the ENERGDIVE review workflow.
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
                                                    Abstract Details
                                                </h2>
                                                <p className="text-sm" style={{ color: "var(--dash-text-dim)" }}>
                                                    Complete the metadata and attach the abstract PDF.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-6">
                                    <div className="grid gap-5 md:grid-cols-2">
                                        <Field label="Abstract Title" htmlFor="kb-paper-title" required>
                                            <input
                                                id="kb-paper-title"
                                                type="text"
                                                value={title}
                                                onChange={(event) => setTitle(event.target.value)}
                                                placeholder="Enter the abstract title"
                                                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[var(--dash-accent)]"
                                                style={{ background: "var(--dash-surface-2)", borderColor: "var(--dash-border-subtle)", color: "var(--dash-text)" }}
                                                disabled={isSubmitting}
                                                required
                                            />
                                        </Field>

                                        <Field label="Institution" htmlFor="kb-paper-affiliation">
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

                                    <div className="grid gap-5 md:grid-cols-2">
                                        <Field label="Co-author Name" htmlFor="kb-co-author-name">
                                            <input
                                                id="kb-co-author-name"
                                                type="text"
                                                value={coAuthor}
                                                onChange={(event) => setCoAuthor(event.target.value)}
                                                placeholder="Enter co-author name (optional)"
                                                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[var(--dash-accent)]"
                                                style={{ background: "var(--dash-surface-2)", borderColor: "var(--dash-border-subtle)", color: "var(--dash-text)" }}
                                                disabled={isSubmitting}
                                            />
                                        </Field>

                                        <Field label="Co-author Email" htmlFor="kb-co-author-email">
                                            <input
                                                id="kb-co-author-email"
                                                type="email"
                                                value={coAuthorEmail}
                                                onChange={(event) => setCoAuthorEmail(event.target.value)}
                                                placeholder="Enter co-author email (optional)"
                                                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[var(--dash-accent)]"
                                                style={{ background: "var(--dash-surface-2)", borderColor: "var(--dash-border-subtle)", color: "var(--dash-text)" }}
                                                disabled={isSubmitting}
                                            />
                                        </Field>
                                    </div>

                                    <Field label="Sectors" htmlFor="kb-paper-sectors">
                                        <div id="kb-paper-sectors" className="grid gap-4 md:grid-cols-2">
                                            {/* Left Column: Sector Selection */}
                                            <div className="space-y-3">
                                                <div ref={sectorDropdownRef} className="overflow-hidden rounded-2xl" style={mutedCardStyle}>
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
                                                                            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border"
                                                                            style={{
                                                                                borderColor: isSelected ? "var(--dash-accent)" : "var(--dash-border-subtle)",
                                                                                background: isSelected ? "var(--dash-accent)" : "transparent",
                                                                            }}
                                                                        >
                                                                            {isSelected ? <Check size={12} className="text-white font-bold" /> : null}
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

                                                {/* Selected sector tags */}
                                                {selectedSectors.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedSectors.map((sector) => (
                                                            <span
                                                                key={sector.id}
                                                                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold"
                                                                style={{ background: "rgba(9, 182, 151, 0.08)", border: "1px solid rgba(9, 182, 151, 0.2)", color: "var(--dash-accent)" }}
                                                            >
                                                                {sector.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right Column: Sub-Sector Selection — always visible on desktop */}
                                            <div className="rounded-2xl p-4 sm:p-5" style={mutedCardStyle}>
                                                <div className="mb-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--dash-text-dim)" }}>
                                                    Sub-Sectors
                                                </div>
                                                {availableSubSectors.length > 0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {availableSubSectors.map((sub) => {
                                                            const isSelected = selectedSubSectorIds.includes(sub.id);
                                                            return (
                                                                <button
                                                                    key={sub.id}
                                                                    type="button"
                                                                    onClick={() => toggleSubSector(sectors.find(s => normalizeId(s.id) === sub.sectorId), sub)}
                                                                    disabled={isSubmitting}
                                                                    className="rounded-xl px-3.5 py-2 text-xs font-medium transition-all"
                                                                    style={{
                                                                        background: isSelected ? "var(--dash-accent)" : "rgba(255, 255, 255, 0.03)",
                                                                        border: "1px solid",
                                                                        borderColor: isSelected ? "var(--dash-accent)" : "var(--dash-border-subtle)",
                                                                        color: isSelected ? "#ffffff" : "var(--dash-text)",
                                                                    }}
                                                                >
                                                                    {sub.name}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs" style={{ color: "var(--dash-text-dim)" }}>
                                                        Select a sector on the left to view sub-sectors.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </Field>

                                    <Field label="Abstract Description" htmlFor="kb-paper-abstract" required>
                                        <textarea
                                            id="kb-paper-abstract"
                                            value={abstract}
                                            onChange={(event) => setAbstract(event.target.value)}
                                            placeholder="Write a clear summary of your research paper..."
                                            className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[var(--dash-accent)] min-h-[160px] resize-y"
                                            style={{ background: "var(--dash-surface-2)", borderColor: "var(--dash-border-subtle)", color: "var(--dash-text)" }}
                                            disabled={isSubmitting}
                                            required
                                        />
                                        <div className="mt-1 flex items-center justify-between text-xs">
                                            <span style={{ color: abstractLength < ABSTRACT_MIN_LENGTH ? "var(--dash-text-dim)" : "var(--dash-accent)" }}>
                                                {abstractLength} character{abstractLength !== 1 ? "s" : ""}
                                                {abstractLength < ABSTRACT_MIN_LENGTH ? ` (minimum ${ABSTRACT_MIN_LENGTH} required)` : ""}
                                            </span>
                                        </div>
                                    </Field>

                                    <Field label="Abstract PDF File" htmlFor="kb-paper-file" required>
                                        <UploadZone
                                            key={uploadZoneKey}
                                            file={pdfFile}
                                            onFileSelect={setPdfFile}
                                            disabled={isSubmitting}
                                            helperText={`PDF only, maximum size ${ABSTRACT_PDF_MAX_FILE_SIZE_LABEL}.`}
                                            maxFileSizeBytes={ABSTRACT_PDF_MAX_FILE_SIZE_BYTES}
                                            maxFileSizeLabel={ABSTRACT_PDF_MAX_FILE_SIZE_LABEL}
                                        />
                                    </Field>
                                </div>

                                {formError ? (
                                    <div
                                        className="mt-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm"
                                        style={{ background: "rgba(239, 68, 68, 0.08)", borderColor: "rgba(239, 68, 68, 0.2)", color: "#EF4444" }}
                                    >
                                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                        <span>{formError}</span>
                                    </div>
                                ) : null}

                                <div className="mt-8 flex flex-col items-end gap-3 border-t pt-6" style={{ borderColor: "var(--dash-border)" }}>
                                    {isAbstractTooShort ? (
                                        <p className="max-w-md text-right text-xs" style={{ color: "var(--dash-text-dim)" }}>
                                            Add {ABSTRACT_MIN_LENGTH - trimmedAbstractLength} more character
                                            {ABSTRACT_MIN_LENGTH - trimmedAbstractLength !== 1 ? "s" : ""} before submitting.
                                        </p>
                                    ) : null}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || isAbstractTooShort}
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                        style={{ background: "var(--dash-accent)", color: accentTextColor }}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Submitting abstract...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4" />
                                                Submit Abstract
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </div>
    );
}

function InfoCard({ label, value }) {
    return (
        <div className="rounded-2xl border px-4 py-3" style={{ background: "var(--dash-card)", borderColor: "var(--dash-border)" }}>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--dash-text-dim)" }}>
                {label}
            </span>
            <div className="mt-0.5 text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
                {value}
            </div>
        </div>
    );
}

function Field({ label, htmlFor, required = false, children }) {
    return (
        <div className="flex flex-col gap-2">
            <label htmlFor={htmlFor} className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--dash-text-dim)" }}>
                {label}
                {required ? <span className="text-red-500 ml-0.5">*</span> : null}
            </label>
            {children}
        </div>
    );
}
