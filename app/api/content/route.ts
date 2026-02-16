import { fetchContent } from "@/lib/strapi";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const industry = searchParams.get("industry");

    // Build filters object
    const filters: Record<string, any> = {};
    if (industry) {
        filters.industry = { name: { $eq: industry } };
    }

    try {
        const data = await fetchContent(page, 10, filters);
        return NextResponse.json(data);
    } catch (error) {
        console.error("API Proxy Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch content form Strapi" },
            { status: 500 }
        );
    }
}
