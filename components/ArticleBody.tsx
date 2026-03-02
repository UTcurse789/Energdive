"use client";

import { BlocksRenderer } from "@strapi/blocks-react-renderer";

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

export default function ArticleBody({ content }: { content: any }) {
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
