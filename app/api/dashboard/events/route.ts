import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const TOKEN = process.env.STRAPI_API_TOKEN || "";

/**
 * GET /api/dashboard/events
 * Fetches events from Strapi.
 * Query params: occurrence (upcoming/past), pageSize
 */
export async function GET(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const occurrence = searchParams.get("occurrence") || "upcoming";
        const pageSize = Number(searchParams.get("pageSize")) || 20;

        const url =
            `${STRAPI}/api/events?` +
            `populate=*` +
            `&pagination[pageSize]=${pageSize}` +
            `&sort=createdAt:desc` +
            (occurrence ? `&filters[occurrence][$eq]=${encodeURIComponent(occurrence)}` : "");

        console.log("📡 Events URL:", url);

        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${TOKEN}` },
            next: { revalidate: 60 },
        });

        if (!res.ok) {
            console.error(`Strapi events error: ${res.status}`);
            return NextResponse.json({ error: "Strapi error" }, { status: 502 });
        }

        const json = await res.json();
        const items = json?.data || [];

        const events = items.map((item: any) => {
            // Extract description text from rich text blocks
            let descriptionText = "";
            if (Array.isArray(item.description)) {
                descriptionText = item.description
                    .filter((b: any) => b.type === "paragraph")
                    .map((b: any) => b.children?.map((c: any) => c.text).join("") || "")
                    .join(" ")
                    .slice(0, 300);
            }

            // Event image
            const images = item.image || [];
            const firstImage = Array.isArray(images) ? images[0] : images;
            const imageUrl = firstImage?.url ? `${STRAPI}${firstImage.url}` : null;

            return {
                id: String(item.id),
                title: item.title || "Untitled Event",
                slug: item.slug || "",
                date: item.date || "",
                time: item.time || "",
                location: item.location || "",
                venue: item.venue || "",
                url: item.url || "",
                mapUrl: item.mapUrl || "",
                description: descriptionText || "No description available.",
                occurrence: item.occurrence || "upcoming",
                image: imageUrl,
            };
        });

        return NextResponse.json({
            events,
            total: json?.meta?.pagination?.total || events.length,
        });
    } catch (error) {
        console.error("[DASHBOARD_EVENTS]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
