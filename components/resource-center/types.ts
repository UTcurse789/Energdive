export type ResourceType =
  | "Event Brochure"
  | "Post Show Report"
  | "Whitepaper"
  | "Industry Report"
  | "Presentation"
  | "Media Kit"
  | "Sponsor Prospectus";

export type Sector =
  | "Oil & Gas"
  | "Power Generation"
  | "Renewables"
  | "Transmission"
  | "Distribution"
  | "Electricity Markets"
  | "New Energies"
  | "Energy Storage"
  | "Sustainability & Safety";

export type Region =
  | "Middle East"
  | "Asia"
  | "Europe"
  | "Africa"
  | "North America";

export type SortOption =
  | "Latest First"
  | "Most Downloaded"
  | "Popular"
  | "Event Name";

export type FileType = "PDF" | "PPT" | "ZIP";

export type EnergyEvent = {
  id: string;
  name: string;
  logoLabel: string;
  location: string;
  region: Region;
  brandColor: string;
  totalResources: number;
};

export type EventResource = {
  id: string;
  event_id: string;
  resource_type: ResourceType;
  file_url: string;
  fileName: string;
  thumbnail: string;
  title: string;
  eventName: string;
  eventLogo: string;
  year: 2026 | 2025 | 2024 | 2023;
  sector: Sector[];
  region: Region;
  description: string;
  fileType: FileType;
  fileSize: string;
  pages: number;
  downloads: number;
  popularity: number;
  publishedAt: string;
  readTime: string;
};

export type ResourceFilters = {
  events: string[];
  types: ResourceType[];
  sectors: Sector[];
  years: number[];
  regions: Region[];
  sort: SortOption;
};
