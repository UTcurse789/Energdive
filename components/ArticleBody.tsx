"use client";

import { BlocksRenderer } from "@strapi/blocks-react-renderer";
import { ShareButton } from "./ui/share-button";
import dynamic from "next/dynamic";
import { getShortcodeFromBlock } from "@/lib/parse-content-blocks";
import type { ChartConfig, TableConfig, DataBlocksMap } from "@/types/data-blocks";

const ChartWrapper = dynamic(
  () => import("@/components/data-blocks/chart-wrapper"),
  {
    loading: () => (
      <div className="data-block-card animate-pulse" style={{ height: 400 }}>
        <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
        <div className="h-64 bg-gray-100 rounded" />
      </div>
    ),
    ssr: false,
  }
);

const DataTable = dynamic(
  () => import("@/components/data-blocks/data-table"),
  {
    loading: () => (
      <div className="data-block-card animate-pulse" style={{ height: 300 }}>
        <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
        <div className="h-48 bg-gray-100 rounded" />
      </div>
    ),
    ssr: false,
  }
);

const STRAPI_BASE_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

const SHORTCODE_INLINE_RE = /\[(chart|table):([a-zA-Z0-9_-]+)\]/g;

function isImageBlock(block: any): boolean {
    return block?.type === "image";
}

function isNonEmptyParagraph(block: any): boolean {
    if (block?.type !== "paragraph") return false;
    return block?.children?.some(
        (child: any) => typeof child?.text === "string" && child.text.trim().length > 0
    );
}

/** Ensure image URL is absolute and HTTPS */
function resolveImageUrl(url: string | undefined | null): string {
    if (!url) return "";
    let resolved = url;
    resolved = resolved.replace(
        /^https?:\/\/206\.189\.132\.187(?::1337)?/,
        "https://cms.energdive.com"
    );
    if (!resolved.startsWith("http://") && !resolved.startsWith("https://")) {
        resolved = `${STRAPI_BASE_URL}${resolved.startsWith("/") ? "" : "/"}${resolved}`;
    }
    return resolved.replace("http://", "https://");
}

/** Render a shortcode component (chart or table) */
function renderShortcode(
    type: "chart" | "table",
    name: string,
    dataBlocks: DataBlocksMap,
    key: string | number
) {
    const mapKey = `${type}:${name}`;
    const config = dataBlocks[mapKey];

    if (config) {
        if (type === "chart") {
            return (
                <div key={key} className="my-10 not-prose">
                    <ChartWrapper config={config as ChartConfig} />
                </div>
            );
        }
        if (type === "table") {
            return (
                <div key={key} className="my-10 not-prose">
                    <DataTable config={config as TableConfig} />
                </div>
            );
        }
    }

    return (
        <div key={key} className="my-10 not-prose data-block-card data-block-empty">
            <p>Data not available: {name}</p>
        </div>
    );
}

/**
 * Check if a text string contains any shortcodes.
 * Used for inline detection within paragraph text.
 */
function textContainsShortcode(text: string): boolean {
    return SHORTCODE_INLINE_RE.test(text);
}

/**
 * Split a text string into segments: plain text and shortcode references.
 * e.g. "Hello [chart:foo] world" → ["Hello ", {type:"chart", name:"foo"}, " world"]
 */
function splitTextByShortcodes(
    text: string
): Array<string | { type: "chart" | "table"; name: string }> {
    const segments: Array<string | { type: "chart" | "table"; name: string }> = [];
    let lastIndex = 0;

    SHORTCODE_INLINE_RE.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = SHORTCODE_INLINE_RE.exec(text)) !== null) {
        // Text before this shortcode
        if (match.index > lastIndex) {
            segments.push(text.slice(lastIndex, match.index));
        }
        segments.push({
            type: match[1] as "chart" | "table",
            name: match[2],
        });
        lastIndex = match.index + match[0].length;
    }

    // Remaining text after last shortcode
    if (lastIndex < text.length) {
        segments.push(text.slice(lastIndex));
    }

    return segments;
}

interface ArticleBodyProps {
    content: any;
    enableSectionSharing?: boolean;
    dataBlocks?: DataBlocksMap;
}

export default function ArticleBody({
    content,
    enableSectionSharing = false,
    dataBlocks,
}: ArticleBodyProps) {
    if (!Array.isArray(content)) return null;

    const hasDataBlocks = dataBlocks && Object.keys(dataBlocks).length > 0;

    return (
        <div>
            {content.map((block: any, i: number) => {
                // ── Check for shortcode blocks ──
                if (hasDataBlocks) {
                    // 1. Standalone shortcode block (entire block is one shortcode)
                    const shortcode = getShortcodeFromBlock(block);
                    if (shortcode) {
                        return renderShortcode(
                            shortcode.type,
                            shortcode.name,
                            dataBlocks,
                            i
                        );
                    }

                    // 2. Inline shortcodes within a paragraph/text block
                    if (
                        block?.type === "paragraph" &&
                        Array.isArray(block.children)
                    ) {
                        const fullText = block.children
                            .map((c: any) => c?.text ?? "")
                            .join("");

                        // Reset regex state
                        SHORTCODE_INLINE_RE.lastIndex = 0;

                        if (textContainsShortcode(fullText)) {
                            const segments = splitTextByShortcodes(fullText);
                            return (
                                <div key={i}>
                                    {segments.map((seg, j) => {
                                        if (typeof seg === "string") {
                                            // Render plain text as a paragraph
                                            const trimmed = seg.trim();
                                            if (!trimmed) return null;
                                            return <p key={j}>{seg}</p>;
                                        }
                                        // Render the shortcode component
                                        return renderShortcode(
                                            seg.type,
                                            seg.name,
                                            dataBlocks,
                                            `${i}-sc-${j}`
                                        );
                                    })}
                                </div>
                            );
                        }
                    }
                }

                // ── Image caption detection ──
                const isCaption =
                    isNonEmptyParagraph(block) && i > 0 && isImageBlock(content[i - 1]);

                if (isCaption) {
                    const text = block.children
                        .map((child: any) => child?.text ?? "")
                        .join("");

                    return (
                        <p
                            key={i}
                            style={{
                                fontSize: "0.875rem",
                                color: "#6b7280",
                                fontStyle: "italic",
                                textAlign: "center",
                                marginTop: "-0.25rem",
                                marginBottom: "1.75rem",
                                lineHeight: "1.6",
                                fontFamily: "Georgia, serif",
                            }}
                        >
                            {text}
                        </p>
                    );
                }

                // ── Render all other blocks normally ──
                return (
                    <BlocksRenderer
                        key={i}
                        content={[block]}
                        blocks={{
                            quote: ({ children }: any) => (
                                <blockquote
                                    style={{
                                        borderLeft: "4px solid #14b8a6",
                                        backgroundColor: "rgba(204, 251, 241, 0.3)",
                                        borderRadius: "0 0.5rem 0.5rem 0",
                                        padding: "1rem 1.25rem",
                                        margin: "1.5rem 0",
                                        fontStyle: "italic",
                                        color: "#374151",
                                        fontFamily: "Georgia, serif",
                                        lineHeight: "1.8",
                                    }}
                                >
                                    {children}
                                </blockquote>
                            ),
                            image: ({ image }: any) => {
                                const src = resolveImageUrl(image?.url);
                                const alt = image?.alternativeText || image?.name || "";
                                const caption = image?.caption || "";
                                return (
                                    <figure style={{ margin: "2rem 0" }}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={src}
                                            alt={alt}
                                            style={{
                                                width: "100%",
                                                height: "auto",
                                                borderRadius: "0.5rem",
                                            }}
                                        />
                                        {caption && (
                                            <figcaption
                                                style={{
                                                    fontSize: "0.875rem",
                                                    color: "#6b7280",
                                                    fontStyle: "italic",
                                                    textAlign: "center",
                                                    marginTop: "0.5rem",
                                                    fontFamily: "Georgia, serif",
                                                }}
                                            >
                                                {caption}
                                            </figcaption>
                                        )}
                                    </figure>
                                );
                            },
                            ...(enableSectionSharing ? {
                                heading: ({ children, level }: any) => {
                                    const extractText = (node: any): string => {
                                        if (typeof node === 'string') return node;
                                        if (Array.isArray(node)) return node.map(extractText).join('');
                                        if (node && node.props && node.props.children) return extractText(node.props.children);
                                        return '';
                                    };
                                    const text = extractText(children);
                                    const sectionId = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                                    const HeadingTag = `h${level}` as any;

                                    return (
                                        <div id={sectionId} className="group relative flex items-start gap-4">
                                            <div className="hidden sm:block absolute -left-6 top-2 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                                            <HeadingTag style={{ margin: 0, fontWeight: 'bold', color: '#18181b', flex: 1 }}>
                                                {children}
                                            </HeadingTag>
                                            <ShareButton
                                                title={text}
                                                url={typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}#${sectionId}` : ""}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-zinc-100 rounded-full"
                                                iconClassName="w-3.5 h-3.5 text-zinc-400 hover:text-red-500"
                                                hideTextIcon={true}
                                            />
                                        </div>
                                    );
                                },
                            } : {}),
                        }}
                        modifiers={{
                            italic: ({ children }) => (
                                <em
                                    style={{
                                        fontSize: "0.90rem",
                                        color: "#9ca3af",
                                        display: "block",
                                        textAlign: "center",
                                        fontStyle: "italic",
                                    }}
                                >
                                    {children}
                                </em>
                            ),
                        }}
                    />
                );
            })}
        </div>
    );
}
