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

const SUBMISSIONS_ENDPOINT = "/api/submit-final-paper";
const FINAL_PAPER_MAX_FILE_SIZE_BYTES = 40 * 1024 * 1024;
const FINAL_PAPER_MAX_FILE_SIZE_LABEL = "40 MB";

function getSubmissionErrorMessage(response, responseText) {
    const fallback = "We couldn't submit your paper. Please try again.";

    if (responseText) {
        try {
            const parsed = JSON.parse(responseText);
            const message = parsed?.error?.message || parsed?.message || parsed?.error;
            if (typeof message === "string" && message.trim()) {
                return message;
            }
        } catch {
            // Ignore parse error, fallback to status checks below
        }
    }

    if (response.status === 413) {
        return `The server rejected this PDF before it could be uploaded. Files up to ${FINAL_PAPER_MAX_FILE_SIZE_LABEL} are allowed here, but the deployment upload limit needs to be increased.`;
    }

    if (!responseText || /<html[\s>]/i.test(responseText) || /<body[\s>]/i.test(responseText)) {
        return fallback;
    }

    return responseText;
}

export default function KnowledgeBaseFinalPaperForm({
    abstract,
    variant = "public",
    returnHref = "/dashboard/my-submissions",
    secondarySuccessHref = "/knowledge-hub",
    secondarySuccessLabel = "View Knowledge Hub",
}) {
    const [pdfFile, setPdfFile] = useState(null);
    const [formError, setFormError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const isDashboardVariant = variant === "dashboard";
    const accentTextColor = isDashboardVariant ? "#0A0A0B" : "#ffffff";

    const cardStyle = {
        background: "var(--dash-card)",
        border: "1px solid var(--dash-border)",
    };

    const mutedCardStyle = {
        background: "var(--dash-surface-2)",
        border: "1px solid var(--dash-border-subtle)",
    };

    useEffect(() => {
        if (!success) return;

        const timeoutId = window.setTimeout(() => {
            window.location.href = `/dashboard/my-submissions?submitted=2&title=${encodeURIComponent(abstract.title)}`;
        }, 900);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [success, abstract.title]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError("");

        if (!pdfFile) {
            setFormError("Please upload your final paper file.");
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                title: abstract.title,
                author_name: abstract.authorName,
                author_email: abstract.authorEmail,
                abstract_submission: abstract.id, // ID or documentId of the abstract
                final_status: "pending",
                final_submission_date: new Date().toISOString(),
            };

            const formData = new FormData();
            formData.append("files.full_paper", pdfFile);
            formData.append("data", JSON.stringify(payload));

            const response = await fetch(SUBMISSIONS_ENDPOINT, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const responseText = await response.text();
                throw new Error(getSubmissionErrorMessage(response, responseText));
            }

            setSuccess(true);
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Submission failed. Please check files and try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className={isDashboardVariant ? "" : "kb-submit-theme"}>
                <section className={isDashboardVariant ? "pb-6" : "bg-[var(--dash-bg)] pb-16 md:pb-10"}>
                    <div className={isDashboardVariant ? "pb-6" : "container pt-12 pb-12 md:pt-16 md:pb-16"}>
                        <div className="mx-auto max-w-3xl overflow-hidden rounded-[30px]" style={cardStyle}>
                            <div className="p-8 sm:p-10">
                                <div
                                    className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl"
                                    style={{ background: "rgba(9, 182, 151, 0.12)" }}
                                >
                                    <CheckCircle2 className="h-7 w-7" style={{ color: "var(--dash-accent)" }} />
                                </div>
                                <h1 className="text-3xl font-bold" style={{ color: "var(--dash-text)" }}>
                                    Final paper submitted
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-7 sm:text-base" style={{ color: "var(--dash-text-muted)" }}>
                                    Your final paper for <span className="font-semibold" style={{ color: "var(--dash-text)" }}>{abstract.title}</span> has
                                    been successfully uploaded. Redirecting you to My Submissions.
                                </p>
                            </div>

                            <div
                                className="flex flex-col gap-3 px-8 py-5 sm:flex-row sm:px-10"
                                style={{ borderTop: "1px solid var(--dash-border)" }}
                            >
                                <Link
                                    href="/dashboard/my-submissions?submitted=2"
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
            <section className={isDashboardVariant ? "pb-6" : "bg-[var(--dash-bg)] pb-16 md:pb-10"}>
                <div className={isDashboardVariant ? "pb-6" : "container pt-12 pb-12 md:pt-16 md:pb-10"}>
                    <div className={isDashboardVariant ? "max-w-4xl" : "mx-auto max-w-4xl"}>
                        <Link
                            href={returnHref}
                            className={`inline-flex items-center gap-2 text-sm transition-colors ${isDashboardVariant ? "" : "pt-10"}`}
                            style={{ color: "var(--dash-text-dim)" }}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to My Submissions
                        </Link>

                        <div className="mt-6 mb-7">
                            <h1 className={isDashboardVariant ? "text-3xl font-bold sm:text-4xl" : "text-4xl font-bold sm:text-5xl"} style={{ color: "var(--dash-text)" }}>
                                Submit final paper
                            </h1>
                            <p className="mt-4 max-w-2xl text-sm leading-7 sm:text-base" style={{ color: "var(--dash-text-muted)" }}>
                                Upload the full manuscript for your approved abstract submission.
                            </p>
                        </div>

                        {/* Read-Only Abstract Preview */}
                        <div className="mb-8 min-w-0 rounded-[24px] p-6 border transition-all" style={cardStyle}>
                            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "var(--dash-accent)" }}>
                                Linked Abstract Information
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <span className="text-xs" style={{ color: "var(--dash-text-dim)" }}>Title</span>
                                    <h2 className="mt-1 text-xl font-bold leading-snug break-words [overflow-wrap:anywhere]" style={{ color: "var(--dash-text)" }}>
                                        {abstract.title}
                                    </h2>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2 pt-2">
                                    <div className="min-w-0">
                                        <span className="text-xs" style={{ color: "var(--dash-text-dim)" }}>Author</span>
                                        <p className="text-sm font-semibold mt-0.5 break-words [overflow-wrap:anywhere]" style={{ color: "var(--dash-text)" }}>
                                            {abstract.authorName} ({abstract.authorEmail})
                                        </p>
                                    </div>
                                    {abstract.coAuthor && (
                                        <div className="min-w-0">
                                            <span className="text-xs" style={{ color: "var(--dash-text-dim)" }}>Co-Author</span>
                                            <p className="text-sm font-semibold mt-0.5 break-words [overflow-wrap:anywhere]" style={{ color: "var(--dash-text)" }}>
                                                {abstract.coAuthor} {abstract.coAuthorEmail ? `(${abstract.coAuthorEmail})` : ""}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="grid gap-4 md:grid-cols-2 pt-2">
                                    {abstract.affiliation && (
                                        <div className="min-w-0">
                                            <span className="text-xs" style={{ color: "var(--dash-text-dim)" }}>Institution / Affiliation</span>
                                            <p className="text-sm font-semibold mt-0.5 break-words [overflow-wrap:anywhere]" style={{ color: "var(--dash-text)" }}>
                                                {abstract.affiliation}
                                            </p>
                                        </div>
                                    )}
                                    {abstract.primarySector && (
                                        <div className="min-w-0">
                                            <span className="text-xs" style={{ color: "var(--dash-text-dim)" }}>Sector</span>
                                            <p className="text-sm font-semibold mt-0.5 break-words [overflow-wrap:anywhere]" style={{ color: "var(--dash-text)" }}>
                                                {abstract.primarySector}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-3 border-t" style={{ borderColor: "var(--dash-border-subtle)" }}>
                                    <span className="text-xs" style={{ color: "var(--dash-text-dim)" }}>Abstract Summary</span>
                                    <p className="mt-1.5 max-w-full whitespace-pre-line text-sm leading-relaxed break-words [overflow-wrap:anywhere]" style={{ color: "var(--dash-text-muted)" }}>
                                        {abstract.abstract}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Submission Form */}
                        <form onSubmit={handleSubmit} className="overflow-hidden rounded-[30px] shadow-[0_24px_80px_rgba(0,0,0,0.06)]" style={cardStyle}>
                            <div className="p-6 sm:p-7">
                                <div className="mb-7 flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="flex h-10 w-10 items-center justify-center rounded-xl"
                                            style={{ background: "rgba(9, 182, 151, 0.12)" }}
                                        >
                                            <FileText size={18} style={{ color: "var(--dash-accent)" }} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold" style={{ color: "var(--dash-text)" }}>
                                                Upload Full Paper
                                            </h2>
                                            <p className="text-sm" style={{ color: "var(--dash-text-dim)" }}>
                                                Supported formats: PDF, DOC, DOCX. Max size: {FINAL_PAPER_MAX_FILE_SIZE_LABEL}.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-6">
                                    <UploadZone
                                        file={pdfFile}
                                        onFileSelect={setPdfFile}
                                        disabled={isSubmitting}
                                        label="Full Manuscript File"
                                        helperText={`PDF, DOC, or DOCX up to ${FINAL_PAPER_MAX_FILE_SIZE_LABEL}.`}
                                        accept=".pdf,application/pdf,.doc,application/msword,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                        allowedExtensions={[".pdf", ".doc", ".docx"]}
                                        maxFileSizeBytes={FINAL_PAPER_MAX_FILE_SIZE_BYTES}
                                        maxFileSizeLabel={FINAL_PAPER_MAX_FILE_SIZE_LABEL}
                                    />
                                </div>

                                {formError && (
                                    <div
                                        className="mt-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm"
                                        style={{ background: "rgba(239, 68, 68, 0.08)", borderColor: "rgba(239, 68, 68, 0.2)", color: "#EF4444" }}
                                    >
                                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                        <span>{formError}</span>
                                    </div>
                                )}

                                <div className="mt-8 flex justify-end border-t pt-6" style={{ borderColor: "var(--dash-border)" }}>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !pdfFile}
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                        style={{ background: "var(--dash-accent)", color: accentTextColor }}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Submitting paper...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4" />
                                                Submit Final Paper
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
