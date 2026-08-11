import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  MapPin,
  Sparkles,
} from "lucide-react";
import { formatContentDate } from "@/lib/date";
import {
  loadPublicEnergJobBySlug,
  loadRelatedPublicEnergJobs,
  type PublicEnergJob,
} from "@/lib/energjob-public";
import { getCanonicalUrl } from "@/lib/seo";
import EnergJobRichText from "@/components/energjob/energjob-rich-text";
import JobActionBar from "@/components/energjob/job-action-bar";
import JobApplyFlow from "@/components/energjob/job-apply-flow";
import GsapScrollAnimations from "@/components/gsap-scroll-animations";

export const dynamic = "force-dynamic";

function formatLabel(value: string | null) {
  if (!value) {
    return null;
  }

  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatNumber(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return null;
  }

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatSalary(min: number | null, max: number | null) {
  const minValue = formatNumber(min);
  const maxValue = formatNumber(max);

  if (minValue && maxValue) {
    return `${minValue} - ${maxValue}`;
  }

  return minValue || maxValue;
}

function formatExperience(min: number | null, max: number | null) {
  if (min === null && max === null) {
    return null;
  }

  if (min !== null && max !== null) {
    return `${min}-${max} years`;
  }

  if (min !== null) {
    return `${min}+ years`;
  }

  return `Up to ${max} years`;
}

function formatRelativeTime(dateStr: string | null) {
  if (!dateStr) {
    return null;
  }

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const now = new Date();
  const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor(
    (nowMidnight.getTime() - dateMidnight.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays <= 0) {
    return "today";
  }

  if (diffDays === 1) {
    return "yesterday";
  }

  return `${diffDays} days ago`;
}

function getInitials(name: string) {
  const cleaned = name.trim();
  if (!cleaned) {
    return "EJ";
  }

  return cleaned
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function CompanyMark({
  name,
  logoUrl,
  size = "h-16 w-16",
  rounded = "rounded-xl",
}: {
  name: string;
  logoUrl: string | null;
  size?: string;
  rounded?: string;
}) {
  if (logoUrl) {
    return (
      <div
        className={`${size} ${rounded} shrink-0 overflow-hidden border border-gray-200 bg-white`}
      >
        <img src={logoUrl} alt={name} className="h-full w-full object-contain" />
      </div>
    );
  }

  return (
    <div
      className={`flex ${size} ${rounded} shrink-0 items-center justify-center bg-gray-900 text-sm font-bold text-white`}
    >
      {getInitials(name)}
    </div>
  );
}

function absoluteWebsite(url: string | null) {
  if (!url) {
    return null;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `https://${url}`;
}

function appendUtmParams(url: string, campaign: string = "job_listing") {
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set("utm_source", "energdive");
    urlObj.searchParams.set("utm_medium", "energyjobs");
    urlObj.searchParams.set("utm_campaign", campaign);
    return urlObj.toString();
  } catch {
    return url;
  }
}

function buildKeywords(job: PublicEnergJob) {
  return Array.from(
    new Set(
      [
        job.title,
        job.companyName,
        job.location,
        ...job.sectors,
        ...job.skillTags,
        formatLabel(job.jobType),
        formatLabel(job.workMode),
        formatLabel(job.roleCategory),
        formatLabel(job.department),
      ].filter(Boolean)
    )
  ) as string[];
}

function buildJobPostingJsonLd(job: PublicEnergJob) {
  const hiringOrganization = job.companyName || job.recruiterName || "EnergJob Employer";
  const website = absoluteWebsite(job.companyWebsite);
  const salaryMin = formatNumber(job.salaryMin);
  const salaryMax = formatNumber(job.salaryMax);

  // Dynamically determine country from location to prevent invalid country code defaults
  let addressCountry = "IN";
  if (job.location) {
    const locLower = job.location.toLowerCase();
    if (locLower.includes("thailand") || locLower.includes("bangkok")) {
      addressCountry = "TH";
    } else if (locLower.includes("singapore")) {
      addressCountry = "SG";
    } else if (locLower.includes("uae") || locLower.includes("dubai")) {
      addressCountry = "AE";
    } else if (locLower.includes("uk") || locLower.includes("london") || locLower.includes("united kingdom")) {
      addressCountry = "GB";
    } else if (locLower.includes("usa") || locLower.includes("united states")) {
      addressCountry = "US";
    }
  }

  // Determine if salary is annual (e.g. lakhs in INR) vs monthly
  const isAnnual = (job.salaryMin && job.salaryMin > 100_000) || (job.salaryMax && job.salaryMax > 100_000);
  const unitText = isAnnual ? "YEAR" : "MONTH";

  // Fallback to current time if posting dates are unavailable to satisfy Google index validation
  const datePosted = job.publishedAt || job.createdAt || new Date().toISOString();

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.descriptionText || job.summary,
    identifier: {
      "@type": "PropertyValue",
      name: hiringOrganization,
      value: String(job.id),
    },
    datePosted,
    hiringOrganization: {
      "@type": "Organization",
      name: hiringOrganization,
      ...(website ? { sameAs: website } : {}),
    },
    employmentType: formatLabel(job.jobType),
    jobLocationType:
      formatLabel(job.workMode)?.toLowerCase() === "remote" ? "TELECOMMUTE" : undefined,
    applicantLocationRequirements: job.location
      ? {
          "@type": "Country",
          name: job.location,
        }
      : undefined,
    jobLocation: job.location
      ? {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: job.location,
            addressCountry,
          },
        }
      : undefined,
    industry: job.sectors.join(", "),
    qualifications: [job.qualification, ...job.requiredSkillLines].filter(Boolean).join(". "),
    responsibilities: job.keyResponsibilityLines.join(". "),
    skills: job.skillTags.join(", "),
    directApply: true,
    url: getCanonicalUrl(`/energyjobs/${job.routeSlug}`),
    ...(job.salaryMin || job.salaryMax
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: "INR",
            value: {
              "@type": "QuantitativeValue",
              ...(salaryMin ? { minValue: Number(job.salaryMin) } : {}),
              ...(salaryMax ? { maxValue: Number(job.salaryMax) } : {}),
              unitText,
            },
          },
        }
      : {}),
  };
}

function InterestedJobsPanel({ jobs }: { jobs: PublicEnergJob[] }) {
  return (
    <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
      <h2 className="text-lg font-bold tracking-tight text-gray-950">
        Jobs you might be interested in
      </h2>

      <div className="mt-4 divide-y divide-gray-100">
        {jobs.map((item) => {
          const relatedCompany =
            item.companyName || item.recruiterName || "Energy ecosystem employer";
          const posted = formatRelativeTime(item.publishedAt || item.createdAt);
          const roleMeta = [
            formatLabel(item.jobType),
            formatExperience(item.experienceMin, item.experienceMax),
          ]
            .filter(Boolean)
            .join(" | ");

          return (
            <Link
              key={item.routeSlug}
              href={`/energyjobs/${item.routeSlug}`}
              className="group flex gap-4 py-5 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-sm font-bold leading-snug text-gray-950 transition-colors group-hover:text-[#1155cc]">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm font-medium text-gray-700">{relatedCompany}</p>
                {roleMeta ? (
                  <p className="mt-2 text-xs font-medium text-gray-500">{roleMeta}</p>
                ) : null}
                {item.location ? (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-700">
                    <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                    <span className="line-clamp-1">{item.location}</span>
                  </p>
                ) : null}
                {posted ? (
                  <p className="mt-2 text-[11px] font-medium text-gray-400">
                    Posted {posted}
                  </p>
                ) : null}
              </div>

              <CompanyMark
                name={relatedCompany}
                logoUrl={item.companyLogoUrl}
                size="w-24 h-12"
                rounded="rounded-xl"
              />
            </Link>
          );
        })}
      </div>

      <Link
        href="/energyjobs"
        className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 transition-colors hover:border-gray-300 hover:bg-gray-50"
      >
        View more jobs
        <ArrowRight className="h-4 w-4" />
      </Link>
    </aside>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = await loadPublicEnergJobBySlug(slug);

  if (!job) {
    return {
      title: { absolute: "Job not found | EnergyJobs" },
    };
  }

  const company = job.companyName || job.recruiterName || "EnergyJobs";
  const title = `${job.title} at ${company} | EnergyJobs`;
  const description =
    job.summary ||
    `Explore ${job.title} at ${company} on EnergyJobs across ${job.sectors.join(", ")}.`;

  return {
    title: { absolute: title },
    description,
    keywords: buildKeywords(job),
    alternates: {
      canonical: getCanonicalUrl(`/energyjobs/${job.routeSlug}`),
    },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(`/energyjobs/${job.routeSlug}`),
      siteName: "ENERGDIVE",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function EnergJobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await loadPublicEnergJobBySlug(slug);

  if (!job) {
    notFound();
  }

  const relatedJobs = await loadRelatedPublicEnergJobs(job, 6);
  const company = job.companyName || job.recruiterName || "Energy ecosystem employer";
  const salary = formatSalary(job.salaryMin, job.salaryMax);
  const experience = formatExperience(job.experienceMin, job.experienceMax);
  const website = absoluteWebsite(job.companyWebsite);
  const jobPostingJsonLd = buildJobPostingJsonLd(job);
  const shareUrl = getCanonicalUrl(`/energyjobs/${job.routeSlug}`);
  const shareTitle = `${job.title} at ${company}`;
  const shareText = job.summary || `Explore ${job.title} at ${company} on EnergyJobs.`;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f7fbfa] via-[#fbfcfb] to-white pb-20 text-[#121417]">
      <GsapScrollAnimations />
      <Script
        id={`energjob-jobposting-${job.routeSlug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd) }}
      />

      <section className="border-b border-black/6 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-[1240px] px-5 py-4 sm:px-6 lg:px-10">
          <Link
            href="/energyjobs"
            className="group inline-flex items-center gap-2 text-sm font-bold text-[#143f52] transition-all duration-200 hover:text-[#09B697] hover:gap-3"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            Back to jobs
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1260px] px-5 pt-8 sm:px-6 lg:px-10 lg:pt-10 gsap-fade-up">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0 space-y-6">
          {/* Top Header Card */}
          <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
            {/* Row 1: Logo & Company Name / Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <CompanyMark
                  name={company}
                  logoUrl={job.companyLogoUrl}
                  size="w-32 h-16 sm:w-40 sm:h-20"
                  rounded="rounded-xl"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-gray-900 text-lg">{company}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Actively hiring
                    </span>
                  </div>
                  {job.companyWebsite && (
                    <a
                      href={appendUtmParams(website || "")}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-gray-500 hover:text-[#09B697] hover:underline block mt-0.5"
                    >
                      {job.companyWebsite.replace(/^https?:\/\/(www\.)?/, "")}
                    </a>
                  )}
                  {/* Tag chips */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {job.sectors.slice(0, 2).map((sec) => (
                      <span key={sec} className="rounded bg-[#09B697]/8 px-2.5 py-0.5 text-xs font-semibold text-[#11624f]">
                        {sec}
                      </span>
                    ))}
                    {job.jobType && (
                      <span className="rounded bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-600">
                        {formatLabel(job.jobType)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 shrink-0">
                <JobActionBar
                  jobId={job.id}
                  shareTitle={shareTitle}
                  shareText={shareText}
                  shareUrl={shareUrl}
                  minimal={true}
                />
                <JobApplyFlow
                  autoOpenOnReturn={false}
                  buttonLabel="Apply Now"
                  buttonClassName="inline-flex h-11 items-center justify-center rounded-lg bg-black px-6 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
                  companyName={company}
                  jobId={job.id}
                  jobSlug={job.slug}
                  jobSnapshot={job}
                  jobTitle={job.title}
                  routeSlug={job.routeSlug}
                  hideIcon={true}
                />
              </div>
            </div>

            {/* Row 2: Job Title and Meta Line */}
            <div className="pt-6">
              <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl lg:text-3xl">
                {job.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-gray-700 sm:text-base">
                {[
                  salary ? `₹${salary}` : null,
                  job.location,
                  formatLabel(job.workMode),
                  experience
                ].filter(Boolean).map((item, index) => (
                  <span key={item} className="flex items-center">
                    {index > 0 && <span className="mx-2 text-gray-300">|</span>}
                    {item}
                  </span>
                ))}
              </div>
              {job.publishedAt || job.createdAt ? (
                <p className="mt-3 text-xs text-gray-400">
                  Posted {formatContentDate(job.publishedAt || job.createdAt)}
                </p>
              ) : null}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 my-6" />

            {/* Row 3: Grid of details */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Job Location</h4>
                <p className="mt-1 text-sm font-bold text-gray-900">{job.location || "Not specified"}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Remote Work Policy</h4>
                <p className="mt-1 text-sm font-bold text-gray-900">{formatLabel(job.workMode) || "Not specified"}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Employment Type</h4>
                <p className="mt-1 text-sm font-bold text-gray-900">{formatLabel(job.jobType) || "Not specified"}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Experience</h4>
                <p className="mt-1 text-sm font-bold text-gray-900">{experience || "Not specified"}</p>
              </div>
              {job.qualification ? (
                <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Qualification</h4>
                  <p className="mt-1 text-sm font-bold leading-6 text-gray-900">{job.qualification}</p>
                </div>
              ) : null}
              {job.openings ? (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Openings</h4>
                  <p className="mt-1 text-sm font-bold text-gray-900">{job.openings}</p>
                </div>
              ) : null}
              {(job.recruiterName || job.recruiterEmail) && (
                <div className="sm:col-span-2 lg:col-span-3 border-t border-gray-100 pt-4 mt-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Hiring Contact</h4>
                  <div className="mt-2 flex items-center gap-3">
                    <CompanyMark
                      name={job.recruiterName || company}
                      logoUrl={job.companyLogoUrl}
                      size="h-10 w-10"
                      rounded="rounded-lg"
                    />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{job.recruiterName || "Hiring Manager"}</p>
                      {job.recruiterEmail && (
                        <a href={`mailto:${job.recruiterEmail}`} className="text-xs text-gray-500 hover:text-[#09B697] hover:underline">
                          {job.recruiterEmail}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </article>

          {/* About the Job Card */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              About the job
            </h2>
            {job.location && (
              <p className="mt-1 text-sm text-gray-500">
                Location: {job.location} ({formatLabel(job.workMode) || "on-site"})
              </p>
            )}
            <div className="mt-5 prose prose-slate max-w-none text-gray-800 leading-relaxed text-[15px] sm:text-base">
              <EnergJobRichText
                content={job.description}
                emptyFallback="Detailed job description will be available soon."
              />
            </div>
          </section>

          {/* Apply button and Share button for quick access below content */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <JobApplyFlow
              autoOpenOnReturn={false}
              buttonLabel="Apply for this position"
              buttonClassName="inline-flex h-11 items-center justify-center rounded-lg bg-black px-6 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
              companyName={company}
              jobId={job.id}
              jobSlug={job.slug}
              jobSnapshot={job}
              jobTitle={job.title}
              routeSlug={job.routeSlug}
              hideIcon={true}
            />
            <JobActionBar
              jobId={job.id}
              shareTitle={shareTitle}
              shareText={shareText}
              shareUrl={shareUrl}
              minimal={true}
            />
          </div>

          {/* Key Responsibilities */}
          {job.keyResponsibilityLines.length > 0 && (
            <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                What you&apos;ll do
              </h2>
              <ul className="mt-4 space-y-2.5 list-disc pl-5 text-gray-800 leading-relaxed text-[15px] sm:text-base">
                {job.keyResponsibilityLines.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Required Skills */}
          {job.requiredSkillLines.length > 0 && (
            <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                What we&apos;re looking for
              </h2>
              <ul className="mt-4 space-y-2.5 list-disc pl-5 text-gray-800 leading-relaxed text-[15px] sm:text-base">
                {job.requiredSkillLines.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Good to have */}
          {job.goodToHaveLines.length > 0 && (
            <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                Good to have
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {job.goodToHaveLines.map((item, index) => (
                  <span
                    key={`${item}-${index}`}
                    className="rounded-full bg-[#f1e8fb] px-3.5 py-1.5 text-xs font-semibold text-[#6a477f]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* About Company */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-600 mb-4">
              <Sparkles className="h-5 w-5" />
              <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                About the company
              </h2>
            </div>
            <div className="prose prose-slate max-w-none text-gray-800 leading-relaxed text-[15px] sm:text-base">
              <EnergJobRichText
                content={job.companyDescription}
                emptyFallback={`${company} is actively hiring through EnergJob.`}
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {job.companyAddress && (
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-[#fbfcfb] px-4 py-2 text-sm font-medium text-gray-700">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {job.companyAddress}
                </span>
              )}
              {website && (
                <a
                  href={appendUtmParams(website)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-[#fbfcfb] px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-[#09B697] hover:text-[#09B697]"
                >
                  <Globe className="h-4 w-4 text-gray-400" />
                  Visit company site
                </a>
              )}
            </div>
          </section>
          </div>

          {relatedJobs.length > 0 ? <InterestedJobsPanel jobs={relatedJobs} /> : null}
        </div>
      </section>

    </main>
  );
}
