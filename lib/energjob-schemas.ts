import { z } from "zod";

const nullableString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null) return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  });

const nullableEmail = z
  .union([z.string().email(), z.null(), z.undefined()])
  .transform((value) => value ?? null);

const nullableNumber = z.preprocess((value) => {
  if (value === "" || value == null) return null;
  return value;
}, z.coerce.number().nullable());

const nullableInt = z.preprocess((value) => {
  if (value === "" || value == null) return null;
  return value;
}, z.coerce.number().int().nullable());

const nullableDate = z.preprocess((value) => {
  if (!value) return null;
  return value;
}, z.coerce.date().nullable());

const blocksArraySchema = z.array(z.record(z.string(), z.unknown()));

export const richTextInputSchema = z
  .union([z.string(), blocksArraySchema, z.null(), z.undefined()])
  .transform((value) => value ?? null);

export const recruiterCreateSchema = z.object({
  recruiterName: z.string().min(1),
  companyName: z.string().min(1),
  companyDescription: richTextInputSchema.optional(),
  email: z.string().email(),
  clerkUserId: nullableString.optional(),
  website: nullableString.optional(),
  logo: nullableString.optional(),
  address: nullableString.optional(),
  plotNoStreet: nullableString.optional(),
  jobsRemaining: nullableInt.optional(),
  plansExpiresAt: nullableDate.optional(),
  currentPlanId: nullableInt.optional(),
});

export const planCreateSchema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().nonnegative(),
  jobLimit: z.coerce.number().int().nonnegative(),
  duration: z.coerce.number().int().nonnegative(),
  isFeatured: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
});

export const jobCreateSchema = z.object({
  title: z.string().min(1),
  slug: nullableString.optional(),
  sectors: z.array(z.union([z.string(), z.number()])).optional(),
  jobType: nullableString.optional(),
  workMode: nullableString.optional(),
  location: nullableString.optional(),
  experienceMin: nullableInt.optional(),
  experienceMax: nullableInt.optional(),
  salaryMin: nullableNumber.optional(),
  salaryMax: nullableNumber.optional(),
  description: richTextInputSchema.optional(),
  keyResponsibilities: richTextInputSchema.optional(),
  requiredSkills: richTextInputSchema.optional(),
  goodToHave: richTextInputSchema.optional(),
  qualification: nullableString.optional(),
  department: nullableString.optional(),
  roleCategory: nullableString.optional(),
  applyEmail: nullableEmail.optional(),
  jobStatus: nullableString.optional(),
  openings: nullableInt.optional(),
  recruiterId: nullableInt.optional(),
  externalApplyUrl: nullableString.optional(),
});

export const applicationCreateSchema = z.object({
  jobId: z.coerce.number().int().positive(),
  applicantName: z.string().min(1),
  applicantEmail: z.string().email(),
  phone: nullableString.optional(),
  resumeUrl: nullableString.optional(),
  resumeFileId: nullableInt.optional(),
  coverNote: nullableString.optional(),
  earlyApplicant: z.coerce.boolean().optional(),
  applicationStatus: nullableString.optional(),
});

export const paymentCreateSchema = z.object({
  recruiterId: nullableInt.optional(),
  planId: nullableInt.optional(),
  razorpayOrderId: nullableString.optional(),
  razorpayPaymentId: nullableString.optional(),
  amount: z.coerce.number().nonnegative(),
  paymentStatus: nullableString.optional(),
  expiresAt: nullableDate.optional(),
});

export type RecruiterCreateInput = z.infer<typeof recruiterCreateSchema>;
export type PlanCreateInput = z.infer<typeof planCreateSchema>;
export type JobCreateInput = z.infer<typeof jobCreateSchema>;
export type ApplicationCreateInput = z.infer<typeof applicationCreateSchema>;
export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>;

export type RichTextInput = z.infer<typeof richTextInputSchema>;

export function normalizeRichTextBlocks(value: RichTextInput | undefined): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    return [
      {
        type: "paragraph",
        children: [{ type: "text", text: value.trim() }],
      },
    ];
  }
  return [];
}
