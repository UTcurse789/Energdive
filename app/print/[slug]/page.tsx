import { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { formatContentDate } from "@/lib/date";
import ArticleBody from "@/components/ArticleBody";
import { fetchDataBlocks } from "@/lib/parse-content-blocks";
import PrintTrigger from "@/components/print/PrintTrigger";
import { strapiImageUrl } from "@/lib/strapi-image";
import { getCanonicalUrl } from "@/lib/seo";

/* ─── Strapi ─── */
const STRAPI = "http://206.189.132.187:1337";
const SITE_NAME = "Energdive";

/* ─── Data ─── */
async function getArticle(slug: string) {
    const res = await fetch(
        `${STRAPI}/api/contents?filters[slug][$eq]=${slug}&populate=*`,
        { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.[0] ?? null;
}

/* ─── SEO ─── */
export async function generateMetadata(
    props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await props.params;
    const data = await getArticle(slug);
    const baseTitle = data?.Title || "Article";
    const cleanBaseTitle = String(baseTitle).replace(/^['"“”‘’]+|['"“”‘’]+$/g, "").trim();
    const shareTitle = `${cleanBaseTitle} - ENERGDIVE`;
    return {
        title: { absolute: shareTitle },
        alternates: {
            canonical: getCanonicalUrl(`/articles/${slug}`),
        },
        robots: { index: false, follow: false },
    };
}

/* ─── Page ─── */
export default async function PrintPage(
    props: { params: Promise<{ slug: string }> }
) {
    const { slug } = await props.params;
    const data = await getArticle(slug);
    if (!data) notFound();

    const title = data.Title ?? "";
    const excerpt = data.Excerpt?.[0]?.children?.[0]?.text ?? "";
    const content = data.Content ?? [];
    const date = formatContentDate(data.Date ?? data.publishedAt ?? data.createdAt);
    const author = data.author?.name ?? null;
    const image = data.FeaturedImage?.url ? strapiImageUrl(data.FeaturedImage.url) : null;
    const articleUrl = getCanonicalUrl(`/articles/${slug}`);

    const dataBlocks = await fetchDataBlocks(content);

    return (
        <>
            {/* Auto-print + reprint button — hidden in print */}
            <PrintTrigger />

            <div className="print-wrap">

                {/* ── Masthead ── */}
                <div className="print-masthead">
                    <p className="print-from-text">Printed from</p>
                    <div className="print-logo-row">
                        <Image
                            src="/Energdive-Logo.png"
                            alt={SITE_NAME}
                            width={240}
                            height={60}
                            priority
                            className="print-logo-img"
                        />
                    </div>
                    <div className="print-red-bar" />
                </div>

                {/* ── Headline ── */}
                <h1 className="print-title">{title}</h1>

                {/* ── Byline ── */}
                <p className="print-byline">
                    {author && <span>{author}</span>}
                    {author && date && <span className="print-sep"> | </span>}
                    {date && <time>{date}</time>}
                </p>

                {/* ── Article body with image floated left ── */}
                <div className="print-body-wrap">
                    {image && (
                        <div className="print-float-img">
                            <Image
                                src={image}
                                alt={title}
                                width={320}
                                height={210}
                                className="print-feat-img"
                                priority
                            />
                        </div>
                    )}
                    {excerpt && <p className="print-excerpt">{excerpt}</p>}
                    <div className="print-body">
                        <ArticleBody content={content} dataBlocks={dataBlocks} />
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="print-foot-bar" />
                <p className="print-footer-url">{articleUrl}</p>

            </div>

            {/* ── All styles inlined so they survive any CSS purge ── */}
            <style>{`
                /* ── Base ── */
                * { box-sizing: border-box; }
                body {
                    margin: 0;
                    padding: 0;
                    background: #fff;
                    font-family: Georgia, "Times New Roman", Times, serif;
                    color: #000;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                /* ── Outer wrap ── */
                .print-wrap {
                    max-width: 860px;
                    margin: 0 auto;
                    padding: 28px 32px 48px;
                    background: #fff;
                }

                /* ── Masthead ── */
                .print-masthead { margin-bottom: 14px; }
                .print-from-text {
                    font-family: Arial, sans-serif;
                    font-size: 11px;
                    color: #666;
                    margin: 0 0 4px;
                    letter-spacing: 0.01em;
                }
                .print-logo-row { margin-bottom: 10px; }
                .print-logo-img { height: 52px; width: auto; display: block; }
                .print-red-bar {
                    height: 3px;
                    background: #cc0000;
                    margin-bottom: 16px;
                }

                /* ── Headline ── */
                .print-title {
                    font-family: Georgia, serif;
                    font-size: 28px;
                    font-weight: 700;
                    line-height: 1.2;
                    letter-spacing: -0.01em;
                    color: #000;
                    margin: 0 0 10px;
                }

                /* ── Byline ── */
                .print-byline {
                    font-family: Arial, Helvetica, sans-serif;
                    font-size: 12px;
                    color: #333;
                    margin: 0 0 14px;
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 10px;
                }
                .print-sep { color: #999; }

                /* ── Body area ── */
                .print-body-wrap {
                    overflow: hidden; /* clearfix for float */
                }
                .print-float-img {
                    float: left;
                    margin: 4px 20px 12px 0;
                    clear: left;
                }
                .print-feat-img {
                    display: block;
                    width: 320px;
                    height: auto;
                    max-width: 40%;
                }
                .print-excerpt {
                    font-family: Georgia, serif;
                    font-size: 16px;
                    line-height: 1.7;
                    color: #111;
                    font-weight: 700;
                    margin: 0 0 10px;
                }
                .print-body {
                    font-family: Georgia, serif;
                    font-size: 15px;
                    line-height: 1.8;
                    color: #111;
                }
                .print-body p { margin: 0 0 12px; }
                .print-body h2 {
                    font-size: 18px;
                    font-weight: 700;
                    margin: 20px 0 8px;
                }
                .print-body h3 {
                    font-size: 16px;
                    font-weight: 700;
                    margin: 16px 0 6px;
                }
                .print-body img { max-width: 100%; height: auto; margin: 8px 0; }
                .print-body a { color: #cc0000; text-decoration: underline; }
                .print-body blockquote {
                    border-left: 3px solid #ccc;
                    padding-left: 14px;
                    margin: 16px 0;
                    color: #444;
                    font-style: italic;
                }

                /* ── Footer ── */
                .print-foot-bar {
                    height: 1px;
                    background: #ccc;
                    margin: 32px 0 8px;
                    clear: both;
                }
                .print-footer-url {
                    font-family: Arial, sans-serif;
                    font-size: 10px;
                    color: #666;
                    word-break: break-all;
                    margin: 0;
                }

                /* ── @media print — hide ALL site chrome ── */
                @media print {
                    @page { size: A4; margin: 15mm 12mm 18mm 12mm; }

                    /* ── Hide every site UI element ── */
                    #print-btn,
                    header,
                    footer,
                    nav,
                    aside,
                    [role="banner"],
                    [role="navigation"],
                    [role="complementary"],
                    .site-header,
                    .site-footer,
                    .site-nav,
                    .scroll-progress,
                    .navbar,
                    .top-bar,
                    .bottom-bar,
                    .ad-banner,
                    .subscribe-bar,
                    [class*="header"],
                    [class*="footer"],
                    [class*="navbar"],
                    [class*="Navbar"],
                    [class*="nav-"],
                    [class*="ScrollProgress"],
                    [id*="header"],
                    [id*="footer"] {
                        display: none !important;
                        visibility: hidden !important;
                    }

                    /* ── Reset everything outside wrap ── */
                    html, body {
                        background: #fff !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    .print-wrap {
                        max-width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }

                    /* ── No page break mid-image ── */
                    .print-float-img { page-break-inside: avoid; break-inside: avoid; }
                    .print-feat-img { max-width: 42% !important; }

                    /* ── Headings don't orphan ── */
                    h1, h2, h3 { page-break-after: avoid; break-after: avoid; }
                    p, blockquote { orphans: 3; widows: 3; }

                    .print-title { font-size: 24pt !important; }
                    .print-body { font-size: 11pt !important; line-height: 1.7 !important; }
                    .print-excerpt { font-size: 12pt !important; }

                    .print-body a::after { content: none; }
                    .print-red-bar { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }

                /* ── On screen: also hide site header/footer so the print page looks clean ── */
                @media screen {
                    header:not(.print-masthead),
                    footer,
                    nav:not(.print-nav),
                    [role="banner"],
                    [role="navigation"] {
                        display: none !important;
                    }
                }
            `}</style>
        </>
    );
}
