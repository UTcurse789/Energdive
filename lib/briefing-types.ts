import type { DigestFormat, DigestFrequency } from "./digest-preferences";

export interface DigestItem {
    key: string;
    title: string;
    href: string;
    crispLine: string;
    imageUrl: string | null;
    imageWidth?: number;
    imageHeight?: number;
    publishedAt: Date;
    sortAt: Date;
    badge: string;
    formats: DigestFormat[];
    publisher?: string;
    eventDate?: string | null;
    eventVenue?: string | null;
    eventDescription?: string | null;
    contentTag?: string;
    featuredType?: "article" | "interview" | "opinion";
    editorialPriority?: number;
}

export interface DigestSection { format: DigestFormat; items: DigestItem[] }
export interface ProcessDigestsOptions { email?: string; limit?: number; frequency?: string }
export interface ProcessDigestsResult {
    success: boolean; processed: number; due: number; sent: number; skipped: number; errors: number;
    reason?: string;
    results: Array<{ email: string; status: "sent" | "skipped" | "failed"; reason?: string; items?: number }>;
}
export interface PreviewDigestOptions {
    email: string; firstName?: string; frequency?: DigestFrequency; formats?: DigestFormat[];
}
export interface PreviewDigestResult {
    success: boolean; email: string; items: number; formats: DigestFormat[]; frequency: DigestFrequency; reason?: string;
}
