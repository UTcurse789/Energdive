import { notFound } from "next/navigation";
import {
  getEnergJobApplicationByToken,
  getEnergJobById,
  getEnergJobRecruiterById,
} from "@/lib/queries/energjob";
import ClientReviewManager from "./ClientReviewManager";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!token) return { title: "Application Review - EnergJob" };

  const application = await getEnergJobApplicationByToken(token);
  if (!application) return { title: "Application Not Found - EnergJob" };

  return {
    title: `Review: ${application.applicant_name} - EnergJob`,
    description: `Recruiter candidate application review portal for EnergJob.`,
  };
}

export default async function RecruiterApplicationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!token) {
    notFound();
  }

  const application = await getEnergJobApplicationByToken(token);
  if (!application) {
    notFound();
  }

  const job = await getEnergJobById(application.job_id);
  const recruiter = job?.posted_by_recruiter_id
    ? await getEnergJobRecruiterById(job.posted_by_recruiter_id)
    : null;

  const companyName = recruiter?.company_name || recruiter?.recruiter_name || "EnergJob Employer";

  // Normalize application properties to match component expectations
  const normalizedApplication = {
    id: application.id,
    job_id: application.job_id,
    applicant_name: application.applicant_name,
    applicant_email: application.applicant_email,
    phone: application.phone,
    resume_url: application.resume_url,
    cover_note: application.cover_note,
    early_applicant: application.early_applicant,
    application_status: application.application_status,
    created_at: application.created_at.toISOString(),
  };

  const normalizedJob = job
    ? {
        id: job.id,
        title: job.title,
        slug: job.slug,
      }
    : null;

  return (
    <ClientReviewManager
      application={normalizedApplication}
      job={normalizedJob}
      companyName={companyName}
      token={token}
    />
  );
}
