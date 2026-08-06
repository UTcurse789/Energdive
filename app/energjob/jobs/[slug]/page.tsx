import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
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
import JobApplyFlow from "@/components/energjob/job-apply-flow";

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
        <img src={logoUrl} alt={name} className="h-full w-full object-contain" />
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
    datePosted: job.publishedAt || job.createdAt,
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
            addressCountry: "IN",
          },
        }
      : undefined,
    industry: job.sectors.join(", "),
    qualifications: [job.qualification, ...job.requiredSkillLines].filter(Boolean).join(". "),
    responsibilities: job.keyResponsibilityLines.join(". "),
    skills: job.skillTags.join(", "),
    directApply: true,
    url: getCanonicalUrl(`/energjob/jobs/${job.routeSlug}`),
    ...(job.salaryMin || job.salaryMax
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: "INR",
            value: {
              "@type": "QuantitativeValue",
              ...(salaryMin ? { minValue: Number(job.salaryMin) } : {}),
              ...(salaryMax ? { maxValue: Number(job.salaryMax) } : {}),
              unitText: "MONTH",
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
      title: { absolute: "Job not found | EnergJob" },
    };
  }

  const company = job.companyName || job.recruiterName || "EnergJob";
  const title = `${job.title} at ${company} | EnergJob`;
  const description =
    job.summary ||
    `Explore ${job.title} at ${company} on EnergJob across ${job.sectors.join(", ")}.`;

  return {
    title: { absolute: title },
    description,
    keywords: buildKeywords(job),
    alternates: {
      canonical: getCanonicalUrl(`/energjob/jobs/${job.routeSlug}`),
    },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(`/energjob/jobs/${job.routeSlug}`),
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
      <Script
        id={`energjob-jobposting-${job.routeSlug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd) }}
      />

      <section className="border-b border-black/6 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-[1380px] px-5 py-4 sm:px-6 lg:px-10">
          <Link
            href="/energjob/jobs"
            className="group inline-flex items-center gap-2 text-sm font-bold text-[#143f52] transition-all duration-200 hover:text-[#09B697] hover:gap-3"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            Back to jobs
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1380px] px-5 pt-8 sm:px-6 lg:px-10 lg:pt-10">
        <article className="overflow-hidden rounded-[34px] border border-black/6 bg-white shadow-[0_28px_65px_rgba(20,63,82,0.07)]">
          <div className="relative overflow-hidden border-b border-black/6 bg-gradient-to-br from-white via-[#fcfefd] to-[#f4faf8] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
            {/* Decorative gradient orbs */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[#09B697]/8 blur-3xl" />
            <div className="pointer-events-none absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-[#143f52]/5 blur-2xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-4">
                  <CompanyMark name={company} logoUrl={job.companyLogoUrl} size="w-32 h-16 sm:w-40 sm:h-20" />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#09B697]">
                      <Building2 className="h-4 w-4" />
                      <span>{company}</span>
                      <span className="h-1 w-1 rounded-full bg-[#09B697]" />
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#09B697] animate-pulse" />
                        Actively hiring
                      </span>
                    </div>
                    <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] text-[#091d3a] sm:text-4xl lg:text-[3.4rem] lg:leading-[1.02]">
                      {job.title}
                    </h1>
                    <p className="mt-3 text-base leading-7 text-black/65">
                      {[
                        formatLabel(job.workMode),
                        job.location,
                        experience,
                        salary ? `Salary ${salary}` : null,
                      ]
                        .filter(Boolean)
                        .join(" / ")}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {job.sectors.map((sector) => (
                        <span
                          key={sector}
                          className="rounded-full bg-[#dff5ef] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#11624f]"
                        >
                          {sector}
                        </span>
                      ))}
                      {job.skillTags.slice(0, 6).map((tag) => (
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
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-5 text-sm font-bold text-[#121417] shadow-sm transition-all duration-200 hover:border-[#09B697]/40 hover:text-[#09B697] hover:shadow-md"
                >
                  <Bookmark className="h-4 w-4" />
                  Save
                </button>

                <JobApplyFlow
                  autoOpenOnReturn
                  buttonClassName="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#1a1f25] to-[#121417] px-7 text-sm font-bold text-white shadow-lg shadow-black/10 transition-all duration-200 hover:from-[#09B697] hover:to-[#078a72] hover:shadow-[#09B697]/20"
                  companyName={company}
                  jobId={job.id}
                  jobSlug={job.slug}
                  jobSnapshot={job}
                  jobTitle={job.title}
                  routeSlug={job.routeSlug}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-5 py-7 sm:px-8 lg:grid-cols-[1.3fr_0.7fr] lg:px-10 lg:py-9">
            <div className="space-y-5">
              <section className="rounded-[26px] border border-black/6 bg-gradient-to-br from-[#fbfcfb] to-[#f8fbfa] p-7 shadow-sm transition-shadow duration-300 hover:shadow-md">
                <h2 className="text-2xl font-black tracking-[-0.04em] text-[#091d3a] sm:text-3xl">
                  About the job
                </h2>
                <div className="mt-5 space-y-4 text-[15px] leading-[1.85] text-black/72">
                  {job.descriptionLines.length > 0 ? (
                    job.descriptionLines.map((line, index) => <p key={index}>{line}</p>)
                  ) : (
                    <p>Detailed job description will be available soon.</p>
                  )}
                </div>
              </section>

              {job.keyResponsibilityLines.length > 0 ? (
                <section className="rounded-[26px] border border-black/6 bg-white p-7 shadow-sm transition-shadow duration-300 hover:shadow-md">
                  <h2 className="text-2xl font-black tracking-[-0.04em] text-[#091d3a]">
                    What you&apos;ll do
                  </h2>
                  <ul className="mt-5 space-y-3.5 pl-5 text-[15px] leading-[1.85] text-black/72 marker:text-[#09B697]">
                    {job.keyResponsibilityLines.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {job.requiredSkillLines.length > 0 ? (
                <section className="rounded-[26px] border border-black/6 bg-white p-7 shadow-sm transition-shadow duration-300 hover:shadow-md">
                  <h2 className="text-2xl font-black tracking-[-0.04em] text-[#091d3a]">
                    What we&apos;re looking for
                  </h2>
                  <ul className="mt-5 space-y-3.5 pl-5 text-[15px] leading-[1.85] text-black/72 marker:text-[#09B697]">
                    {job.requiredSkillLines.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {job.goodToHaveLines.length > 0 ? (
                <section className="rounded-[26px] border border-black/6 bg-white p-7 shadow-sm transition-shadow duration-300 hover:shadow-md">
                  <h2 className="text-2xl font-black tracking-[-0.04em] text-[#091d3a]">
                    Good to have
                  </h2>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {job.goodToHaveLines.map((item, index) => (
                      <span
                        key={`${item}-${index}`}
                        className="rounded-full bg-gradient-to-br from-[#f5eefb] to-[#ede3f7] px-4 py-2 text-sm font-semibold text-[#6a477f] transition-all duration-200 hover:shadow-sm"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="rounded-[26px] border border-black/6 bg-white p-6">
                <div className="flex items-center gap-2 text-[#09B697]">
                  <Sparkles className="h-5 w-5" />
                  <h2 className="text-2xl font-black tracking-[-0.04em] text-[#091d3a]">
                    About the company
                  </h2>
                </div>
                <div className="mt-4 space-y-4 text-[15px] leading-8 text-black/78">
                  {job.companyDescriptionLines.length > 0 ? (
                    job.companyDescriptionLines.map((line, index) => <p key={index}>{line}</p>)
                  ) : (
                    <p>{company} is actively hiring through EnergJob.</p>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {job.companyAddress ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#fbfcfb] px-4 py-2 text-sm font-medium text-[#24344b]">
                      <MapPin className="h-4 w-4" />
                      {job.companyAddress}
                    </span>
                  ) : null}
                  {website ? (
                    <a
                      href={website}
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

            <aside className="space-y-5">
              <section className="rounded-[26px] border border-black/6 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black tracking-[-0.03em] text-[#091d3a]">
                  Role snapshot
                </h2>
                <div className="mt-5 grid gap-3">
                  {quickFacts.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-black/5 bg-gradient-to-br from-[#fbfcfb] to-[#f8faf9] px-4 py-3.5 transition-all duration-200 hover:border-[#09B697]/15 hover:shadow-sm"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#09B697]">
                        {item.label}
                      </p>
                      <p className="mt-1.5 text-sm font-semibold text-[#121417]">{item.value}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[26px] border border-black/6 bg-white p-6">
                <h2 className="text-xl font-black tracking-[-0.03em] text-[#091d3a]">
                  Publisher profile
                </h2>
                <div className="mt-5 rounded-[22px] border border-black/6 bg-[#fbfcfb] p-5">
                  <div className="flex items-start gap-4">
                    <CompanyMark
                      name={job.recruiterName || company}
                      logoUrl={job.companyLogoUrl}
                      size="h-14 w-14"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#09B697]">
                        Publisher
                      </p>
                      <h3 className="mt-1 text-lg font-black tracking-[-0.03em] text-[#121417]">
                        {job.recruiterName || company}
                      </h3>
                      <p className="mt-1 text-sm font-medium text-black/62">{company}</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 text-sm text-[#24344b]">
                    {job.companyAddress ? (
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{job.companyAddress}</span>
                      </div>
                    ) : null}
                    {website ? (
                      <a
                        href={website}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 transition-colors hover:text-[#09B697]"
                      >
                        <Globe className="h-4 w-4" />
                        Visit company site
                      </a>
                    ) : null}
                  </div>
                </div>
              </section>

              {job.skillTags.length > 0 ? (
                <section className="rounded-[26px] border border-black/6 bg-white p-6">
                  <h2 className="text-xl font-black tracking-[-0.03em] text-[#091d3a]">
                    Good to have
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {job.skillTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#f1e8fb] px-3 py-2 text-sm font-semibold text-[#6a477f]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="relative overflow-hidden rounded-[26px] border border-[#09B697]/20 bg-gradient-to-br from-[#0a1e2f] via-[#091d3a] to-[#0d2640] p-6 text-white shadow-lg shadow-[#091d3a]/20">
                {/* Decorative accent */}
                <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#09B697]/15 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-[#09B697]/10 blur-xl" />
                <div className="relative">
                  <h2 className="text-xl font-black tracking-[-0.03em]">Ready to apply?</h2>
                  <p className="mt-3 text-sm leading-7 text-white/65">
                    Use EnergJob&apos;s single apply flow to share your details and notify the
                    hiring team in one step.
                  </p>
                  <JobApplyFlow
                    buttonClassName="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-bold text-[#091d3a] shadow-lg transition-all duration-200 hover:bg-[#09B697] hover:text-white hover:shadow-[#09B697]/30"
                    companyName={company}
                    jobId={job.id}
                    jobSlug={job.slug}
                    jobSnapshot={job}
                    jobTitle={job.title}
                    routeSlug={job.routeSlug}
                  />
                </div>
              </section>
            </aside>
          </div>
        </article>
      </section>

      {relatedJobs.length > 0 ? (
        <section className="mx-auto mt-10 w-full max-w-[1380px] px-5 sm:px-6 lg:px-10">
          <div className="rounded-[34px] border border-black/6 bg-white p-6 shadow-[0_22px_55px_rgba(20,63,82,0.05)] lg:p-8">
            <h2 className="text-3xl font-black tracking-[-0.04em] text-[#091d3a]">
              Similar jobs
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {relatedJobs.map((item) => {
                const relatedCompany =
                  item.companyName || item.recruiterName || "Energy ecosystem employer";

                return (
                  <article
                    key={item.routeSlug}
                    className="rounded-[24px] border border-black/8 bg-[#fcfdfc] p-5"
                  >
                    <CompanyMark
                      name={relatedCompany}
                      logoUrl={item.companyLogoUrl}
                      size="h-12 w-12"
                    />
                    <p className="mt-4 text-sm font-semibold text-[#09B697]">{relatedCompany}</p>
                    <h3 className="mt-2 text-xl font-black tracking-[-0.03em] text-[#121417]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-black/60">
                      {[
                        formatLabel(item.workMode),
                        item.location,
                        formatSalary(item.salaryMin, item.salaryMax),
                      ]
                        .filter(Boolean)
                        .join(" / ")}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {item.skillTags.slice(0, 3).map((tag) => (
                        <span
                          key={`${item.routeSlug}-${tag}`}
                          className="rounded-full bg-[#f1e8fb] px-3 py-1.5 text-xs font-semibold text-[#6a477f]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Link
                      href={`/energjob/jobs/${item.routeSlug}`}
                      className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#1a1f25] to-[#121417] px-5 text-sm font-bold text-white shadow-md shadow-black/8 transition-all duration-200 hover:from-[#09B697] hover:to-[#078a72] hover:shadow-[#09B697]/20"
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
