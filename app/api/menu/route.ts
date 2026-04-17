import { NextResponse } from "next/server";

const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

export async function GET() {
    try {
        const [videosRes, eventsRes, issuesRes, sectorsRes, articlesRes, allVideosRes, opinionMenuRes] = await Promise.all([
            fetch(`${STRAPI_BASE}/api/videos?populate[0]=thumbnail&populate[1]=author.avatar&pagination[limit]=3&sort=createdAt:desc`, { next: { revalidate: 600 } }).catch(() => null),
            fetch(`${STRAPI_BASE}/api/events?populate=*&pagination[pageSize]=100`, { next: { revalidate: 600 } }).catch(() => null),
            fetch(`${STRAPI_BASE}/api/issues?populate=CoverImage&pagination[limit]=12`, { next: { revalidate: 600 } }).catch(() => null),
            fetch(`${STRAPI_BASE}/api/sectors?populate=children&pagination[pageSize]=100`, { next: { revalidate: 600 } }).catch(() => null),
            fetch(`${STRAPI_BASE}/api/contents?fields[0]=id&populate[sectors][fields][0]=name&populate[sectors][fields][1]=slug&populate[tags][fields][0]=name&pagination[pageSize]=500`, { next: { revalidate: 600 } }).catch(() => null),
            fetch(`${STRAPI_BASE}/api/videos?fields[0]=id&populate[sectors][fields][0]=name&populate[sectors][fields][1]=slug&populate[tags][fields][0]=name&pagination[pageSize]=500`, { next: { revalidate: 600 } }).catch(() => null),
            // Opinion + Interview articles for the mega menu
            fetch(`${STRAPI_BASE}/api/contents?filters[type_of_content][name][$eq]=Opinion&populate[FeaturedImage]=true&populate[content_tag]=true&populate[author][populate]=avatar&sort=Date:desc&pagination[limit]=10`, { next: { revalidate: 600 } }).catch(() => null),
        ]);

        const [videos, events, issues, sectors, articlesObj, allVideosObj, opinionMenuObj] = await Promise.all([
            videosRes?.ok ? videosRes.json() : Promise.resolve({ data: [] }),
            eventsRes?.ok ? eventsRes.json() : Promise.resolve({ data: [] }),
            issuesRes?.ok ? issuesRes.json() : Promise.resolve({ data: [] }),
            sectorsRes?.ok ? sectorsRes.json() : Promise.resolve({ data: [] }),
            articlesRes?.ok ? articlesRes.json() : Promise.resolve({ data: [] }),
            allVideosRes?.ok ? allVideosRes.json() : Promise.resolve({ data: [] }),
            opinionMenuRes?.ok ? opinionMenuRes.json() : Promise.resolve({ data: [] }),
        ]);

        // Separate opinion articles vs interviews using content_tag
        const allOpinionItems = opinionMenuObj?.data || [];
        const opinionArticles: any[] = [];
        const interviewArticles: any[] = [];
        allOpinionItems.forEach((item: any) => {
            const tag = item?.content_tag?.title || item?.content_tag?.Title ||
                (Array.isArray(item?.content_tag) ? (item.content_tag[0]?.title || item.content_tag[0]?.Title) : null);
            if (tag && tag.toLowerCase() === "interview") {
                interviewArticles.push(item);
            } else {
                opinionArticles.push(item);
            }
        });

        const tagCounts: Record<string, number> = {};
        const allItems = [...(articlesObj?.data || []), ...(allVideosObj?.data || [])];
        
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
        
        allItems.forEach((item: any) => {
            const sectors = item?.attributes?.sectors?.data || item?.sectors || [];
            const tags = item?.attributes?.tags?.data || item?.tags || [];
            
            const sectorNames = (Array.isArray(sectors) ? sectors : [])
                .map((s: any) => s?.attributes?.name || s?.name);
            const tagNames = (Array.isArray(tags) ? tags : [])
                .map((t: any) => t?.attributes?.name || t?.name);
            const sectorSlugs = (Array.isArray(sectors) ? sectors : [])
                .map((s: any) => s?.attributes?.slug || s?.slug || normalizeSectorSlug(s?.attributes?.name || s?.name));
            
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

        const eventsList = events?.data || [];
        const upcomingEvents = eventsList.filter((e: any) => e?.occurrence?.toLowerCase() === 'upcoming');
        
        const parseEventDate = (dateString?: string) => {
            if (!dateString) return 0;
            const str = String(dateString).toLowerCase();
            const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
            let monthIndex = 0;
            for (let i = 0; i < months.length; i++) {
                if (str.includes(months[i])) { monthIndex = i; break; }
            }
            let year = new Date().getFullYear();
            const yearMatch = str.match(/\b(20\d\d)\b/);
            if (yearMatch) { year = parseInt(yearMatch[1], 10); }
            let day = 1;
            const dayMatch = str.match(/(\d{1,2})/);
            if (dayMatch) { day = parseInt(dayMatch[1], 10); }
            return new Date(year, monthIndex, day).getTime();
        };

        const eventsWithParsedDate = upcomingEvents.map((e: any) => ({
            ...e,
            parsedDate: parseEventDate(e.date)
        }));

        const sortedUpcomingEvents = eventsWithParsedDate.sort((a: any, b: any) => {
            return a.parsedDate - b.parsedDate;
        }).slice(0, 3);

        return NextResponse.json({
            baseUrl: STRAPI_BASE,
            videos: videos?.data || [],
            events: sortedUpcomingEvents,
            issues: issues?.data || [],
            sectors: sectors?.data || [],
            tagCounts,
            opinionArticles: opinionArticles.slice(0, 3),
            interviewArticles: interviewArticles.slice(0, 3),
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
            },
            { status: 200 }
        );
    }
}
