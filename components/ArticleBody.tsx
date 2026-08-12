"use client";

import { Fragment } from "react";
import Image from "next/image";
import { BlocksRenderer } from "@strapi/blocks-react-renderer";
import { ShareButton } from "./ui/share-button";
import dynamic from "next/dynamic";
import { AdBanner } from "@/components/ads/AdBanner";
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

const SHORTCODE_INLINE_PATTERN = String.raw`\[(chart|table):([a-zA-Z0-9_-]+)\]`;

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

/** Recursively extract plain text from Strapi block children nodes (including link nodes, bold nodes, etc.) */
function extractTextFromNodes(nodes: any): string {
    if (!nodes) return "";
    if (typeof nodes === "string") return nodes;
    if (Array.isArray(nodes)) {
        return nodes.map(extractTextFromNodes).join("");
    }
    if (typeof nodes?.text === "string") return nodes.text;
    if (Array.isArray(nodes?.children)) {
        return extractTextFromNodes(nodes.children);
    }
    return "";
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
    return new RegExp(SHORTCODE_INLINE_PATTERN).test(text);
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

    const shortcodeInlineRegex = new RegExp(SHORTCODE_INLINE_PATTERN, "g");
    let match: RegExpExecArray | null;

    while ((match = shortcodeInlineRegex.exec(text)) !== null) {
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

type AdBannerVariant = "banner" | "card" | "hero" | "vertical" | "native" | "mobile_banner";

interface MidContentAdConfig {
    placement: string;
    afterParagraphFraction: number;
    sectorSlug?: string;
    variant?: AdBannerVariant;
    showSkeleton?: boolean;
    className?: string;
}

function getMidContentAdInsertions(
    blocks: any[],
    midContentAds: MidContentAdConfig[]
): Map<number, MidContentAdConfig[]> {
    if (!midContentAds.length) return new Map();

    const eligibleParagraphIndices = blocks.reduce<number[]>((acc, block, index) => {
        const isCaption = isNonEmptyParagraph(block) && index > 0 && isImageBlock(blocks[index - 1]);
        if (isNonEmptyParagraph(block) && !isCaption) {
            acc.push(index);
        }
        return acc;
    }, []);

    if (!eligibleParagraphIndices.length) return new Map();

    const insertions = new Map<number, MidContentAdConfig[]>();

    midContentAds.forEach((adConfig) => {
        const boundedFraction = Math.min(1, Math.max(0, adConfig.afterParagraphFraction));
        const paragraphPosition = Math.max(1, Math.ceil(eligibleParagraphIndices.length * boundedFraction));
        const paragraphIndex = eligibleParagraphIndices[Math.min(eligibleParagraphIndices.length - 1, paragraphPosition - 1)];
        const existingAds = insertions.get(paragraphIndex) || [];
        existingAds.push(adConfig);
        insertions.set(paragraphIndex, existingAds);
    });

    return insertions;
}

interface ArticleBodyProps {
    content: any;
    enableSectionSharing?: boolean;
    dataBlocks?: DataBlocksMap;
    midContentAds?: MidContentAdConfig[];
}

export default function ArticleBody({
    content,
    enableSectionSharing = false,
    dataBlocks,
    midContentAds = [],
}: ArticleBodyProps) {
    if (!Array.isArray(content)) return null;

    const hasDataBlocks = dataBlocks && Object.keys(dataBlocks).length > 0;
    const midContentAdInsertions = getMidContentAdInsertions(content, midContentAds);

    const renderMidContentAds = (blockIndex: number) => {
        const ads = midContentAdInsertions.get(blockIndex);
        if (!ads?.length) return null;

        return ads.map((adConfig, adIndex) => (
            <div
                key={`mid-content-ad-${blockIndex}-${adConfig.placement}-${adIndex}`}
                className={`not-prose my-10 ${adConfig.className || ""}`.trim()}
            >
                <AdBanner
                    placement={adConfig.placement}
                    sectorSlug={adConfig.sectorSlug}
                    variant={adConfig.variant || "banner"}
                    showSkeleton={adConfig.showSkeleton}
                />
            </div>
        ));
    };

    return (
        <div className="article-body">
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
                        const fullText = extractTextFromNodes(block.children);

                        if (textContainsShortcode(fullText)) {
                            const segments = splitTextByShortcodes(fullText);
                            return (
                                <Fragment key={i}>
                                    <div>
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
                                    {renderMidContentAds(i)}
                                </Fragment>
                            );
                        }
                    }
                }

                // ── Image caption detection ──
                const isCaption =
                    isNonEmptyParagraph(block) && i > 0 && isImageBlock(content[i - 1]);

                if (isCaption) {
                    const text = extractTextFromNodes(block.children);

                    return (
                        <Fragment key={i}>
                            <p
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
                            {renderMidContentAds(i)}
                        </Fragment>
                    );
                }

                // ── Render all other blocks normally ──
                return (
                    <Fragment key={i}>
                        <BlocksRenderer
                            content={[block]}
                            blocks={{
                                link: ({ children, url }: any) => {
                                    const href = url || "#";
                                    const isExternal = href.startsWith("http") && !href.includes("energdive.com");
                                    return (
                                        <a
                                            href={href}
                                            target={isExternal ? "_blank" : undefined}
                                            rel={isExternal ? "noopener noreferrer" : undefined}
                                            className="text-[#00A651] font-semibold underline underline-offset-4 decoration-[#00A651]/40 hover:text-[#008741] hover:decoration-[#00A651] transition-colors inline-link"
                                            style={{ color: "#00A651", textDecoration: "underline" }}
                                        >
                                            {children}
                                        </a>
                                    );
                                },
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
                                            {/* Article inline image — uses Next.js Image for WebP optimization */}
                                            <Image
                                                src={src}
                                                alt={alt}
                                                width={0}
                                                height={0}
                                                sizes="(max-width: 768px) 100vw, 720px"
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
                                        const text = extractTextFromNodes(children);
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
                                italic: ({ children }) => <em className="italic">{children}</em>,
                                bold: ({ children }) => <strong className="font-bold">{children}</strong>,
                                underline: ({ children }) => <u className="underline">{children}</u>,
                                strikethrough: ({ children }) => <s className="line-through">{children}</s>,
                                code: ({ children }) => (
                                    <code className="bg-gray-100 rounded px-1.5 py-0.5 font-mono text-sm">{children}</code>
                                ),
                            }}
                        />
                        {renderMidContentAds(i)}
                    </Fragment>
                );
            })}
        </div>
    );
}

