import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Briefcase } from "lucide-react";
import { strapiImageUrl } from "@/lib/strapi-image";

const STRAPI_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

export const metadata: Metadata = {
    title: "Our Authors | Energdive",
    description: "Meet the voices and experts behind Energdive's market intelligence and industry analysis.",
};

function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function extractText(field: any): string {
    if (!field) return "";
    if (typeof field === "string") return field;
    if (Array.isArray(field)) {
        return field
            .map((block: any) =>
                (block.children || []).map((child: any) => child.text || "").join("")
            )
            .filter(Boolean)
            .join(" ")
            .trim();
    }
    if (typeof field === "object" && field.children) {
        return (field.children || []).map((child: any) => child.text || "").join("");
    }
    return String(field);
}

async function getAllAuthors() {
    const res = await fetch(
        `${STRAPI_BASE}/api/authors?populate=avatar&pagination[pageSize]=100`,
        { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
}

export default async function AuthorsPage() {
    const rawAuthors = await getAllAuthors();

    const authors = rawAuthors.map((author: any) => {
        const attrs = author.attributes || author;
        const name = extractText(attrs.name) || "Unknown Author";
        const designation = extractText(attrs.designation) || "Author";
        const bio = extractText(attrs.bio) || "";

        const avatarData = attrs.avatar?.data?.attributes || attrs.avatar;
        const avatarUrl = avatarData?.url
            ? (avatarData.url.startsWith("http") ? avatarData.url : strapiImageUrl(avatarData.url))
            : null;

        return {
            id: author.id,
            name,
            slug: slugify(name),
            designation,
            bio,
            avatarUrl,
        };
    }).filter((a: any) => a.slug && a.name !== "Unknown Author");

    // Alphabetical sort by name
    authors.sort((a: any, b: any) => a.name.localeCompare(b.name));

    return (
        <div className="min-h-screen bg-[#f5f7fa] text-zinc-900 pb-20">
            {/* Hero Section */}
            <section className="relative overflow-hidden border-b border-zinc-200 bg-zinc-950 text-white flex flex-col justify-center" style={{ minHeight: '40vh', paddingTop: '60px', paddingBottom: '60px' }}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(0,166,81,0.3),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(9,182,151,0.18),transparent_40%)]" />
                <div className="container relative z-10 mx-auto px-6 lg:px-16 max-w-[1400px] text-center">
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-white mb-6">
                        Our Authors
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-zinc-300 font-serif leading-relaxed">
                        Meet the experts, analysts, and voices powering Energdive. Discover their perspectives
                        on market intelligence, energy transition, and industry trends.
                    </p>
                </div>
            </section>

            {/* Grid Section */}
            <section className="container mx-auto px-6 lg:px-16 max-w-[1400px]" style={{ marginTop: '50px', marginBottom: '50px' }}>
                {authors.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-zinc-300 bg-white py-20 text-center">
                        <p className="text-zinc-500 font-serif text-lg">No authors found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {authors.map((author: any) => (
                            <Link
                                href={`/author/${author.slug}`}
                                key={author.id}
                                className="group flex flex-col bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-[0_12px_34px_rgba(15,23,42,0.06)] hover:shadow-[0_20px_50px_rgba(15,23,42,0.12)] transition-all duration-300 hover:-translate-y-2 overflow-hidden relative"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00A651]/5 to-transparent rounded-full blur-2xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                {/* Avatar */}
                                <div className="flex items-center justify-center mb-6">
                                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-[3px] border-zinc-50 shadow-sm bg-zinc-50 transition-transform duration-500 group-hover:scale-105">
                                        {author.avatarUrl ? (
                                            <Image
                                                src={author.avatarUrl}
                                                alt={author.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a4731] to-[#09B697]">
                                                <span className="text-4xl font-bold text-white">
                                                    {author.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="text-center flex-1 flex flex-col items-center">
                                    <h2 className="text-xl font-serif font-bold text-zinc-900 group-hover:text-[#00A651] transition-colors mb-2">
                                        {author.name}
                                    </h2>

                                    <div className="mb-4 text-[#00A651] text-center w-full px-2">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.16em] leading-relaxed">
                                            <Briefcase className="w-3.5 h-3.5 inline-block shrink-0 align-middle relative -top-[2px]" style={{ minWidth: '14px', marginRight: '8px' }} />
                                            {author.designation}
                                        </span>
                                    </div>

                                    {author.bio && (
                                        <p className="text-sm text-zinc-500 leading-relaxed line-clamp-3 mb-6">
                                            {author.bio}
                                        </p>
                                    )}

                                    <div className="mt-auto inline-flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400 group-hover:text-[#00A651] transition-colors w-full border-t border-zinc-100 pt-5">
                                        View Profile
                                        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
