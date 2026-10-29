/**
 * Unified Tender API Data Layer
 * Connects to Python FastAPI Tender Intelligence Engine with Strapi fallback.
 */

const TENDER_API_BASE_URL =
  process.env.TENDER_API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_TENDER_API_URL ||
  "http://127.0.0.1:8000";

const STRAPI_BASE_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

export interface AIAnalysisData {
  is_energy_related?: boolean;
  energy_sector?: string;
  headline?: string;
  summary?: string;
  seo_title?: string;
  meta_description?: string;
  slug?: string;
  keywords?: string[];
  tags?: string[];
  importance_score?: number;
  publish_recommendation?: string;
  why_it_matters?: string;
  industry_impact?: string;
  companies_interested?: string[];
  eligibility?: string;
  required_documents?: string;
  important_dates?: string;
  risk_level?: string;
  estimated_value?: string;
  key_scopes?: string[];
  eligibility_highlights?: string;
}

export interface DocumentItem {
  name: string;
  description?: string;
  size_kb?: string;
  download_url?: string;
}

export interface UnifiedTender {
  id: string;
  reference: string;
  tenderId?: string;
  slug: string;
  title: string;
  organization: string;
  department?: string;
  tenderNumber?: string;
  country?: string;
  state?: string;
  location?: string;
  pincode?: string;
  tenderType: string;
  tenderCategory?: string;
  formOfContract?: string;
  withdrawalAllowed?: string;
  noOfCovers?: string;
  paymentMode?: string;
  tenderStatus: "Open" | "Closed" | string;
  
  // Chronological Critical Dates
  publishedDate?: string;
  rawPublishedDate?: string;
  docDownloadStartDate?: string;
  docDownloadEndDate?: string;
  clarificationStartDate?: string;
  clarificationEndDate?: string;
  bidSubmissionStartDate?: string;
  bidSubmissionEndDate?: string;
  deadline?: string;
  rawDeadline?: string;
  openingDate?: string;
  preBidMeetingDate?: string;
  preBidMeetingPlace?: string;
  bidOpeningPlace?: string;

  // Financial & Commercial Terms
  tenderValue?: string;
  emdAmount?: string;
  emdExemption?: string;
  emdFeeType?: string;
  tenderFee?: string;
  feePayableTo?: string;
  feePayableAt?: string;
  productCategory?: string;
  subCategory?: string;
  contractType?: string;
  bidValidityDays?: string;
  periodOfWorkDays?: string;
  preQualification?: string;

  // Inviting Authority
  invitingAuthorityName?: string;
  invitingAuthorityAddress?: string;

  // Documents
  pdfPath?: string;
  pdfUrl?: string;
  officialUrl?: string;
  supportingDocuments?: string[];
  documentsMetadata?: DocumentItem[];

  // AI & Taxonomy
  sector: string;
  sectors: { name: string; slug: string }[];
  description?: string;
  aiAnalysis?: AIAnalysisData;
  featured?: boolean;
  source?: string;
}

export interface TenderStats {
  totalTenders: number;
  energyRelated: number;
  aiCompleted: number;
  sectorBreakdown: { sector: string; count: number }[];
}

export function slugifyText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Creates safe URL slug without forward slashes (replaces / with __)
 */
export function createTenderSlug(ref: string, title?: string, aiSlug?: string): string {
  const safeRef = encodeURIComponent((ref || "").trim().replace(/\//g, "__"));
  const baseTitle = aiSlug || slugifyText(title || "tender").slice(0, 60);
  return `${baseTitle}--${safeRef}`;
}

/**
 * Extracts original reference from slug (replaces __ back with /)
 */
export function extractRefFromSlug(slug: string): string {
  if (!slug) return "";
  let rawRef = slug;
  if (slug.includes("--")) {
    const parts = slug.split("--");
    rawRef = parts[parts.length - 1];
  }
  try {
    const decoded = decodeURIComponent(rawRef).replace(/__/g, "/");
    return decoded;
  } catch (e) {
    return rawRef.replace(/__/g, "/");
  }
}

/**
 * Normalizes Python FastAPI Tender model into UnifiedTender
 */
export function normalizePythonTender(item: any): UnifiedTender {
  const t = item.tender || item;
  const ai = item.ai_analysis || item.aiAnalysis || {};

  const ref = t.reference || t.Reference || String(item.id || "");
  const title = t.title || t.Title || ai.headline || "Government Energy Procurement Tender";
  const slug = createTenderSlug(ref, title, ai.slug);
  const sectorName = ai.energy_sector || t.product_category || t.tender_category || t.category || "Energy";

  // Key Scopes
  let keyScopes: string[] = [];
  if (ai.key_scopes && Array.isArray(ai.key_scopes)) {
    keyScopes = ai.key_scopes;
  } else if (ai.tags && Array.isArray(ai.tags)) {
    keyScopes = ai.tags;
  }

  // Supporting documents
  let supportingDocs: string[] = [];
  if (Array.isArray(t.supporting_documents)) {
    supportingDocs = t.supporting_documents;
  } else if (typeof t.supporting_documents === "string" && t.supporting_documents.trim()) {
    supportingDocs = t.supporting_documents.split(",").map((s: string) => s.trim());
  }

  return {
    id: ref,
    reference: ref,
    tenderId: t.tender_id || t.TenderID,
    slug,
    title,
    organization: t.organisation || t.Organisation || t.organization || "Government Agency",
    department: t.department || t.Department,
    tenderNumber: t.tender_number || t.TenderNumber,
    country: t.country || "India",
    state: t.location || t.Location || t.state || "",
    location: t.location || t.Location,
    pincode: t.pincode || t.Pincode,
    tenderType: t.tender_type || t.TenderType || "Open Tender",
    tenderCategory: t.tender_category || t.TenderCategory || "Works",
    formOfContract: t.form_of_contract || t.FormOfContract,
    withdrawalAllowed: t.withdrawal_allowed || t.WithdrawalAllowed,
    noOfCovers: t.no_of_covers || t.NoOfCovers,
    paymentMode: t.payment_mode || t.PaymentMode,
    tenderStatus: (t.closing_date || t.bid_submission_end_date) ? "Open" : "Closed",

    // Chronological Dates
    publishedDate: t.published_date || t.PublishedDate,
    rawPublishedDate: t.published_date || t.PublishedDate,
    docDownloadStartDate: t.doc_download_start_date || t.DocumentDownloadStartDate,
    docDownloadEndDate: t.doc_download_end_date || t.DocumentDownloadEndDate,
    clarificationStartDate: t.clarification_start_date || t.ClarificationStartDate,
    clarificationEndDate: t.clarification_end_date || t.ClarificationEndDate,
    bidSubmissionStartDate: t.bid_submission_start_date || t.BidSubmissionStartDate,
    bidSubmissionEndDate: t.bid_submission_end_date || t.BidSubmissionEndDate,
    deadline: t.closing_date || t.bid_submission_end_date,
    rawDeadline: t.closing_date || t.bid_submission_end_date,
    openingDate: t.opening_date || t.OpeningDate,
    preBidMeetingDate: t.pre_bid_meeting_date || t.PreBidMeetingDate,
    preBidMeetingPlace: t.pre_bid_meeting_place || t.PreBidMeetingPlace,
    bidOpeningPlace: t.bid_opening_place || t.BidOpeningPlace,

    // Financial & Commercial Terms
    tenderValue: t.tender_value || t.TenderValue || ai.estimated_value,
    emdAmount: t.emd || t.EMD,
    emdExemption: t.emd_exemption || t.EMDExemption,
    emdFeeType: t.emd_fee_type || t.EMDFeeType,
    tenderFee: t.tender_fee || t.TenderFee,
    feePayableTo: t.fee_payable_to || t.FeePayableTo,
    feePayableAt: t.fee_payable_at || t.FeePayableAt,
    productCategory: t.product_category || t.ProductCategory,
    subCategory: t.sub_category || t.SubCategory,
    contractType: t.contract_type || t.ContractType,
    bidValidityDays: t.bid_validity_days || t.BidValidity,
    periodOfWorkDays: t.period_of_work_days || t.PeriodOfWork,
    preQualification: t.pre_qualification || t.PreQualification,

    // Inviting Authority
    invitingAuthorityName: t.inviting_authority_name || t.InvitingAuthorityName,
    invitingAuthorityAddress: t.inviting_authority_address || t.InvitingAuthorityAddress,

    // Documents
    pdfPath: t.pdf_path || t.PDFPath,
    pdfUrl: t.pdf_url || t.PDFURL,
    officialUrl: t.pdf_url || "https://eprocure.gov.in",
    supportingDocuments: supportingDocs,
    documentsMetadata: t.documents_metadata || [],

    // AI & Taxonomy
    sector: sectorName,
    sectors: [{ name: sectorName, slug: slugifyText(sectorName) }],
    description: t.description || t.Description || ai.summary,
    aiAnalysis: {
      ...ai,
      key_scopes: keyScopes,
      eligibility_highlights: ai.eligibility || ai.required_documents,
    },
    featured: Boolean(item.featured),
    source: "CPPP National eProcurement",
  };
}

/**
 * Normalizes Strapi Tender item into UnifiedTender
 */
export function normalizeStrapiTender(item: any): UnifiedTender {
  const attrs = item?.attributes || item || {};
  const id = String(item?.id || attrs.slug || "tender");
  const title = attrs.title || attrs.Title || "Energy Tender";
  const ref = attrs.reference || attrs.slug || id;
  const sectorData = attrs.sectors?.data?.[0]?.attributes?.name || attrs.sectors?.[0]?.name || "Energy";

  return {
    id,
    reference: ref,
    slug: attrs.slug || createTenderSlug(ref, title),
    title,
    organization: attrs.organization || "Public Sector",
    country: attrs.country,
    state: attrs.state,
    tenderType: attrs.tender_type || "Open",
    tenderStatus: attrs.tender_status || "Open",
    deadline: attrs.tender_deadline,
    rawDeadline: attrs.tender_deadline,
    publishedDate: attrs.publishedAt || attrs.createdAt,
    rawPublishedDate: attrs.publishedAt || attrs.createdAt,
    sector: sectorData,
    sectors: [{ name: sectorData, slug: slugifyText(sectorData) }],
    description: attrs.excerpt || attrs.content,
    featured: Boolean(attrs.featured),
    officialUrl: attrs.official_tender_link || attrs.source_url,
    source: attrs.source || "Strapi",
  };
}

/**
 * Normalizes attributes from generic source
 */
export function normalizeTenderAttrs(item: any): UnifiedTender | null {
  if (!item) return null;
  if (item.tender || item.reference) {
    return normalizePythonTender(item);
  }
  return normalizeStrapiTender(item);
}

/**
 * Fetch all energy tenders from Python FastAPI engine with fallback
 */
export async function getAllTenders(page = 1, pageSize = 50, sector?: string, search?: string) {
  try {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      energy_only: "false",
    });
    if (sector && sector !== "All") params.append("sector", sector);
    if (search) params.append("search", search);

    const res = await fetch(`${TENDER_API_BASE_URL}/api/v1/tenders?${params.toString()}`, {
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      const rawList = json.tenders || [];
      const tenders: UnifiedTender[] = rawList.map(normalizePythonTender);
      return {
        data: tenders,
        total: json.total || tenders.length,
        totalPages: json.total_pages || 1,
        page: json.page || page,
      };
    }
  } catch (error) {
    // API not reachable, fallback to Strapi
  }

  try {
    const query = new URLSearchParams({
      "pagination[page]": String(page),
      "pagination[pageSize]": String(pageSize),
      "sort[0]": "publishedAt:desc",
      "populate": "*",
    });

    const res = await fetch(`${STRAPI_BASE_URL}/api/tenders?${query.toString()}`, {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const json = await res.json();
      const tenders = (json?.data || []).map(normalizeStrapiTender);
      return {
        data: tenders,
        total: json?.meta?.pagination?.total || tenders.length,
        totalPages: json?.meta?.pagination?.pageCount || 1,
        page: json?.meta?.pagination?.page || page,
      };
    }
  } catch (e) {
    console.error("Error fetching tenders from Strapi fallback:", e);
  }

  return { data: [], total: 0, totalPages: 1, page: 1 };
}

/**
 * Fetch a single tender by slug or reference
 */
export async function getTenderBySlug(slug: string): Promise<UnifiedTender | null> {
  const ref = extractRefFromSlug(slug);

  // 1. Try direct reference match
  try {
    const res = await fetch(`${TENDER_API_BASE_URL}/api/v1/tenders/${encodeURIComponent(ref)}`, {
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      if (json && (json.tender || json.reference)) {
        return normalizePythonTender(json);
      }
    }
  } catch (err) {
    // Continue
  }

  // 2. Search in all tenders list
  try {
    const res = await fetch(`${TENDER_API_BASE_URL}/api/v1/tenders?page=1&page_size=100`, {
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      const found = (json.tenders || []).find((raw: any) => {
        const item = normalizePythonTender(raw);
        return (
          item.reference === ref ||
          item.reference === slug ||
          item.slug === slug ||
          item.tenderId === ref ||
          item.id === ref
        );
      });
      if (found) return normalizePythonTender(found);
    }
  } catch (e) {
    // Continue
  }

  // 3. Fallback to Strapi
  try {
    const query = new URLSearchParams({
      "filters[slug][$eq]": slug,
      "populate": "*",
    });

    const res = await fetch(`${STRAPI_BASE_URL}/api/tenders?${query.toString()}`, {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const json = await res.json();
      const item = json?.data?.[0];
      if (item) return normalizeStrapiTender(item);
    }
  } catch (e) {
    console.error(`Error fetching tender ${slug} from Strapi:`, e);
  }

  return null;
}

/**
 * Fetch tender intelligence stats
 */
export async function getTenderStats(): Promise<TenderStats> {
  try {
    const res = await fetch(`${TENDER_API_BASE_URL}/api/v1/stats`, {
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      return {
        totalTenders: json.total_tenders || 0,
        energyRelated: json.energy_related || 0,
        aiCompleted: json.ai_completed || 0,
        sectorBreakdown: json.sector_breakdown || [],
      };
    }
  } catch (e) {
    // Default
  }

  return {
    totalTenders: 0,
    energyRelated: 0,
    aiCompleted: 0,
    sectorBreakdown: [],
  };
}

/**
 * Fetch related energy tenders
 */
export async function getRelatedTenders(sectorName?: string, currentRef?: string, limit = 3): Promise<UnifiedTender[]> {
  try {
    const params = new URLSearchParams({
      page: "1",
      page_size: String(limit + 4),
      energy_only: "false",
    });
    if (sectorName && sectorName !== "Energy" && sectorName !== "All") {
      params.append("sector", sectorName);
    }

    const res = await fetch(`${TENDER_API_BASE_URL}/api/v1/tenders?${params.toString()}`, {
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      const list: UnifiedTender[] = (json.tenders || [])
        .map(normalizePythonTender)
        .filter((t: UnifiedTender) => t.reference !== currentRef && t.slug !== currentRef)
        .slice(0, limit);
      return list;
    }
  } catch (e) {
    // Fallback
  }

  return [];
}
