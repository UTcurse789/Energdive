"use client";

import { BlocksRenderer } from "@strapi/blocks-react-renderer";

export default function ArticleBody({ content }: { content: any }) {
    return (
        <BlocksRenderer
            content={content}
            modifiers={{
                italic: ({ children }) => (
                    <em style={{
                        fontSize: '0.90rem',
                        color: '#9ca3af',
                        display: 'block',
                        textAlign: 'center',
                        fontStyle: 'italic'
                    }}>
                        {children}
                    </em>
                )
            }}
        />
    );
}
