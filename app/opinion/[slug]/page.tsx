import React from "react";
import { notFound } from "next/navigation";
import { OPINIONS } from "@/data/dummy";
import { OpinionContent } from "./opinion-content";

export default async function OpinionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const opinion = OPINIONS.find((o) => o.slug === slug);

    if (!opinion) {
        notFound();
    }

    const recommended = OPINIONS.filter((o) => o.id !== opinion.id).slice(0, 3);

    return <OpinionContent opinion={opinion} recommended={recommended} />;
}