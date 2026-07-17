import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Globe,
  MapPin,
  Mail,
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
  size = "h-[72px] w-[72px]",
}: {
  name: string;
  logoUrl: string | null;
  size?: string;
}) {
  if (logoUrl) {
    return (
      <div
        className={`${size} shrink-0 overflow-hidden rounded-[22px] border border-[#d7e3ea] bg-white shadow-[0_6px_18px_rgba(20,63,82,0.08)]`}
      >
        <img src={logoUrl} alt={name} className="h-full w-full object-contain p-1" />
      </div>
    );
  }

  return (
    <div
      className={`flex ${size} shrink-0 items-center justify-center rounded-[22px] bg-[#143f52] text-lg font-black text-white`}
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

  const quickFacts = [
    {
      label: "Role type",
      value: formatLabel(job.jobType) || "Not specified",
    },
    {
      label: "Work mode",
      value: formatLabel(job.workMode) || "Not specified",
    },
    {
      label: "Location",
      value: job.location || "Not specified",
    },
    ...(job.openings
      ? [
          {
            label: "Openings",
            value: `${job.openings}`,
          },
        ]
      : []),
    {
      label: "Experience",
      value: experience || "Not specified",
    },
    {
      label: "Compensation",
      value: salary || "Not specified",
    },
    {
      label: "Qualification",
      value: job.qualification || "Not specified",
    },
  ];

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

      <section className="mx-auto w-full max-w-[1240px] px-5 pt-8 sm:px-6 lg:px-10 lg:pt-10 gsap-fade-up">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <article className="overflow-hidden rounded-[30px] border border-black/6 bg-white shadow-[0_24px_60px_rgba(20,63,82,0.07)]">
          <div className="relative border-b border-black/6 bg-gradient-to-br from-white via-[#fcfefd] to-[#f4faf8] px-5 py-6 sm:px-8 lg:px-10 lg:py-7">
            <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-[#09B697]/8 blur-3xl" />
            <div className="pointer-events-none absolute -left-12 bottom-0 h-28 w-28 rounded-full bg-[#143f52]/5 blur-2xl" />

            <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
              <div className="min-w-0">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <CompanyMark
                    name={company}
                    logoUrl={job.companyLogoUrl}
                    size="h-[82px] w-[82px] sm:h-[94px] sm:w-[94px]"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#09B697]">
                      <Building2 className="h-4 w-4" />
                      <span>{company}</span>
                      <span className="h-1 w-1 rounded-full bg-[#09B697]" />
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[#09B697]" />
                        Actively hiring
                      </span>
                    </div>

                    <h1 className="mt-3 text-[1.5rem] font-extrabold tracking-[-0.04em] text-[#091d3a] sm:text-[2rem] lg:text-[2.5rem] lg:leading-[1.1]">
                      {job.title}
                    </h1>

                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2 text-[15px] leading-7 text-black/68">
                      {[formatLabel(job.workMode), job.location, experience]
                        .filter(Boolean)
                        .map((item) => (
                          <span
                            key={item}
                            className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/85 px-3 py-1.5"
                          >
                            {item}
                          </span>
                        ))}
                      {salary ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-[#09B697]/18 bg-[#eff9f6] px-3 py-1.5 font-semibold text-[#11624f]">
                          Salary {salary}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {job.sectors.map((sector) => (
                        <span
                          key={sector}
                          className="rounded-full bg-[#dff5ef] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#11624f]"
                        >
                          {sector}
                        </span>
                      ))}
                      {job.skillTags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[#f1e8fb] px-3 py-1.5 text-xs font-semibold text-[#6a477f]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {job.publishedAt || job.createdAt ? (
                      <p className="mt-4 text-sm text-black/48">
                        Posted {formatContentDate(job.publishedAt || job.createdAt)}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#09B697]">
                      Role snapshot
                    </p>
                    {job.openings ? (
                      <span className="inline-flex items-center rounded-full bg-[#f4f7f8] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#24344b]">
                        {job.openings} {job.openings === 1 ? "opening" : "openings"}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 items-start">
                    {quickFacts.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-black/5 bg-white/90 px-4 py-3 shadow-sm"
                      >
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#09B697]">
                          {item.label}
                        </p>
                        <p className="mt-1.5 text-sm font-semibold leading-6 text-[#121417]">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <section className="relative rounded-[24px] border border-[#09B697]/20 bg-gradient-to-br from-[#0a1e2f] via-[#091d3a] to-[#0d2640] p-5 text-white shadow-lg shadow-[#091d3a]/20">
                  <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#09B697]/15 blur-2xl" />
                  <div className="pointer-events-none absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-[#09B697]/10 blur-xl" />
                  <div className="relative">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8de6d6]">
                      Shareable job page
                    </p>
                    <h2 className="mt-2 text-xl font-bold tracking-[-0.03em]">
                      Ready to apply?
                    </h2>
                    <p className="mt-2.5 max-w-[24rem] text-[13px] leading-6 text-white/68">
                      Single-scroll job summary, easy save state, and one-tap sharing across
                      major social platforms.
                    </p>

                    <JobActionBar
                      jobId={job.id}
                      shareTitle={shareTitle}
                      shareText={shareText}
                      shareUrl={shareUrl}
                      className="mt-5"
                    />

                    <JobApplyFlow
                      autoOpenOnReturn
                      buttonClassName="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-bold text-[#091d3a] shadow-lg transition-all duration-200 hover:bg-[#09B697] hover:text-white hover:shadow-[#09B697]/30"
                      companyName={company}
                      jobId={job.id}
                      jobSlug={job.slug}
                      jobSnapshot={job}
                      jobTitle={job.title}
                      routeSlug={job.routeSlug}
                    />
                  </div>
                </section>

                <section className="rounded-[24px] border border-black/6 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-bold tracking-[-0.02em] text-[#091d3a]">
                    Publisher profile
                  </h2>
                  <div className="mt-4 rounded-[20px] border border-black/6 bg-[#fbfcfb] p-4">
                    <div className="grid gap-4 sm:grid-cols-[72px_minmax(0,1fr)] sm:items-start">
                      <CompanyMark
                        name={job.recruiterName || company}
                        logoUrl={job.companyLogoUrl}
                        size="h-[72px] w-[72px]"
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#09B697]">
                          Publisher
                        </p>
                        <h3 className="mt-1 text-base font-bold leading-tight tracking-[-0.02em] text-[#121417]">
                          {job.recruiterName || company}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-black/62">{company}</p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-2.5 text-sm text-[#24344b]">
                      {job.companyAddress ? (
                        <div className="flex items-start gap-3 rounded-2xl border border-black/8 bg-white px-3 py-3">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{job.companyAddress}</span>
                        </div>
                      ) : null}
                      {website ? (
                        <a
                          href={appendUtmParams(website)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-3 rounded-2xl border border-black/8 bg-white px-3 py-3 transition-colors hover:border-[#09B697] hover:text-[#09B697]"
                        >
                          <Globe className="h-4 w-4 shrink-0" />
                          Visit company site
                        </a>
                      ) : null}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>

          <div className="grid gap-4 px-5 py-6 sm:px-8 xl:grid-cols-2 lg:px-10 lg:py-7">
            <section className="rounded-[24px] border border-black/6 bg-gradient-to-br from-[#fbfcfb] to-[#f8fbfa] p-6 shadow-sm xl:col-span-2">
              <h2 className="text-xl font-bold tracking-[-0.03em] text-[#091d3a] sm:text-2xl">
                About the job
              </h2>
              <div className="mt-4">
                <EnergJobRichText
                  content={job.description}
                  emptyFallback="Detailed job description will be available soon."
                />
              </div>
            </section>

            <div className="flex flex-wrap items-center gap-3 pt-2 xl:col-span-2">
              <JobApplyFlow
                autoOpenOnReturn={false}
                buttonLabel="Apply for this position"
                buttonClassName="inline-flex h-11 items-center justify-center rounded-xl bg-black px-5 text-sm font-bold text-white transition-colors hover:bg-[#09B697]"
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

            {job.keyResponsibilityLines.length > 0 ? (
              <section className="rounded-[24px] border border-black/6 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold tracking-[-0.02em] text-[#091d3a]">
                  What you&apos;ll do
                </h2>
                <ul className="mt-3 space-y-2 pl-5 text-[14px] leading-6 text-black/72 marker:text-[#09B697]">
                  {job.keyResponsibilityLines.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {job.requiredSkillLines.length > 0 ? (
              <section className="rounded-[24px] border border-black/6 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold tracking-[-0.02em] text-[#091d3a]">
                  What we&apos;re looking for
                </h2>
                <ul className="mt-3 space-y-2 pl-5 text-[14px] leading-6 text-black/72 marker:text-[#09B697]">
                  {job.requiredSkillLines.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {job.goodToHaveLines.length > 0 ? (
              <section className="rounded-[24px] border border-black/6 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold tracking-[-0.02em] text-[#091d3a]">
                  Good to have
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {job.goodToHaveLines.map((item, index) => (
                    <span
                      key={`${item}-${index}`}
                      className="rounded-full bg-gradient-to-br from-[#f5eefb] to-[#ede3f7] px-3.5 py-1.5 text-xs font-semibold text-[#6a477f]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-[24px] border border-black/6 bg-white p-6 shadow-sm xl:col-span-2">
              <div className="flex items-center gap-2 text-[#09B697]">
                <Sparkles className="h-5 w-5" />
                <h2 className="text-xl font-bold tracking-[-0.03em] text-[#091d3a]">
                  About the company
                </h2>
              </div>
              <div className="mt-4">
                <EnergJobRichText
                  content={job.companyDescription}
                  emptyFallback={`${company} is actively hiring through EnergJob.`}
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {job.companyAddress ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#fbfcfb] px-4 py-2 text-sm font-medium text-[#24344b]">
                    <MapPin className="h-4 w-4" />
                    {job.companyAddress}
                  </span>
                ) : null}
                {website ? (
                  <a
                    href={appendUtmParams(website)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#fbfcfb] px-4 py-2 text-sm font-medium text-[#24344b] transition-colors hover:border-[#09B697] hover:text-[#09B697]"
                  >
                    <Globe className="h-4 w-4" />
                    Visit company site
                  </a>
                ) : null}
              </div>
            </section>
          </div>
        </article>

        {/* ── Right Sidebar: Related Jobs ── */}
        {relatedJobs.length > 0 ? (
          <aside className="hidden xl:block">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-[24px] border border-black/6 bg-white p-5 shadow-[0_16px_40px_rgba(20,63,82,0.06)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#09B697]">
                  More opportunities
                </p>
                <h3 className="mt-1 text-lg font-black tracking-[-0.03em] text-[#091d3a]">
                  Related jobs
                </h3>
                <div className="mt-4 space-y-3">
                  {relatedJobs.slice(0, 5).map((item) => {
                    const relatedCompany =
                      item.companyName || item.recruiterName || "Energy ecosystem employer";

                    return (
                      <Link
                        key={item.routeSlug}
                        href={`/energyjobs/${item.routeSlug}`}
                        className="group block rounded-[18px] border border-black/6 bg-[#fcfdfc] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#09B697]/25 hover:shadow-[0_8px_24px_rgba(20,63,82,0.08)]"
                      >
                        <div className="flex items-start gap-3">
                          <CompanyMark
                            name={relatedCompany}
                            logoUrl={item.companyLogoUrl}
                            size="h-11 w-11"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#09B697]">
                              {relatedCompany}
                            </p>
                            <h4 className="mt-0.5 line-clamp-2 text-sm font-black leading-tight tracking-[-0.02em] text-[#121417] group-hover:text-[#09B697]">
                              {item.title}
                            </h4>
                            <p className="mt-1 text-[11px] leading-5 text-black/52">
                              {[
                                formatLabel(item.workMode),
                                item.location,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                          <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-black/30 transition-colors group-hover:text-[#09B697]" />
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <Link
                  href="/energyjobs"
                  className="mt-4 flex items-center justify-center gap-1.5 rounded-2xl border border-black/8 bg-[#fbfcfb] px-4 py-3 text-xs font-bold text-[#143f52] transition-colors hover:border-[#09B697] hover:text-[#09B697]"
                >
                  Browse all jobs
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </aside>
        ) : null}
        </div>
      </section>

      {relatedJobs.length > 0 ? (
        <section className="mx-auto mt-8 w-full max-w-[1240px] px-5 sm:px-6 lg:px-10 gsap-stagger-container">
          <div className="rounded-[30px] border border-black/6 bg-white p-6 shadow-[0_22px_55px_rgba(20,63,82,0.05)] lg:p-8">
            <h2 className="text-xl font-bold tracking-[-0.03em] text-[#091d3a] gsap-stagger-item">
              Similar jobs
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {relatedJobs.map((item) => {
                const relatedCompany =
                  item.companyName || item.recruiterName || "Energy ecosystem employer";

                return (
                  <article
                    key={item.routeSlug}
                    className="flex h-full flex-col rounded-[22px] border border-black/8 bg-[#fcfdfc] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#09B697]/30 hover:shadow-[0_16px_38px_rgba(20,63,82,0.08)] gsap-stagger-item"
                  >
                    <div className="flex items-start gap-4">
                      <CompanyMark
                        name={relatedCompany}
                        logoUrl={item.companyLogoUrl}
                        size="h-14 w-14"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#09B697]">{relatedCompany}</p>
                        <h3 className="mt-1 text-base font-bold leading-snug tracking-[-0.02em] text-[#121417]">
                          {item.title}
                        </h3>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-black/60">
                      {[
                        formatLabel(item.workMode),
                        item.location,
                        formatSalary(item.salaryMin, item.salaryMax),
                      ]
                        .filter(Boolean)
                        .join(" / ")}
                    </p>
                    {item.summary ? (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-black/52">
                        {item.summary}
                      </p>
                    ) : null}
                    <div className="mt-5 mb-5 flex flex-wrap gap-2">
                      {item.skillTags.slice(0, 3).map((tag) => (
                        <span
                          key={`${item.routeSlug}-${tag}`}
                          className="rounded-full bg-[#f1e8fb] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#6a477f]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Link
                      href={`/energyjobs/${item.routeSlug}`}
                      className="mt-auto inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#121417] px-5 text-sm font-bold text-white shadow-md shadow-black/8 transition-all duration-200 hover:bg-[#09B697]"
                    >
                      View role
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
