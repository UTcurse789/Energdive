import { NextResponse } from "next/server";
import { getOpinionContentKind } from "@/lib/content-tags";
import { filterAndSortEventsByOccurrence, getEventStartTimestamp } from "@/lib/event-dates";

const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

type LooseRecord = Record<string, unknown>;

type ApiCollectionResponse<T = LooseRecord> = {
    data?: T[];
};

type TaxonomyItem = {
    name?: string;
    slug?: string;
    attributes?: {
        name?: string;
        slug?: string;
    };
};

type ContentItem = {
    attributes?: {
        sectors?: {
            data?: TaxonomyItem[];
        };
        tags?: {
            data?: TaxonomyItem[];
        };
    };
    sectors?: TaxonomyItem[];
    tags?: TaxonomyItem[];
};

type MenuEvent = LooseRecord & {
    occurrence?: string;
    date?: string | null;
    parsedDate?: number;
};

export async function GET() {
    try {
        const [videosRes, eventsRes, issuesRes, sectorsRes, articlesRes, allVideosRes, opinionMenuRes, resourcesRes] = await Promise.all([
            fetch(`${STRAPI_BASE}/api/videos?populate[0]=thumbnail&populate[1]=author.avatar&pagination[limit]=3&sort=createdAt:desc`, { next: { revalidate: 600 } }).catch(() => null),
            fetch(`${STRAPI_BASE}/api/events?populate=image`, { cache: "no-store" }).catch(() => null),
            fetch(`${STRAPI_BASE}/api/issues?populate=CoverImage&pagination[limit]=12`, { next: { revalidate: 600 } }).catch(() => null),
            fetch(`${STRAPI_BASE}/api/sectors?populate=children&pagination[pageSize]=100`, { next: { revalidate: 600 } }).catch(() => null),
            fetch(`${STRAPI_BASE}/api/contents?fields[0]=id&populate[sectors][fields][0]=name&populate[sectors][fields][1]=slug&populate[tags][fields][0]=name&pagination[pageSize]=500`, { next: { revalidate: 600 } }).catch(() => null),
            fetch(`${STRAPI_BASE}/api/videos?fields[0]=id&populate[sectors][fields][0]=name&populate[sectors][fields][1]=slug&populate[tags][fields][0]=name&pagination[pageSize]=500`, { next: { revalidate: 600 } }).catch(() => null),
            // Opinion + Interview articles for the mega menu
            fetch(`${STRAPI_BASE}/api/contents?filters[type_of_content][name][$eq]=Opinion&populate[FeaturedImage]=true&populate[content_tag]=true&populate[author][populate]=avatar&sort=Date:desc&pagination[limit]=10`, { next: { revalidate: 600 } }).catch(() => null),
            fetch(`${STRAPI_BASE}/api/resoucre-centers?fields[0]=resource_type&pagination[pageSize]=500`, {
                headers: process.env.STRAPI_API_TOKEN ? { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` } : {},
                next: { revalidate: 600 }
            }).catch(() => null),
        ]);

        const [videos, events, issues, sectors, articlesObj, allVideosObj, opinionMenuObj, resourcesObj] = await Promise.all([
            videosRes?.ok ? videosRes.json() : Promise.resolve({ data: [] }),
            eventsRes?.ok ? eventsRes.json() : Promise.resolve({ data: [] }),
            issuesRes?.ok ? issuesRes.json() : Promise.resolve({ data: [] }),
            sectorsRes?.ok ? sectorsRes.json() : Promise.resolve({ data: [] }),
            articlesRes?.ok ? articlesRes.json() : Promise.resolve({ data: [] }),
            allVideosRes?.ok ? allVideosRes.json() : Promise.resolve({ data: [] }),
            opinionMenuRes?.ok ? opinionMenuRes.json() : Promise.resolve({ data: [] }),
            resourcesRes?.ok ? resourcesRes.json() : Promise.resolve({ data: [] }),
        ]);

        // Separate opinion articles vs interviews using content_tag
        const allOpinionItems = Array.isArray((opinionMenuObj as ApiCollectionResponse)?.data)
            ? ((opinionMenuObj as ApiCollectionResponse).data ?? [])
            : [];
        const opinionArticles: LooseRecord[] = [];
        const interviewArticles: LooseRecord[] = [];
        allOpinionItems.forEach((item) => {
            const article = (item && typeof item === "object") ? (item as LooseRecord) : {};
            const kind = getOpinionContentKind(item);
            if (kind === "interview") {
                interviewArticles.push(article);
                return;
            }
            if (kind !== "editorial") {
                opinionArticles.push(article);
            }
        });

        const tagCounts: Record<string, number> = {};
        const articleItems = Array.isArray((articlesObj as ApiCollectionResponse<ContentItem>)?.data)
            ? (((articlesObj as ApiCollectionResponse<ContentItem>).data) ?? [])
            : [];
        const videoItems = Array.isArray((allVideosObj as ApiCollectionResponse<ContentItem>)?.data)
            ? (((allVideosObj as ApiCollectionResponse<ContentItem>).data) ?? [])
            : [];
        const allItems: ContentItem[] = [...articleItems, ...videoItems];
        
        const nameToSlug: Record<string, string> = {
            "Oil & Gas": "oil-gas",
            "Oil and Gas": "oil-gas",
            "Power Generation": "power-generation",
            "Renewables": "renewables",
            "Renewable Energy": "renewables",
            "Transmission": "transmission",
            "Distribution": "distribution",
            "Electricity Markets": "electricity-markets",
            "Power Markets": "electricity-markets",
            "New Energies": "new-energies",
            "Energy Storage": "energy-storage",
            "Sustainability & Safety": "sustainability-and-safety"
        };
        const normalizeSectorSlug = (name?: string) => {
            if (!name) return null;
            return nameToSlug[name] || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
        };
        
        allItems.forEach((item) => {
            const sectors = item?.attributes?.sectors?.data || item?.sectors || [];
            const tags = item?.attributes?.tags?.data || item?.tags || [];
            
            const sectorNames = (Array.isArray(sectors) ? sectors : [])
                .map((sector) => sector?.attributes?.name || sector?.name);
            const tagNames = (Array.isArray(tags) ? tags : [])
                .map((tag) => tag?.attributes?.name || tag?.name);
            const sectorSlugs = (Array.isArray(sectors) ? sectors : [])
                .map((sector) => sector?.attributes?.slug || sector?.slug || normalizeSectorSlug(sector?.attributes?.name || sector?.name));
            
            sectorSlugs.forEach(slug => {
                if (!slug) return;
                const parentKey = slug.trim().toLowerCase();
                
                [...sectorNames, ...tagNames].forEach(name => {
                    if (!name) return;
                    const subKey = name.trim().toUpperCase();
                    const combinedKey = `${parentKey}::${subKey}`;
                    tagCounts[combinedKey] = (tagCounts[combinedKey] || 0) + 1;
                });
            });
            
            // Global fallback tracking
            [...sectorNames, ...tagNames].forEach(name => {
                if (!name) return;
                const normalized = name.trim().toUpperCase();
                tagCounts[normalized] = (tagCounts[normalized] || 0) + 1;
            });
        });

        const eventsList = Array.isArray((events as ApiCollectionResponse<MenuEvent>)?.data)
            ? (((events as ApiCollectionResponse<MenuEvent>).data) ?? [])
            : [];
        const eventsWithParsedDate = filterAndSortEventsByOccurrence(eventsList, "upcoming")
            .map((event) => ({
            ...event,
            parsedDate: getEventStartTimestamp(event?.date),
        }));
        const sortedUpcomingEvents = eventsWithParsedDate.slice(0, 3);

        const resourceTypesCounts: Record<string, number> = {};
        const resourceSectorsCounts: Record<string, number> = {};
        const resourceItems = Array.isArray((resourcesObj as ApiCollectionResponse)?.data)
            ? ((resourcesObj as ApiCollectionResponse).data ?? [])
            : [];
        resourceItems.forEach((item) => {
            const entry = (item?.attributes || item || {}) as any;
            const type = (entry.resource_type || "Resource").trim();
            resourceTypesCounts[type] = (resourceTypesCounts[type] || 0) + 1;

            const sectors = entry.sectors?.data || entry.sectors || [];
            const list = Array.isArray(sectors) ? sectors : [];
            list.forEach((sec: any) => {
                const sName = sec.attributes?.name || sec.name || "";
                const sNameTrimmed = sName.trim();
                if (sNameTrimmed) {
                    resourceSectorsCounts[sNameTrimmed] = (resourceSectorsCounts[sNameTrimmed] || 0) + 1;
                }
            });
        });

        return NextResponse.json({
            baseUrl: STRAPI_BASE,
            videos: videos?.data || [],
            events: sortedUpcomingEvents,
            issues: issues?.data || [],
            sectors: sectors?.data || [],
            tagCounts,
            opinionArticles: opinionArticles.slice(0, 3),
            interviewArticles: interviewArticles.slice(0, 3),
            resourceTypesCounts,
            resourceSectorsCounts,
        });
    } catch (error) {
        console.error("Menu API error:", error);
        return NextResponse.json(
            {
                baseUrl: STRAPI_BASE,
                videos: [],
                events: [],
                issues: [],
                sectors: [],
                tagCounts: {},
                opinionArticles: [],
                interviewArticles: [],
                resourceTypesCounts: {},
                resourceSectorsCounts: {},
            },
            { status: 200 }
        );
    }
}
