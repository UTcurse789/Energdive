export type ResourceType = string;
export type Sector = string;
export type FileType = string;

export type SortOption = "Latest First" | "Oldest First" | "A–Z" | "Z–A" | "Most Downloaded" | "Featured";

export type EnergyEvent = {
  id: string;
  name: string;
  logoLabel: string;
  brandColor: string;
  totalResources: number;
};

export type EventResource = {
  id: string;
  slug: string;
  event_id: string;
  resource_type: ResourceType;
  resourceTag: string;
  file_url: string;
  fileName: string;
  thirdPartyNotificationEmails?: string[];
  coverImageUrl: string | null;
  coverImageWidth: number | null;
  coverImageHeight: number | null;
  thumbnailImageUrl: string | null;
  title: string;
  eventName: string;
  eventLogo: string;
  showCode: string;
  year: number;
  sector: Sector[];
  shortDescription: string;
  description: string;
  fileType: FileType;
  fileSize: string;
  publishedAt: string;
  featured: boolean;
  promotional: boolean;
};

export type ResourceFilters = {
  events: string[];
  types: ResourceType[];
  sectors: Sector[];
  years: number[];
  fileFormats: string[];
  sort: SortOption;
};
