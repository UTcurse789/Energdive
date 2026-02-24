import { cachedFetch } from "@/lib/strapi-cache";
import { NextResponse } from "next/server";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const industry = searchParams.get("industry");

    // Build filters
    let filterQs = "";
    if (industry) {
        filterQs = `&filters[industry][name][$eq]=${encodeURIComponent(industry)}`;
    }

    const url = `${STRAPI}/api/contents?populate=*&pagination[page]=${page}&pagination[pageSize]=10${filterQs}`;

    try {
        const data = await cachedFetch(url, undefined, 60_000);

        const res = NextResponse.json(data);
        res.headers.set(
            "Cache-Control",
            "public, s-maxage=60, stale-while-revalidate=120"
        );
        return res;
    } catch (error) {
        console.error("API Proxy Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch content from Strapi" },
            { status: 500 }
        );
    }
}
