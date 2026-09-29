export type CompanyType = "PSU" | "Private" | "Multinational" | "OEM" | "Utility" | "EPC Contractor";

export interface MarketplaceCompany {
  id: string;
  slug: string;
  name: string;
  logo: string;
  coverImage?: string;
  shortDescription: string;
  description: string;
  industry: string;
  sector: string;
  subSector: string;
  companyType: CompanyType;
  location: string;
  headquarters: string;
  founded: number | string;
  listed: boolean;
  exchange?: string;
  ticker?: string;
  bseCode?: string;
  website: string;
  businessAreas: string[];
  productIds: string[];
  relatedCompanyIds: string[];
}

export interface ProductSpecification {
  label: string;
  value: string;
  group?: string;
}

export interface MarketplaceProduct {
  id: string;
  slug: string;
  name: string;
  image: string;
  shortDescription: string;
  description: string;
  category: string;
  subCategory?: string;
  sector: string;
  companyId: string;
  companySlug: string;
  companyName: string;
  companyLogo?: string;
  features: string[];
  applications: string[];
  specifications: ProductSpecification[];
}

export interface MarketplaceCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconName: string;
  image: string;
  subSectors: string[];
  companyCount?: number;
  productCount?: number;
}

export interface MarketplaceArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  image: string;
  readTime: string;
}

export interface EnquiryFormData {
  name: string;
  company: string;
  email: string;
  phone: string;
  message: string;
  targetType: "company" | "product" | "general";
  targetId?: string;
  targetName?: string;
}

export interface CompanyFilterState {
  search: string;
  sector: string;
  subSector: string;
  companyType: string;
  location: string;
  listedStatus: string; // "all" | "listed" | "unlisted"
}

export interface ProductFilterState {
  search: string;
  category: string;
  subCategory: string;
  sector: string;
  companySlug: string;
}

// ==========================================
// Company Resource Hub Types & Taxonomy
// ==========================================

export type CompanyResourceType =
  | "Presentation"
  | "Video"
  | "Company Brochure"
  | "Product Catalogue"
  | "Product Brochure"
  | "Product Information"
  | "Technical Document";

export type ResourceFileType = "PDF" | "PPT" | "PPTX" | "ZIP" | "FILE";

export interface CompanyResource {
  id: string;
  slug: string;
  type: CompanyResourceType;
  title: string;
  description: string;
  thumbnail?: string;
  file: string;
  fileName?: string;
  fileType: ResourceFileType;
  fileSize?: string;
  date?: string;
  companyId: string;
  companySlug: string;
  productId?: string;
  productName?: string;
  productSlug?: string;
}

export interface VideoResource {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  duration?: string;
  videoType?: string;
  date?: string;
  companyId: string;
  companySlug: string;
}

// Extensible type aliases for specialized uses
export type Presentation = CompanyResource;
export type Brochure = CompanyResource;
export type ProductDocument = CompanyResource;

