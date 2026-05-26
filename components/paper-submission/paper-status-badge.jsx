import { getPaperStatusMeta } from "@/lib/paper-submissions";

export default function PaperStatusBadge({ status }) {
    const meta = getPaperStatusMeta(status);

    return (
        <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${meta.className}`}
        >
            {meta.label}
        </span>
    );
}
