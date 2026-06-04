"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Mail,
  Phone,
  FileText,
  CheckCircle2,
  User,
  Clock,
  Sparkles,
  Download,
  Calendar,
  Eye,
  Loader2,
  ChevronRight,
} from "lucide-react";

interface Application {
  id: number;
  job_id: number;
  applicant_name: string;
  applicant_email: string;
  phone: string | null;
  resume_url: string | null;
  cover_note: string | null;
  early_applicant: boolean;
  application_status: string;
  created_at: string;
}

interface Job {
  id: number;
  title: string;
  slug: string;
}

interface ClientReviewManagerProps {
  application: Application;
  job: Job | null;
  companyName: string;
  token: string;
}

export default function ClientReviewManager({
  application,
  job,
  companyName,
  token,
}: ClientReviewManagerProps) {
  const [status, setStatus] = useState<string>(application.application_status);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-mark as viewed on mount if status is received
  useEffect(() => {
    if (application.application_status === "received") {
      updateStatus("viewed");
    }
  }, []);

  const updateStatus = async (newStatus: "viewed" | "shortlisted") => {
    setIsUpdating(true);
    setError(null);

    try {
      const res = await fetch(`/api/energjob/applications/${application.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          token,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to update status to ${newStatus}`);
      }

      setStatus(newStatus);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while updating status.");
    } finally {
      setIsUpdating(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  };

  const appliedDate = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(application.created_at));

  // Determine active states for timeline
  const isReceivedActive = true;
  const isViewedActive = status === "viewed" || status === "shortlisted";
  const isShortlistedActive = status === "shortlisted";

  return (
    <div className="min-h-screen bg-[#fafcfb] pb-16 font-sans">
      {/* ── Header banner ── */}
      <div 
        className="relative overflow-hidden py-12 text-white"
        style={{ background: 'linear-gradient(135deg, #091d3a 0%, #0b284e 50%, #051122 100%)' }}
      >
        {/* Glow effects */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#09B697]/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-[#09B697]/10 blur-2xl" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#09B697]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#09B697]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#09B697] animate-pulse" />
                Candidate Application Review
              </div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
                {job ? job.title : "Applied Job Role"}
              </h1>
              <p className="mt-2 text-base font-medium text-white/70 flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-[#09B697]" />
                {companyName}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-white/50">Applied on:</span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-bold text-white">
                <Calendar className="h-3.5 w-3.5 text-[#09B697]" />
                {appliedDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600 shadow-sm animate-shake">
            ⚠️ {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* ── Left Column: Candidate Profile Details ── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Applicant Card */}
            <div className="rounded-[24px] border border-black/[0.04] bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                {/* Avatar */}
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-[#09B697]/10 text-xl font-bold tracking-wider text-[#09B697]">
                  {getInitials(application.applicant_name)}
                </div>
                <div className="space-y-4 flex-1">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#091d3a]">
                      {application.applicant_name}
                    </h2>
                    {application.early_applicant && (
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#09B697]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#09B697]">
                        <Sparkles className="h-3 w-3" /> Early Applicant
                      </span>
                    )}
                  </div>

                  <div className="grid gap-4 border-t border-black/[0.04] pt-4 sm:grid-cols-2">
                    <a
                      href={`mailto:${application.applicant_email}`}
                      className="group flex items-center gap-3 rounded-2xl border border-black/5 bg-[#fafcfb] p-3 text-sm transition-all duration-200 hover:border-[#09B697]/30 hover:bg-[#09B697]/[0.02]"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#46556f] shadow-sm transition-colors group-hover:text-[#09B697]">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">
                          Email Address
                        </p>
                        <p className="truncate font-semibold text-[#091d3a]">
                          {application.applicant_email}
                        </p>
                      </div>
                    </a>

                    <a
                      href={`tel:${application.phone || ""}`}
                      className={`group flex items-center gap-3 rounded-2xl border border-black/5 bg-[#fafcfb] p-3 text-sm transition-all duration-200 ${
                        application.phone
                          ? "hover:border-[#09B697]/30 hover:bg-[#09B697]/[0.02]"
                          : "opacity-60 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#46556f] shadow-sm">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">
                          Phone Number
                        </p>
                        <p className="truncate font-semibold text-[#091d3a]">
                          {application.phone || "Not provided"}
                        </p>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Cover Note Section */}
            <div className="rounded-[24px] border border-black/[0.04] bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] sm:p-8">
              <h3 className="text-lg font-bold text-[#091d3a] flex items-center gap-2">
                <span className="inline-block h-6 w-1.5 rounded-full bg-[#09B697]" />
                Cover Note / Message
              </h3>
              <div className="mt-4 rounded-2xl border border-black/[0.03] bg-[#fafcfb] p-5">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#46556f]">
                  {application.cover_note || "The candidate did not include a cover note."}
                </p>
              </div>
            </div>

            {/* Resume Section */}
            <div className="rounded-[24px] border border-black/[0.04] bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] sm:p-8">
              <h3 className="text-lg font-bold text-[#091d3a] flex items-center gap-2">
                <span className="inline-block h-6 w-1.5 rounded-full bg-[#09B697]" />
                Candidate Resume
              </h3>

              {application.resume_url ? (
                <div className="mt-5 space-y-4">
                  <div className="flex flex-col gap-4 rounded-2xl border border-[#09B697]/25 bg-[#09B697]/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#09B697]/10">
                        <FileText className="h-6 w-6 text-[#09B697]" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#091d3a]">
                          {application.applicant_name.replace(/\s+/g, "_")}_Resume.pdf
                        </p>
                        <p className="text-xs text-[#09B697] font-semibold">Official Document</p>
                      </div>
                    </div>
                    <a
                      href={application.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#091d3a] px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#09B697] hover:shadow-md hover:shadow-[#09B697]/20"
                    >
                      <Download className="h-4 w-4" /> Download PDF
                    </a>
                  </div>

                  {/* PDF embed preview */}
                  <div className="overflow-hidden rounded-2xl border border-black/5 bg-[#fafcfb] shadow-inner">
                    <iframe
                      src={`${application.resume_url}#toolbar=0`}
                      className="h-[600px] w-full border-0"
                      title="Candidate Resume Preview"
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-black/10 bg-[#fafcfb] py-12 text-center">
                  <FileText className="mx-auto h-10 w-10 text-black/30" />
                  <p className="mt-3 text-sm font-medium text-[#46556f]">
                    No resume document was attached to this application.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column: Status Tracker & Action Panel ── */}
          <div className="space-y-8">
            {/* Status Timeline */}
            <div className="rounded-[24px] border border-black/[0.04] bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] sm:p-8">
              <h3 className="text-lg font-bold text-[#091d3a] flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#09B697]" />
                Application Status
              </h3>

              <div className="relative mt-8 space-y-6">
                {/* Timeline Step 1: Received */}
                <div className="flex relative" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  {/* Vertical connector line segment to next step */}
                  <div className="absolute left-[7px] top-4 bottom-0 w-0.5 bg-black/[0.06] -mb-6 z-0" />
                  <div className="relative z-10 rounded-full bg-white" style={{ display: 'flex', width: '16px', height: '16px', flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>
                    <div
                      className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ring-4 ${
                        isReceivedActive
                          ? "bg-[#09B697] ring-[#09B697]/15"
                          : "bg-white border border-black/15 ring-transparent"
                      }`}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#091d3a]">Application Received</h4>
                    <p className="mt-0.5 text-xs text-[#6b7280]">
                      The application was submitted and logged.
                    </p>
                  </div>
                </div>

                {/* Timeline Step 2: Viewed */}
                <div className="flex relative" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  {/* Vertical connector line segment to next step */}
                  <div className="absolute left-[7px] top-4 bottom-0 w-0.5 bg-black/[0.06] -mb-6 z-0" />
                  <div className="relative z-10 rounded-full bg-white" style={{ display: 'flex', width: '16px', height: '16px', flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>
                    <div
                      className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ring-4 ${
                        isViewedActive
                          ? "bg-[#09B697] ring-[#09B697]/15"
                          : "bg-white border border-black/15 ring-transparent"
                      }`}
                    />
                  </div>
                  <div>
                    <h4
                      className={`text-sm font-bold ${
                        isViewedActive ? "text-[#091d3a]" : "text-black/45"
                      }`}
                    >
                      Viewed by Recruiter
                    </h4>
                    <p className="mt-0.5 text-xs text-[#6b7280]">
                      {isViewedActive
                        ? "Hiring team opened and reviewed the details."
                        : "Pending review by the hiring manager."}
                    </p>
                  </div>
                </div>

                {/* Timeline Step 3: Shortlisted */}
                <div className="flex relative" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div className="relative z-10 rounded-full bg-white" style={{ display: 'flex', width: '16px', height: '16px', flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>
                    <div
                      className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ring-4 ${
                        isShortlistedActive
                          ? "bg-[#10b981] ring-[#10b981]/15"
                          : "bg-white border border-black/15 ring-transparent"
                      }`}
                    />
                  </div>
                  <div>
                    <h4
                      className={`text-sm font-bold ${
                        isShortlistedActive ? "text-[#10b981]" : "text-black/45"
                      }`}
                    >
                      Shortlisted
                    </h4>
                    <p className="mt-0.5 text-xs text-[#6b7280]">
                      {isShortlistedActive
                        ? "Candidate selected for further evaluation!"
                        : "Pending final candidate shortlist selection."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recruiter Action Card */}
            <div className="rounded-[24px] border border-black/[0.04] bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] sm:p-8">
              <h3 className="text-lg font-bold text-[#091d3a] flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#09B697]" />
                Hiring Actions
              </h3>
              <p className="mt-2 text-xs text-[#6b7280] leading-relaxed">
                Take action on this application. Shortlisting the candidate will update their status and notify them automatically via email.
              </p>

              <div className="mt-6">
                {status === "shortlisted" ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 text-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 animate-[bounce_1s_infinite]" />
                    <h4 className="mt-3 font-extrabold text-emerald-800">Candidate Shortlisted!</h4>
                    <p className="mt-1 text-xs text-emerald-600 leading-normal">
                      Status has been updated to Shortlisted. A congratulatory email has been dispatched to {application.applicant_name}.
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => updateStatus("shortlisted")}
                    disabled={isUpdating}
                    className="flex w-full h-12 items-center justify-center gap-2 rounded-2xl bg-[#09B697] text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#079f83] hover:shadow-lg hover:shadow-[#09B697]/20 disabled:opacity-70 disabled:cursor-not-allowed group"
                  >
                    {isUpdating ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Shortlist Candidate
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
