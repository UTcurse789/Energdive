"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { ArrowRight, CheckCircle2, CloudUpload, FileText, Loader2, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicEnergJob } from "@/lib/energjob-public";

type JobApplyFlowProps = {
  autoOpenOnReturn?: boolean;
  buttonClassName: string;
  buttonLabel?: string;
  companyName: string;
  jobId: number | string;
  jobSlug?: string | null;
  jobSnapshot: PublicEnergJob;
  jobTitle: string;
  routeSlug: string;
  hideIcon?: boolean;
};

function buildReturnUrl(pathname: string, searchParams: { toString(): string }) {
  const nextParams = new URLSearchParams(searchParams.toString());
  nextParams.set("apply", "1");
  const query = nextParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export default function JobApplyFlow({
  autoOpenOnReturn = false,
  buttonClassName,
  buttonLabel = "Apply Now",
  companyName,
  jobId,
  jobSlug,
  jobSnapshot,
  jobTitle,
  routeSlug,
  hideIcon = false,
}: JobApplyFlowProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitNotice, setSubmitNotice] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [resumeFileId, setResumeFileId] = useState<number | null>(null);
  const [resumeFileName, setResumeFileName] = useState("");
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [coverNote, setCoverNote] = useState("");
  const autoHandledRef = useRef(false);

  const currentPath = pathname || `/energyjobs/${routeSlug}`;
  const returnUrl = useMemo(
    () => buildReturnUrl(currentPath, searchParams),
    [currentPath, searchParams]
  );

  useEffect(() => {
    if (!user) {
      return;
    }

    const fullName =
      user.fullName ||
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    const email = user.primaryEmailAddress?.emailAddress || "";

    if (fullName) {
      setApplicantName((current) => current || fullName);
    }

    if (email) {
      setApplicantEmail((current) => current || email);
    }
  }, [user]);

  useEffect(() => {
    if (!autoOpenOnReturn || autoHandledRef.current || !isLoaded || !isSignedIn) {
      return;
    }

    if (searchParams.get("apply") !== "1") {
      return;
    }

    autoHandledRef.current = true;
    setSubmitError("");
    setIsOpen(true);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("apply");
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${currentPath}?${nextQuery}` : currentPath, { scroll: false });
  }, [autoOpenOnReturn, currentPath, isLoaded, isSignedIn, router, searchParams]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const resetApplicationState = () => {
    setIsSubmitted(false);
    setSubmitError("");
    setSubmitNotice("");
    setPhone("");
    setResumeUrl("");
    setResumeFileId(null);
    setResumeFileName("");
    setIsUploadingResume(false);
    setCoverNote("");
  };

  const handleResumeChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setSubmitError("");

    if (!file) {
      return;
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setSubmitError("Only PDF, JPEG, and PNG resumes are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSubmitError("Resume file size must be 5MB or less.");
      return;
    }

    setIsUploadingResume(true);
    setResumeUrl("");
    setResumeFileId(null);
    setResumeFileName("");

    try {
      const formData = new FormData();
      formData.set("resume", file);

      const response = await fetch("/api/energjob/resume-upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Resume upload failed.");
      }

      setResumeUrl(result.resumeUrl);
      setResumeFileId(result.strapiFileId || null);
      setResumeFileName(result.fileName || file.name);
    } catch (error: any) {
      setSubmitError(error?.message || "Resume upload failed.");
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleApplyClick = () => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      router.push(`/auth?redirect_url=${encodeURIComponent(returnUrl)}`);
      return;
    }

    resetApplicationState();
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    setIsOpen(false);
    setSubmitError("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");
    setSubmitNotice("");

    if (!resumeUrl) {
      setSubmitError("Please upload your resume before applying.");
      setIsSubmitting(false);
      return;
    }

    if (isUploadingResume) {
      setSubmitError("Please wait for the resume upload to finish.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/energjob/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
          jobSlug,
          routeSlug,
          jobCmsDocumentId: jobSnapshot.cmsDocumentId,
          jobSnapshot,
          applicantName,
          applicantEmail,
          phone,
          resumeUrl,
          resumeFileId,
          coverNote,
          earlyApplicant: true,
          applicationStatus: "received",
        }),
      });

      const result = await response.json();
      const acceptedWithLocalSave = response.status === 202 && Boolean(result?.local);

      if ((!response.ok && !acceptedWithLocalSave) || (!result.success && !acceptedWithLocalSave)) {
        throw new Error(result.error || "Application could not be submitted.");
      }

      if (result.syncStatus === "failed") {
        setSubmitNotice(
          result.warning ||
            "Your application was saved. CMS sync is pending, but the hiring team has been notified."
        );
      }

      setIsSubmitted(true);
    } catch (error: any) {
      setSubmitError(error?.message || "Application could not be submitted.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Normalize external URL: trim whitespace, treat empty strings, "null", and "undefined" as null
  const externalUrl = useMemo(() => {
    if (!jobSnapshot || !jobSnapshot.externalApplyUrl) {
      return null;
    }
    const val = String(jobSnapshot.externalApplyUrl).trim();
    if (!val || val.toLowerCase() === "null" || val.toLowerCase() === "undefined") {
      return null;
    }
    return val;
  }, [jobSnapshot?.externalApplyUrl]);

  // Debug: log the external URL value on both server (SSR) and client
  console.log(
    `[JobApplyFlow Render] jobId=${jobId} title="${jobTitle}" externalApplyUrl=${JSON.stringify(jobSnapshot?.externalApplyUrl)} → resolvedExternalUrl=${JSON.stringify(externalUrl)}`
  );

  if (externalUrl) {
    return (
      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClassName}
      >
        {buttonLabel}
        {!hideIcon && <ArrowRight className="h-4 w-4" />}
      </a>
    );
  }

  return (
    <>
      <button type="button" onClick={handleApplyClick} className={buttonClassName}>
        {buttonLabel}
        {!hideIcon && <ArrowRight className="h-4 w-4" />}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-[#09111f]/60 px-4 py-8 backdrop-blur-md sm:items-center sm:py-6 animate-[fadeIn_0.2s_ease-out]">
          <div className="absolute inset-0" onClick={handleClose} />

          <div className="relative z-[1] w-full max-w-[660px] overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-[0_32px_80px_rgba(9,29,58,0.28),0_0_0_1px_rgba(255,255,255,0.06)] animate-[slideUp_0.3s_ease-out]">
            {/* ── Header with gradient accent ── */}
            <div className="relative overflow-hidden border-b border-black/6 bg-gradient-to-br from-[#f8fffe] via-[#f4fbf9] to-[#eef7f5] px-7 py-6 sm:px-9">
              {/* Decorative gradient orb */}
              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#09B697]/10 blur-3xl" />
              <div className="pointer-events-none absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-[#143f52]/6 blur-2xl" />

              <button
                type="button"
                onClick={handleClose}
                className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/8 bg-white/80 text-[#46556f] shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-[#09B697]/40 hover:text-[#09B697] hover:shadow-md"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative">
                <img
                  src="/Energdive-Logo.png"
                  alt="Energdive"
                  className="h-7 w-auto object-contain"
                />
                <div className="mt-5 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#09B697]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[#09B697]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#09B697] animate-pulse" />
                    One-click apply
                  </span>
                </div>
                <h2 className="mt-3 text-[1.6rem] font-black leading-tight tracking-[-0.04em] text-[#091d3a]">
                  {jobTitle}
                </h2>
                <p className="mt-1.5 text-sm font-medium text-black/55">{companyName}</p>
              </div>
            </div>

            {isSubmitted ? (
              /* ── Success State ── */
              <div className="px-7 py-12 text-center sm:px-9">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#09B697]/10">
                  <CheckCircle2 className="h-9 w-9 text-[#09B697] animate-[scaleIn_0.4s_ease-out]" />
                </div>
                <h3 className="mt-5 text-2xl font-black tracking-[-0.04em] text-[#091d3a]">
                  Application submitted!
                </h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-black/58">
                  Your details have been saved and the hiring team has been notified. A confirmation has been sent to your email.
                </p>
                <div className="mt-7 flex justify-center">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#121417] px-6 text-sm font-bold text-white transition-all duration-200 hover:bg-[#09B697] hover:shadow-lg hover:shadow-[#09B697]/20"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* ── Application Form ── */
              <form onSubmit={handleSubmit} className="max-h-[65vh] overflow-y-auto px-7 py-7 sm:px-9">
                <div className="grid gap-5 sm:grid-cols-2">
                  {/* Name */}
                  <label className="group block">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#46556f]">
                      Full Name
                    </span>
                    <input
                      required
                      value={applicantName}
                      onChange={(event) => setApplicantName(event.target.value)}
                      className="mt-2 h-[52px] w-full rounded-2xl border border-black/8 bg-[#fafcfb] px-4 text-sm font-medium text-[#091d3a] outline-none ring-2 ring-transparent transition-all duration-200 placeholder:text-black/30 focus:border-[#09B697]/40 focus:bg-white focus:ring-[#09B697]/12"
                    />
                  </label>

                  {/* Email */}
                  <label className="group block">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#46556f]">
                      Email
                    </span>
                    <input
                      required
                      type="email"
                      value={applicantEmail}
                      onChange={(event) => setApplicantEmail(event.target.value)}
                      className="mt-2 h-[52px] w-full rounded-2xl border border-black/8 bg-[#fafcfb] px-4 text-sm font-medium text-[#091d3a] outline-none ring-2 ring-transparent transition-all duration-200 placeholder:text-black/30 focus:border-[#09B697]/40 focus:bg-white focus:ring-[#09B697]/12"
                    />
                  </label>

                  {/* Phone */}
                  <label className="group block">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#46556f]">
                      Phone
                    </span>
                    <input
                      required
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="+91 98765 43210"
                      className="mt-2 h-[52px] w-full rounded-2xl border border-black/8 bg-[#fafcfb] px-4 text-sm font-medium text-[#091d3a] outline-none ring-2 ring-transparent transition-all duration-200 placeholder:text-black/30 focus:border-[#09B697]/40 focus:bg-white focus:ring-[#09B697]/12"
                    />
                  </label>

                  {/* Resume Upload */}
                  <div className="block">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#46556f]">
                      Resume
                    </span>
                    <div className={`mt-2 rounded-2xl border-2 border-dashed px-4 py-4 transition-all duration-200 ${
                      resumeUrl
                        ? "border-[#09B697]/30 bg-[#09B697]/[0.04]"
                        : "border-black/10 bg-[#fafcfb] hover:border-[#09B697]/25 hover:bg-[#09B697]/[0.02]"
                    }`}>
                      {resumeUrl ? (
                        /* File uploaded state */
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#09B697]/12">
                            <FileText className="h-5 w-5 text-[#09B697]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[#091d3a]">
                              {resumeFileName}
                            </p>
                            <p className="text-[11px] text-[#09B697] font-medium">Uploaded ✓</p>
                          </div>
                          <label className="cursor-pointer text-xs font-bold text-[#46556f] transition-colors hover:text-[#09B697]">
                            Replace
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                              onChange={handleResumeChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      ) : (
                        /* Upload prompt state */
                        <label className="flex cursor-pointer flex-col items-center gap-2 py-1 text-center">
                          {isUploadingResume ? (
                            <Loader2 className="h-6 w-6 animate-spin text-[#09B697]" />
                          ) : (
                            <CloudUpload className="h-6 w-6 text-[#09B697]/60" />
                          )}
                          <div>
                            <p className="text-sm font-semibold text-[#091d3a]">
                              {isUploadingResume ? "Uploading..." : "Upload resume"}
                            </p>
                            <p className="mt-0.5 text-[11px] text-black/45">
                              PDF, JPEG, or PNG · Max 5MB
                            </p>
                          </div>
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                            onChange={handleResumeChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cover Note */}
                <label className="mt-5 block">
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#46556f]">
                    Why are you a fit? <span className="normal-case tracking-normal text-black/35">(optional)</span>
                  </span>
                  <textarea
                    value={coverNote}
                    onChange={(event) => setCoverNote(event.target.value)}
                    rows={4}
                    placeholder="Add a quick note for the recruiter..."
                    className="mt-2 w-full rounded-2xl border border-black/8 bg-[#fafcfb] px-4 py-3.5 text-sm font-medium text-[#091d3a] outline-none ring-2 ring-transparent transition-all duration-200 placeholder:text-black/30 focus:border-[#09B697]/40 focus:bg-white focus:ring-[#09B697]/12"
                  />
                </label>

                {/* Error */}
                {submitError ? (
                  <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50/80 px-4 py-3.5">
                    <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-400" />
                    <p className="text-sm leading-6 text-red-600">{submitError}</p>
                  </div>
                ) : null}

                {/* Submit */}
                <div className="mt-6 flex flex-col gap-4 border-t border-black/6 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[11px] leading-5 text-black/42">
                    We&apos;ll store your application in EnergJob, sync it to the hiring CMS,
                    and notify both you and the recruiter.
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-[52px] shrink-0 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-b from-[#1a1f25] to-[#121417] px-7 text-sm font-bold text-white shadow-lg shadow-black/10 transition-all duration-200 hover:from-[#09B697] hover:to-[#078a72] hover:shadow-[#09B697]/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {isSubmitting ? "Submitting..." : "Submit application"}
                    {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {/* Keyframe animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.6);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}
