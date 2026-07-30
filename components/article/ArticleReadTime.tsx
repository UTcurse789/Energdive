"use client";

import { Clock } from "lucide-react";

interface ArticleReadTimeProps {
    content: any[];
    className?: string;
}

function estimateReadTime(content: any[]): number {
    if (!Array.isArray(content) || content.length === 0) return 1;
    let wordCount = 0;

    const extractText = (node: any): string => {
        if (!node) return "";
        if (typeof node === "string") return node;
        if (typeof node.text === "string") return node.text;
        if (Array.isArray(node.children)) return node.children.map(extractText).join(" ");
        if (typeof node.body === "string") return node.body;
        if (typeof node.title === "string") return node.title;
        return "";
    };

    for (const block of content) {
        const text = extractText(block);
        const words = text.trim().split(/\s+/).filter(Boolean);
        wordCount += words.length;
    }

    // 200 words per minute average reading speed
    return Math.max(1, Math.ceil(wordCount / 200));
}

export function ArticleReadTime({ content, className = "" }: ArticleReadTimeProps) {
    const minutes = estimateReadTime(content);
    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 ${className}`}>
            <Clock className="h-3.5 w-3.5" />
            {minutes} min read
        </span>
    );
}
