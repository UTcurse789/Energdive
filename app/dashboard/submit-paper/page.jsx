"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    FileText,
    Loader2,
    Send,
} from "lucide-react";
import UploadZone from "@/components/paper-submission/UploadZone";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;
const ABSTRACT_MIN_LENGTH = 100;

// TODO: Replace this mock with the authenticated ENERGClub member profile.
const currentUser = {
    name: "John Doe",
    email: "john@example.com",
};

function readStrapiAttributes(item) {
    return item?.attributes ?? item ?? {};
}

function normalizeSector(item) {
    const attrs = readStrapiAttributes(item);
    return {
        id: item?.id ?? attrs?.id ?? null,
        name: attrs?.name ?? attrs?.title ?? "",
    };
}

function getErrorMessage(error) {
    if (error instanceof Error && error.message) {
        return error.message;
    }
    return "We couldn't submit your paper. Please review the form and try again.";
}

export default function SubmitPaperPage() {
    const [title, setTitle] = useState("");
    const [authorName, setAuthorName] = useState(currentUser.name);
    const [authorEmail, setAuthorEmail] = useState(currentUser.email);
    const [affiliation, setAffiliation] = useState("");
    const [selectedSectorId, setSelectedSectorId] = useState("");
    const [abstract, setAbstract] = useState("");
    const [pdfFile, setPdfFile] = useState(null);
    const [uploadZoneKey, setUploadZoneKey] = useState(0);
    const [sectors, setSectors] = useState([]);
    const [isLoadingSectors, setIsLoadingSectors] = useState(true);
    const [sectorsError, setSectorsError] = useState("");
    const [formError, setFormError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successTitle, setSuccessTitle] = useState("");
    const cardStyle = {
        background: "var(--dash-card)",
        border: "1px solid var(--dash-border)",
    };
    const mutedCardStyle = {
        background: "var(--dash-surface-2)",
        border: "1px solid var(--dash-border-subtle)",
    };

    useEffect(() => {
        let ignore = false;

        const loadSectors = async () => {
            if (!STRAPI_URL) {
                if (!ignore) {
                    setSectorsError("Sector options are unavailable because the Strapi URL is missing.");
                    setIsLoadingSectors(false);
                }
                return;
            }

            try {
                setIsLoadingSectors(true);
                setSectorsError("");

                const response = await fetch(
                    `${STRAPI_URL}/api/sectors?sort[0]=name:asc&pagination[pageSize]=100`
                );

                if (!response.ok) {
                    throw new Error("Unable to load sectors right now.");
                }

                const payload = await response.json();
                const rawSectors = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
                const normalizedSectors = rawSectors
                    .map(normalizeSector)
                    .filter((sector) => sector.id && sector.name);

                if (!ignore) {
                    setSectors(normalizedSectors);
                }
            } catch (error) {
                if (!ignore) {
                    setSectorsError(getErrorMessage(error));
                }
            } finally {
                if (!ignore) {
                    setIsLoadingSectors(false);
                }
            }
        };

        loadSectors();

        return () => {
            ignore = true;
        };
    }, []);

    const abstractLength = abstract.length;

    const resetForm = () => {
        setTitle("");
        setAuthorName(currentUser.name);
        setAuthorEmail(currentUser.email);
        setAffiliation("");
        setSelectedSectorId("");
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

        if (!STRAPI_URL) {
            setFormError("Submission is unavailable because the Strapi URL is missing.");
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            const sectorId = selectedSectorId ? Number(selectedSectorId) : null;

            formData.append("files.pdf", pdfFile);
            formData.append("data", JSON.stringify({
                title: normalizedTitle,
                author_name: normalizedAuthorName,
                author_email: normalizedAuthorEmail,
                affiliation: normalizedAffiliation,
                abstract: normalizedAbstract,
                submitted_date: new Date().toISOString(),
                paper_status: "submitted",
                sector: sectorId,
            }));

            const response = await fetch(`${STRAPI_URL}/api/paper-submissions`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const responseText = await response.text();
                let message = "We couldn't submit your paper. Please try again.";

                if (responseText) {
                    try {
                        const parsed = JSON.parse(responseText);
                        message = parsed?.error?.message || parsed?.message || message;
                    } catch {
                        message = responseText;
                    }
                }

                throw new Error(message);
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
            <div className="animate-fade-in-up mx-auto max-w-4xl">
                <div
                    className="overflow-hidden rounded-xl"
                    style={cardStyle}
                >
                    <div className="p-8 sm:p-10">
                        <div
                            className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl"
                            style={{ background: "rgba(201,168,76,0.15)" }}
                        >
                            <CheckCircle2 className="h-7 w-7" style={{ color: "var(--dash-accent)" }} />
                        </div>

                        <h1 className="text-3xl font-bold" style={{ color: "var(--dash-text)" }}>
                            Paper submitted
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 sm:text-base" style={{ color: "var(--dash-text-muted)" }}>
                            <span className="font-semibold" style={{ color: "var(--dash-text)" }}>{successTitle}</span> has been sent to the
                            ENERGClub review queue. You can submit another paper now or return to your dashboard.
                        </p>
                    </div>

                    <div
                        className="flex flex-col gap-3 px-8 py-5 sm:flex-row sm:px-10"
                        style={{ borderTop: "1px solid var(--dash-border)" }}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                setSuccessTitle("");
                                resetForm();
                            }}
                            className="inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-bold transition-all"
                            style={{ background: "var(--dash-accent)", color: "#0A0A0B" }}
                        >
                            Submit Another Paper
                        </button>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-bold transition-all hover:bg-white/5"
                            style={{ ...mutedCardStyle, color: "var(--dash-text-muted)" }}
                        >
                            Go to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up mx-auto max-w-4xl">
            <div className="mb-7">
                <div>
                    <Link
                        href="/dashboard"
                        className="mb-4 inline-flex items-center gap-2 text-sm transition-colors"
                        style={{ color: "var(--dash-text-dim)" }}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to dashboard
                    </Link>
                    <h1 className="text-3xl font-bold sm:text-4xl" style={{ color: "var(--dash-text)" }}>
                        Submit <span style={{ color: "var(--dash-accent)" }}>Paper</span>
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 sm:text-base" style={{ color: "var(--dash-text-dim)" }}>
                        Send strategic energy research to the ENERGClub editorial team for review. All submissions enter the
                        queue as <span className="font-medium" style={{ color: "var(--dash-text)" }}>submitted</span> and are timestamped automatically.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="rounded-xl overflow-hidden shadow-sm" style={cardStyle}>
                <div className="p-6 sm:p-7">
                    <div className="mb-7 flex items-start justify-between gap-4">
                        <div>
                            <div className="mb-3 flex items-center gap-3">
                                <div
                                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                                    style={{ background: "rgba(201,168,76,0.15)" }}
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
                        <div
                            className="hidden rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider sm:inline-flex"
                            style={{ background: "var(--dash-accent-dim)", color: "var(--dash-accent)" }}
                        >
                            Review Queue
                        </div>
                    </div>

                    {/* <div className="mb-6 grid gap-3 md:grid-cols-3">
                        {[
                            "PDF only, maximum 10 MB",
                            "Abstract must be at least 100 characters",
                            "Sector selection helps editorial routing",
                        ].map((item) => (
                            <div key={item} className="rounded-xl px-4 py-3 text-sm" style={{ ...mutedCardStyle, color: "var(--dash-text-muted)" }}>
                                {item}
                            </div>
                        ))}
                    </div> */}

                    <div className="grid gap-6">
                        <div className="grid gap-5 md:grid-cols-2">
                            <Field label="Paper Title" htmlFor="paper-title" required>
                                <input
                                    id="paper-title"
                                    type="text"
                                    value={title}
                                    onChange={(event) => setTitle(event.target.value)}
                                    placeholder="Enter the paper title"
                                    className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-all placeholder:text-[#6B6660] focus:border-[var(--dash-accent)]"
                                    style={{ background: "var(--dash-surface-2)", borderColor: "var(--dash-border-subtle)", color: "var(--dash-text)" }}
                                    disabled={isSubmitting}
                                    required
                                />
                            </Field>

                            <Field label="Affiliation" htmlFor="paper-affiliation">
                                <input
                                    id="paper-affiliation"
                                    type="text"
                                    value={affiliation}
                                    onChange={(event) => setAffiliation(event.target.value)}
                                    placeholder="Organisation or institution"
                                    className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-all placeholder:text-[#6B6660] focus:border-[var(--dash-accent)]"
                                    style={{ background: "var(--dash-surface-2)", borderColor: "var(--dash-border-subtle)", color: "var(--dash-text)" }}
                                    disabled={isSubmitting}
                                />
                            </Field>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                            <Field label="Author Name" htmlFor="author-name" required>
                                <input
                                    id="author-name"
                                    type="text"
                                    value={authorName}
                                    onChange={(event) => setAuthorName(event.target.value)}
                                    placeholder="Primary author name"
                                    className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-all placeholder:text-[#6B6660] focus:border-[var(--dash-accent)]"
                                    style={{ background: "var(--dash-surface-2)", borderColor: "var(--dash-border-subtle)", color: "var(--dash-text)" }}
                                    disabled={isSubmitting}
                                    required
                                />
                                {/* TODO: Hydrate this field from the authenticated user instead of the mock currentUser object. */}
                            </Field>

                            <Field label="Author Email" htmlFor="author-email" required>
                                <input
                                    id="author-email"
                                    type="email"
                                    value={authorEmail}
                                    onChange={(event) => setAuthorEmail(event.target.value)}
                                    placeholder="author@company.com"
                                    className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-all placeholder:text-[#6B6660] focus:border-[var(--dash-accent)]"
                                    style={{ background: "var(--dash-surface-2)", borderColor: "var(--dash-border-subtle)", color: "var(--dash-text)" }}
                                    disabled={isSubmitting}
                                    required
                                />
                                {/* TODO: Hydrate this field from the authenticated user instead of the mock currentUser object. */}
                            </Field>
                        </div>

                        <Field label="Sector" htmlFor="paper-sector">
                            <select
                                id="paper-sector"
                                value={selectedSectorId}
                                onChange={(event) => setSelectedSectorId(event.target.value)}
                                disabled={isSubmitting || isLoadingSectors || !!sectorsError}
                                className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-all focus:border-[var(--dash-accent)] disabled:cursor-not-allowed disabled:opacity-60"
                                style={{ background: "var(--dash-surface-2)", borderColor: "var(--dash-border-subtle)", color: "var(--dash-text)" }}
                            >
                                <option value="" style={{ background: "var(--dash-surface-2)", color: "var(--dash-text-muted)" }}>
                                    {isLoadingSectors ? "Loading sectors..." : "Select a sector"}
                                </option>
                                {sectors.map((sector) => (
                                    <option
                                        key={sector.id}
                                        value={sector.id}
                                        style={{ background: "var(--dash-surface-2)", color: "var(--dash-text)" }}
                                    >
                                        {sector.name}
                                    </option>
                                ))}
                            </select>
                            {sectorsError ? (
                                <p className="mt-2 text-sm text-amber-300">{sectorsError}</p>
                            ) : (
                                <p className="mt-2 text-sm" style={{ color: "var(--dash-text-dim)" }}>
                                    Optional, but recommended for editorial routing.
                                </p>
                            )}
                        </Field>

                        <Field
                            label="Abstract"
                            htmlFor="paper-abstract"
                            required
                            aside={
                                <span
                                    className="text-xs font-medium"
                                    style={{ color: abstractLength >= ABSTRACT_MIN_LENGTH ? "var(--dash-text-dim)" : "var(--dash-accent)" }}
                                >
                                    {abstractLength} / {ABSTRACT_MIN_LENGTH} minimum
                                </span>
                            }
                        >
                            <textarea
                                id="paper-abstract"
                                value={abstract}
                                onChange={(event) => setAbstract(event.target.value)}
                                placeholder="Summarise the core argument, methods, and key findings."
                                rows={8}
                                className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition-all placeholder:text-[#6B6660] focus:border-[var(--dash-accent)]"
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
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                            style={{ background: "var(--dash-accent)", color: "#0A0A0B" }}
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
                        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{formError}</span>
                        </div>
                    ) : null}
                </div>
            </form>
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
