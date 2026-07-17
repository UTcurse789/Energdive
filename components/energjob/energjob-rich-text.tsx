import { Fragment, type ReactNode } from "react";

type RichTextNode = {
  type?: string;
  text?: string;
  url?: string;
  level?: number;
  format?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  children?: RichTextNode[];
};

type RichTextBlock = RichTextNode[];

type EnergJobRichTextProps = {
  content: RichTextBlock;
  emptyFallback?: string;
  className?: string;
};

const HEADING_TAGS: Record<number, "h2" | "h3" | "h4" | "h5" | "h6"> = {
  1: "h2",
  2: "h3",
  3: "h4",
  4: "h5",
  5: "h6",
  6: "h6",
};

const HEADING_CLASSES: Record<number, string> = {
  1: "mt-5 text-xl font-extrabold tracking-[-0.03em] text-[#091d3a] sm:text-[1.6rem]",
  2: "mt-4 text-lg font-bold tracking-[-0.02em] text-[#091d3a] sm:text-[1.35rem]",
  3: "mt-4 text-base font-bold tracking-[-0.01em] text-[#10253f] sm:text-[1.15rem]",
  4: "mt-4 text-sm font-bold uppercase tracking-[0.12em] text-[#11624f]",
  5: "mt-3 text-xs font-bold uppercase tracking-[0.15em] text-[#11624f]",
  6: "mt-3 text-xs font-bold uppercase tracking-[0.15em] text-[#11624f]",
};

function getNodeText(node: RichTextNode | null | undefined): string {
  if (!node) {
    return "";
  }

  if (typeof node.text === "string") {
    return node.text;
  }

  if (Array.isArray(node.children)) {
    return node.children.map((child) => getNodeText(child)).join("");
  }

  return "";
}

function hasVisibleText(node: RichTextNode | null | undefined): boolean {
  return getNodeText(node).replace(/\s+/g, "").length > 0;
}

function renderInlineNode(node: RichTextNode, key: string): ReactNode {
  if (typeof node.text === "string") {
    let content: ReactNode = node.text;

    if (node.code) {
      content = (
        <code className="rounded-md bg-[#eef4f8] px-1.5 py-0.5 text-[0.92em] text-[#143f52]">
          {content}
        </code>
      );
    }
    if (node.bold) {
      content = <strong>{content}</strong>;
    }
    if (node.italic) {
      content = <em>{content}</em>;
    }
    if (node.underline) {
      content = <span className="underline underline-offset-2">{content}</span>;
    }
    if (node.strikethrough) {
      content = <span className="line-through">{content}</span>;
    }

    return <Fragment key={key}>{content}</Fragment>;
  }

  const children = Array.isArray(node.children)
    ? node.children.map((child, index) => renderInlineNode(child, `${key}-${index}`))
    : null;

  if (!children) {
    return null;
  }

  if (node.type === "link" || node.url) {
    const href = node.url || "#";
    const isExternal = /^https?:\/\//i.test(href);

    return (
      <a
        key={key}
        href={href}
        {...(isExternal ? { rel: "noreferrer", target: "_blank" } : {})}
        className="font-semibold text-[#0b7c6c] underline decoration-[#09B697]/35 underline-offset-4 transition-colors hover:text-[#09B697]"
      >
        {children}
      </a>
    );
  }

  return <Fragment key={key}>{children}</Fragment>;
}

function renderInlineChildren(children: RichTextNode[] | undefined, keyPrefix: string) {
  if (!Array.isArray(children) || children.length === 0) {
    return null;
  }

  return children.map((child, index) => renderInlineNode(child, `${keyPrefix}-${index}`));
}

export default function EnergJobRichText({
  content,
  emptyFallback = "Detailed information will be available soon.",
  className = "",
}: EnergJobRichTextProps) {
  if (!Array.isArray(content) || content.length === 0) {
    return <p className="text-[14px] leading-6 text-black/70">{emptyFallback}</p>;
  }

  const renderedBlocks = content
    .map((block, index) => {
      if (!block || !hasVisibleText(block)) {
        return null;
      }

      switch (block.type) {
        case "heading": {
          const level = Math.min(Math.max(block.level || 2, 1), 6);
          const Tag = HEADING_TAGS[level];

          return (
            <Tag key={`heading-${index}`} className={HEADING_CLASSES[level]}>
              {renderInlineChildren(block.children, `heading-${index}`)}
            </Tag>
          );
        }

        case "list": {
          const isOrdered = block.format === "ordered";
          const ListTag = isOrdered ? "ol" : "ul";

          return (
            <ListTag
              key={`list-${index}`}
              className={`space-y-2 pl-5 text-[14px] leading-6 text-black/72 marker:text-[#09B697] ${
                isOrdered ? "list-decimal" : "list-disc"
              }`}
            >
              {(block.children || []).map((item, itemIndex) => (
                <li key={`list-item-${index}-${itemIndex}`}>
                  {renderInlineChildren(item.children || [item], `list-item-${index}-${itemIndex}`)}
                </li>
              ))}
            </ListTag>
          );
        }

        case "quote":
          return (
            <blockquote
              key={`quote-${index}`}
              className="rounded-r-2xl border-l-4 border-[#09B697] bg-[#eef8f5] px-4 py-3 text-[14px] italic leading-6 text-[#27445c]"
            >
              {renderInlineChildren(block.children, `quote-${index}`)}
            </blockquote>
          );

        case "paragraph":
        default:
          return (
            <p key={`paragraph-${index}`} className="text-[14px] leading-6 text-black/72">
              {renderInlineChildren(block.children, `paragraph-${index}`)}
            </p>
          );
      }
    })
    .filter(Boolean);

  if (renderedBlocks.length === 0) {
    return <p className="text-[14px] leading-6 text-black/70">{emptyFallback}</p>;
  }

  return <div className={`space-y-4 ${className}`.trim()}>{renderedBlocks}</div>;
}
