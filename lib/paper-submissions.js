import { SECTORS as FALLBACK_SECTORS } from "@/data/dummy";

export function readStrapiAttributes(item) {
    return item?.attributes ?? item ?? {};
}

function toRelationArray(relation) {
    if (Array.isArray(relation?.data)) return relation.data;
    if (Array.isArray(relation)) return relation;
    return [];
}

export function extractBlocksText(value) {
    if (!value) return "";
    if (typeof value === "string") return value.trim();
    if (!Array.isArray(value)) return "";

    return value
        .flatMap((block) => {
            if (typeof block === "string") {
                return [block];
            }

            const children = Array.isArray(block?.children) ? block.children : [];
            return children
                .map((child) => child?.text ?? "")
                .filter(Boolean);
        })
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeTaxonomyName(value) {
    return String(value ?? "").trim().toLowerCase();
}

const TOP_LEVEL_SECTOR_LOOKUP = new Map(
    FALLBACK_SECTORS.map((sector) => [normalizeTaxonomyName(sector.title), sector.title])
);

const SUB_SECTOR_PARENT_LOOKUP = FALLBACK_SECTORS.reduce((lookup, sector) => {
    for (const subSector of sector.subSectors ?? []) {
        const key = normalizeTaxonomyName(subSector);
        const existing = lookup.get(key) ?? [];
        lookup.set(key, [...existing, sector.title]);
    }

    return lookup;
}, new Map());

function toUniqueList(values) {
    return Array.from(new Set(values.filter(Boolean)));
}

function splitPaperTaxonomy(rawSectors) {
    const entries = rawSectors.map((sector) => {
        const sectorAttrs = readStrapiAttributes(sector);
        const rawParent =
            sector?.parent?.data ??
            sectorAttrs?.parent?.data ??
            sector?.parent ??
            sectorAttrs?.parent ??
            null;
        const parentAttrs = rawParent ? readStrapiAttributes(rawParent) : null;

        return {
            name: String(sectorAttrs?.name ?? sectorAttrs?.title ?? "").trim(),
            parentName: String(parentAttrs?.name ?? parentAttrs?.title ?? "").trim(),
        };
    }).filter((entry) => entry.name);

    const explicitTopLevelSectors = new Set(
        entries
            .filter((entry) => !entry.parentName)
            .map((entry) => TOP_LEVEL_SECTOR_LOOKUP.get(normalizeTaxonomyName(entry.name)) ?? entry.name)
    );

    const sectorNames = [];
    const subSectorNames = [];
    const subSectors = [];

    for (const entry of entries) {
        const normalizedName = normalizeTaxonomyName(entry.name);
        const normalizedParentName = normalizeTaxonomyName(entry.parentName);
        const canonicalSectorName = TOP_LEVEL_SECTOR_LOOKUP.get(normalizedName);
        const possibleParents = SUB_SECTOR_PARENT_LOOKUP.get(normalizedName) ?? [];

        let resolvedParentName = TOP_LEVEL_SECTOR_LOOKUP.get(normalizedParentName) ?? entry.parentName;

        if (!resolvedParentName && possibleParents.length > 0) {
            resolvedParentName =
                possibleParents.find((parent) => explicitTopLevelSectors.has(parent)) ??
                possibleParents[0];
        }

        if (resolvedParentName) {
            sectorNames.push(resolvedParentName);
            subSectorNames.push(entry.name);
            subSectors.push({
                name: entry.name,
                parentName: resolvedParentName,
            });
            continue;
        }

        if (canonicalSectorName) {
            sectorNames.push(canonicalSectorName);
            continue;
        }

        sectorNames.push(entry.name);
    }

    const allSectorNames = toUniqueList(entries.map((entry) => entry.name));

    return {
        sectorNames: toUniqueList(sectorNames),
        subSectorNames: toUniqueList(subSectorNames),
        subSectors: subSectors.filter((entry, index, collection) =>
            collection.findIndex(
                (candidate) =>
                    candidate.name === entry.name && candidate.parentName === entry.parentName
            ) === index
        ),
        allSectorNames,
    };
}

export function normalizePaperSubmission(item) {
    const attrs = readStrapiAttributes(item);
    const rawSectors = toRelationArray(item?.sectors ?? attrs?.sectors);
    const { sectorNames, subSectorNames, subSectors, allSectorNames } = splitPaperTaxonomy(rawSectors);

    return {
        id:
            item?.id ??
            attrs?.id ??
            attrs?.documentId ??
            attrs?.slug ??
            `${attrs?.author_name ?? "paper"}-${attrs?.submitted_date ?? attrs?.createdAt ?? "entry"}`,
        documentId: attrs?.documentId ?? item?.documentId ?? null,
        title: attrs?.title ?? "",
        authorName: attrs?.author_name ?? "",
        authorEmail: attrs?.author_email ?? "",
        affiliation: attrs?.affiliation ?? "",
        abstract: extractBlocksText(attrs?.abstract),
        submittedDate: attrs?.submitted_date ?? attrs?.createdAt ?? "",
        status: attrs?.paper_status ?? "submitted",
        allSectorNames,
        sectorNames,
        subSectorNames,
        subSectors,
        primarySector: sectorNames[0] ?? subSectors[0]?.parentName ?? allSectorNames[0] ?? "Unassigned",
        pdf: attrs?.pdf ?? item?.pdf ?? null,
    };
}

export function getPaperStatusMeta(status) {
    const normalizedStatus = String(status ?? "submitted").toLowerCase();

    switch (normalizedStatus) {
        case "accepted":
            return {
                label: "Accepted",
                className: "border border-emerald-500/20 bg-emerald-500/12 text-emerald-300",
            };
        case "rejected":
            return {
                label: "Rejected",
                className: "border border-rose-500/20 bg-rose-500/12 text-rose-300",
            };
        case "under_review":
            return {
                label: "Under Review",
                className: "border border-amber-500/20 bg-amber-500/12 text-amber-200",
            };
        default:
            return {
                label: "Submitted",
                className: "border border-sky-500/20 bg-sky-500/12 text-sky-300",
            };
    }
}

export function formatSubmissionDate(value) {
    if (!value) return "Date unavailable";

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return "Date unavailable";
    }

    return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(parsed);
}

export function truncateText(text, maxLength = 150) {
    const normalized = String(text ?? "").trim();

    if (normalized.length <= maxLength) {
        return normalized;
    }

    return `${normalized.slice(0, maxLength).trimEnd()}...`;
}
