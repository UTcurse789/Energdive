import { notFound } from "next/navigation";

/**
 * Legacy print URLs are intentionally unavailable. Printing now happens from
 * the article page through the browser's native print dialog.
 */
export default function LegacyPrintPage() {
    notFound();
}
