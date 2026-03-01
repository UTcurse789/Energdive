"use client";

import { BlocksRenderer } from "@strapi/blocks-react-renderer";

function isImageBlock(block: any): boolean {
    return block?.type === "image";
}

function isNonEmptyParagraph(block: any): boolean {
    if (block?.type !== "paragraph") return false;
    return block?.children?.some(
        (child: any) => typeof child?.text === "string" && child.text.trim().length > 0
    );
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
