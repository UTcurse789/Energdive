"use client";

import { BlocksRenderer } from "@strapi/blocks-react-renderer";
import { ShareButton } from "./ui/share-button";

const STRAPI_BASE_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "https://cms.energdive.com";

function isImageBlock(block: any): boolean {
    return block?.type === "image";
}

function isNonEmptyParagraph(block: any): boolean {
    if (block?.type !== "paragraph") return false;
    return block?.children?.some(
        (child: any) => typeof child?.text === "string" && child.text.trim().length > 0
    );
}

/** Ensure image URL is absolute and HTTPS — prepend Strapi base URL for relative paths */
function resolveImageUrl(url: string | undefined | null): string {
    if (!url) return "";
    let resolved = url;

    // Rewrite old Strapi IP-based URLs to the proper domain
    resolved = resolved.replace(
        /^https?:\/\/206\.189\.132\.187(?::1337)?/,
        "https://cms.energdive.com"
    );

    if (!resolved.startsWith("http://") && !resolved.startsWith("https://")) {
        resolved = `${STRAPI_BASE_URL}${resolved.startsWith("/") ? "" : "/"}${resolved}`;
    }
    // Force HTTPS to prevent Mixed Content errors
    return resolved.replace("http://", "https://");
}

export default function ArticleBody({ content, enableSectionSharing = false }: { content: any; enableSectionSharing?: boolean }) {
    if (!Array.isArray(content)) return null;

    return (
        <div>
            {content.map((block: any, i: number) => {
                const isCaption =
                    isNonEmptyParagraph(block) && i > 0 && isImageBlock(content[i - 1]);

                if (isCaption) {
                    // Extract plain text from the paragraph children
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

                // Render all other blocks normally
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
