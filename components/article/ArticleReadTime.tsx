"use client";

import { Clock } from "lucide-react";

interface ArticleReadTimeProps {
    content: any[];
    className?: string;
}

function estimateReadTime(content: any[]): number {
    if (!Array.isArray(content)) return 1;
    let wordCount = 0;
    const extractText = (node: any): string => {
        if (!node) return "";
        if (typeof node === "string") return node;
        if (typeof node.text === "string") return node.text;
        if (Array.isArray(node.children)) return node.children.map(extractText).join(" ");
        return "";
    };
    for (const block of content) {
        wordCount += extractText(block).split(/\s+/).filter(Boolean).length;
    }
    return Math.max(1, Math.ceil(wordCount / 238));
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
