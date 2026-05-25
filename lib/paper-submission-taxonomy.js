import { SECTORS as FALLBACK_SECTORS } from "@/data/dummy";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

export const PAPER_PROFESSION_OPTIONS = [
    "Researcher",
    "Academic",
    "Industry Professional",
    "Policy Maker",
    "Student",
    "Consultant",
    "Other",
];

export function readStrapiAttributes(item) {
    return item?.attributes ?? item ?? {};
}

export function toSlug(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function normalizeSubSector(item) {
    const attrs = readStrapiAttributes(item);

    return {
        id: item?.id ?? attrs?.id ?? attrs?.documentId ?? attrs?.slug ?? attrs?.name ?? "",
        name: attrs?.name ?? attrs?.title ?? "",
    };
}

function normalizeSector(item) {
    const attrs = readStrapiAttributes(item);
    const itemChildren = item?.children;
    const attrsChildren = attrs?.children;
    const itemParent = item?.parent;
    const attrsParent = attrs?.parent;

    const rawChildren = Array.isArray(itemChildren?.data)
        ? itemChildren.data
        : Array.isArray(itemChildren)
            ? itemChildren
            : Array.isArray(attrsChildren?.data)
                ? attrsChildren.data
                : Array.isArray(attrsChildren)
                    ? attrsChildren
                    : [];

    const rawParent = itemParent?.data ?? attrsParent?.data ?? itemParent ?? attrsParent ?? null;
    const parentAttrs = rawParent ? readStrapiAttributes(rawParent) : null;

    return {
        id: item?.id ?? attrs?.id ?? null,
        name: attrs?.name ?? attrs?.title ?? "",
        slug: attrs?.slug ?? toSlug(attrs?.name ?? attrs?.title ?? ""),
        parentId: rawParent?.id ?? parentAttrs?.id ?? parentAttrs?.documentId ?? null,
        parentSlug: parentAttrs?.slug ?? toSlug(parentAttrs?.name ?? parentAttrs?.title ?? ""),
        children: rawChildren
            .map(normalizeSubSector)
            .filter((child) => child.id && child.name),
    };
}

function getCanonicalSectorMatchScore(candidate, fallbackSector) {
    const candidateSlug = candidate.slug || toSlug(candidate.name);
    const candidateName = String(candidate.name ?? "").trim().toLowerCase();
    const fallbackTitle = String(fallbackSector.title ?? "").trim().toLowerCase();
    let score = 0;

    if (!candidate.parentId) score += 10;
    if (candidateSlug === fallbackSector.slug) score += 8;
    if (candidateName === fallbackTitle) score += 6;
    if (toSlug(candidate.name) === fallbackSector.slug) score += 4;
    if ((candidate.children?.length ?? 0) > 0) score += 2;

    return score;
}

function pickCanonicalSector(sectors, fallbackSector) {
    const fallbackTitle = String(fallbackSector.title ?? "").trim().toLowerCase();
    const candidates = sectors.filter((sector) => {
        const candidateSlug = sector.slug || toSlug(sector.name);
        const candidateName = String(sector.name ?? "").trim().toLowerCase();

        return (
            candidateSlug === fallbackSector.slug ||
            toSlug(sector.name) === fallbackSector.slug ||
            candidateName === fallbackTitle ||
            sector.parentSlug === fallbackSector.slug
        );
    });

    if (candidates.length === 0) {
        return null;
    }

    return [...candidates].sort((left, right) => {
        const scoreDelta =
            getCanonicalSectorMatchScore(right, fallbackSector) -
            getCanonicalSectorMatchScore(left, fallbackSector);

        if (scoreDelta !== 0) {
            return scoreDelta;
        }

        const childCountDelta = (right.children?.length ?? 0) - (left.children?.length ?? 0);
        if (childCountDelta !== 0) {
            return childCountDelta;
        }

        return String(left.id).localeCompare(String(right.id));
    })[0];
}

export function buildCanonicalSectors(sectors) {
    const topLevelSectors = sectors.filter((sector) => !sector.parentId);

    return FALLBACK_SECTORS.map((fallbackSector) => {
        const matchedSector =
            pickCanonicalSector(topLevelSectors, fallbackSector) ||
            pickCanonicalSector(sectors, fallbackSector);

        const children = matchedSector?.children?.length
            ? matchedSector.children
            : (fallbackSector.subSectors ?? []).map((name) => ({
                id: `fallback-${fallbackSector.slug}-${toSlug(name)}`,
                name,
            }));

        return {
            id: matchedSector?.id ?? fallbackSector.slug,
            name: fallbackSector.title,
            slug: fallbackSector.slug,
            children,
        };
    });
}

export const DEFAULT_PAPER_SECTORS = buildCanonicalSectors([]);

export async function fetchPaperSectors() {
    if (!STRAPI_URL) {
        return DEFAULT_PAPER_SECTORS;
    }

    try {
        const response = await fetch(
            `${STRAPI_URL}/api/sectors?sort[0]=name:asc&fields[0]=name&fields[1]=slug&populate[children][fields][0]=name&populate[children][fields][1]=slug&populate[children][sort][0]=name:asc&pagination[pageSize]=100`,
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error("Unable to load sectors.");
        }

        const payload = await response.json();
        const rawSectors = Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload)
                ? payload
                : [];

        const normalized = buildCanonicalSectors(
            rawSectors
                .map(normalizeSector)
                .filter((sector) => sector.id && sector.name)
        );

        return normalized.length ? normalized : DEFAULT_PAPER_SECTORS;
    } catch {
        return DEFAULT_PAPER_SECTORS;
    }
}
