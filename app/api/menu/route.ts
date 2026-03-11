import { NextResponse } from "next/server";

const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

export async function GET() {
    try {
        const [videosRes, eventsRes, issuesRes, sectorsRes] = await Promise.all([
            fetch(`${STRAPI_BASE}/api/videos?populate[0]=thumbnail&populate[1]=author.avatar&pagination[limit]=3&sort=createdAt:desc`, { next: { revalidate: 600 } }).catch(() => null),
            fetch(`${STRAPI_BASE}/api/events?populate=*&pagination[limit]=3&sort=createdAt:desc`, { next: { revalidate: 600 } }).catch(() => null),
            fetch(`${STRAPI_BASE}/api/issues?populate=CoverImage&pagination[limit]=12`, { next: { revalidate: 600 } }).catch(() => null),
            fetch(`${STRAPI_BASE}/api/sectors?populate=children&pagination[pageSize]=100`, { next: { revalidate: 600 } }).catch(() => null),
        ]);

        const [videos, events, issues, sectors] = await Promise.all([
            videosRes?.ok ? videosRes.json() : Promise.resolve({ data: [] }),
            eventsRes?.ok ? eventsRes.json() : Promise.resolve({ data: [] }),
            issuesRes?.ok ? issuesRes.json() : Promise.resolve({ data: [] }),
            sectorsRes?.ok ? sectorsRes.json() : Promise.resolve({ data: [] }),
        ]);

        return NextResponse.json({
            baseUrl: STRAPI_BASE,
            videos: videos?.data || [],
            events: events?.data || [],
            issues: issues?.data || [],
            sectors: sectors?.data || [],
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
            },
            { status: 200 }
        );
    }
}
