"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    Check,
    CheckCircle2,
    ChevronDown,
    FileText,
    Loader2,
    Send,
} from "lucide-react";
import UploadZone from "@/components/paper-submission/UploadZone";
import { SECTORS as FALLBACK_SECTORS } from "@/data/dummy";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;
const PAPER_SUBMISSIONS_ENDPOINT = "/api/submit-paper";
const ABSTRACT_MIN_LENGTH = 100;

// TODO: Replace this mock with the authenticated ENERGClub member profile.
const currentUser = {
    name: "John Doe",
    email: "john@example.com",
};

function readStrapiAttributes(item) {
    return item?.attributes ?? item ?? {};
}

function normalizeId(value) {
    if (value === null || value === undefined) return "";
    return String(value);
}

function toSlug(value) {
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

function buildCanonicalSectors(sectors) {
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

const DEFAULT_SECTORS = buildCanonicalSectors([]);

function getErrorMessage(error) {
    if (error instanceof Error && error.message) {
        return error.message;
    }
    return "We couldn't submit your paper. Please review the form and try again.";
}

export default function SubmitPaperPage() {
    const [title, setTitle] = useState("");
    const [authorName, setAuthorName] = useState(currentUser.name);
    const [authorEmail, setAuthorEmail] = useState(currentUser.email);
    const [affiliation, setAffiliation] = useState("");
    const [selectedSectorIds, setSelectedSectorIds] = useState([]);
    const [selectedSubSectorIds, setSelectedSubSectorIds] = useState([]);
    const [isSectorDropdownOpen, setIsSectorDropdownOpen] = useState(false);
    const [abstract, setAbstract] = useState("");
    const [pdfFile, setPdfFile] = useState(null);
    const [uploadZoneKey, setUploadZoneKey] = useState(0);
    const [sectors, setSectors] = useState(DEFAULT_SECTORS);
    const [isLoadingSectors, setIsLoadingSectors] = useState(true);
    const [formError, setFormError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successTitle, setSuccessTitle] = useState("");
    const sectorDropdownRef = useRef(null);
    const cardStyle = {
        background: "var(--dash-card)",
        border: "1px solid var(--dash-border)",
    };
    const mutedCardStyle = {
        background: "var(--dash-surface-2)",
        border: "1px solid var(--dash-border-subtle)",
    };

    useEffect(() => {
        let ignore = false;

        const loadSectors = async () => {
            if (!STRAPI_URL) {
                if (!ignore) {
                    setSectors(DEFAULT_SECTORS);
                    setIsLoadingSectors(false);
                }
                return;
            }

            try {
                setIsLoadingSectors(true);

                const response = await fetch(
                    `${STRAPI_URL}/api/sectors?sort[0]=name:asc&fields[0]=name&fields[1]=slug&populate[children][fields][0]=name&populate[children][fields][1]=slug&populate[children][sort][0]=name:asc&pagination[pageSize]=100`
                );

                if (!response.ok) {
                    throw new Error("Unable to load sectors right now.");
                }

                const payload = await response.json();
                const rawSectors = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
                const normalizedSectors = buildCanonicalSectors(rawSectors
                    .map(normalizeSector)
                    .filter((sector) => sector.id && sector.name));

                if (!ignore) {
                    setSectors(normalizedSectors.length ? normalizedSectors : DEFAULT_SECTORS);
                }
            } catch {
                if (!ignore) {
                    setSectors(DEFAULT_SECTORS);
                }
            } finally {
                if (!ignore) {
                    setIsLoadingSectors(false);
                }
            }
        };

        loadSectors();

        return () => {
            ignore = true;
        };
    }, []);

    useEffect(() => {
        if (!isSectorDropdownOpen) {
            return undefined;
        }

        const handlePointerDown = (event) => {
            if (!sectorDropdownRef.current?.contains(event.target)) {
                setIsSectorDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handlePointerDown);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
        };
    }, [isSectorDropdownOpen]);

    const abstractLength = abstract.length;
    const isSectorSelectionDisabled = isSubmitting || (isLoadingSectors && sectors.length === 0);
    const selectedSectors = sectors.filter((sector) => selectedSectorIds.includes(normalizeId(sector.id)));
    const availableSubSectors = selectedSectors.flatMap((sector) =>
        sector.children.map((child) => ({
            id: normalizeId(child.id),
            name: child.name,
            sectorId: normalizeId(sector.id),
            sectorName: sector.name,
        }))
    );
    const selectedSubSectorNames = Array.from(new Set(
        selectedSectors.flatMap((sector) =>
            sector.children
                .filter((child) => selectedSubSectorIds.includes(normalizeId(child.id)))
                .map((child) => child.name)
        )
    ));

    const toggleSector = (sector) => {
        const sectorId = normalizeId(sector.id);
        const childIds = sector.children.map((child) => normalizeId(child.id));
        const isSelected = selectedSectorIds.includes(sectorId);

        setSelectedSectorIds((previous) =>
            isSelected
                ? previous.filter((item) => item !== sectorId)
                : [...previous, sectorId]
        );

        if (isSelected) {
            setSelectedSubSectorIds((previous) =>
                previous.filter((item) => !childIds.includes(item))
            );
        }
    };

    const toggleSubSector = (sector, child) => {
        const sectorId = normalizeId(sector.id);
        const childId = normalizeId(child.id);

        setSelectedSectorIds((previous) =>
            previous.includes(sectorId) ? previous : [...previous, sectorId]
        );

        setSelectedSubSectorIds((previous) =>
            previous.includes(childId)
                ? previous.filter((item) => item !== childId)
                : [...previous, childId]
        );
    };

    const resetForm = () => {
        setTitle("");
        setAuthorName(currentUser.name);
        setAuthorEmail(currentUser.email);
        setAffiliation("");
        setSelectedSectorIds([]);
        setSelectedSubSectorIds([]);
        setAbstract("");
        setPdfFile(null);
        setFormError("");
        setUploadZoneKey((value) => value + 1);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError("");

        const normalizedTitle = title.trim();
        const normalizedAuthorName = authorName.trim();
        const normalizedAuthorEmail = authorEmail.trim();
        const normalizedAffiliation = affiliation.trim();
        const normalizedAbstract = abstract.trim();

        if (!normalizedTitle) {
            setFormError("Paper title is required.");
            return;
        }

        if (!normalizedAuthorName) {
            setFormError("Author name is required.");
            return;
        }

        if (!normalizedAuthorEmail) {
            setFormError("Author email is required.");
            return;
        }

        if (normalizedAbstract.length < ABSTRACT_MIN_LENGTH) {
            setFormError(`Abstract must be at least ${ABSTRACT_MIN_LENGTH} characters.`);
            return;
        }

        if (!pdfFile) {
            setFormError("Please upload the paper file.");
            return;
        }

        setIsSubmitting(true);

        try {
            const taxonomyIds = Array.from(
                new Set(
                    [...selectedSectorIds, ...selectedSubSectorIds]
                        .map((value) => Number(value))
                        .filter((value) => Number.isFinite(value) && value > 0)
                )
            );

            const basePayload = {
                title: normalizedTitle,
                author_name: normalizedAuthorName,
                author_email: normalizedAuthorEmail,
                affiliation: normalizedAffiliation,
                abstract: normalizedAbstract,
                submitted_date: new Date().toISOString(),
                paper_status: "submitted",
            };

            const payloadAttempts = [
                {
                    ...basePayload,
                    sector: taxonomyIds.length > 1 ? taxonomyIds : taxonomyIds[0] ?? null,
                },
            ];

            if (taxonomyIds.length > 1) {
                payloadAttempts.push({
                    ...basePayload,
                    sector: taxonomyIds[0],
                });
            }

            let successfulResponse = null;
            let finalErrorMessage = "We couldn't submit your paper. Please try again.";

            for (const payload of payloadAttempts) {
                const formData = new FormData();
                formData.append("files.pdf", pdfFile);
                formData.append("data", JSON.stringify(payload));

                const response = await fetch(PAPER_SUBMISSIONS_ENDPOINT, {
                    method: "POST",
                    body: formData,
                });

                if (response.ok) {
                    successfulResponse = response;
                    break;
                }

                const responseText = await response.text();
                let message = finalErrorMessage;

                if (responseText) {
                    try {
                        const parsed = JSON.parse(responseText);
                        message = parsed?.error?.message || parsed?.message || message;
                    } catch {
                        message = responseText;
                    }
                }

                finalErrorMessage = message;
            }

            if (!successfulResponse) {
                throw new Error(finalErrorMessage);
            }

            setSuccessTitle(normalizedTitle);
            resetForm();
        } catch (error) {
            setFormError(getErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (successTitle) {
        return (
            <div className="animate-fade-in-up mx-auto max-w-4xl">
                <div
                    className="overflow-hidden rounded-xl"
                    style={cardStyle}
                >
                    <div className="p-8 sm:p-10">
                        <div
                            className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl"
                            style={{ background: "rgba(201,168,76,0.15)" }}
                        >
                            <CheckCircle2 className="h-7 w-7" style={{ color: "var(--dash-accent)" }} />
                        </div>

                        <h1 className="text-3xl font-bold" style={{ color: "var(--dash-text)" }}>
                            Paper submitted
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 sm:text-base" style={{ color: "var(--dash-text-muted)" }}>
                            <span className="font-semibold" style={{ color: "var(--dash-text)" }}>{successTitle}</span> has been sent to the
                            ENERGClub. You can submit another paper now or return to your dashboard.
                        </p>
                    </div>

                    <div
                        className="flex flex-col gap-3 px-8 py-5 sm:flex-row sm:px-10"
                        style={{ borderTop: "1px solid var(--dash-border)" }}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                setSuccessTitle("");
                                resetForm();
                            }}
                            className="inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-bold transition-all"
                            style={{ background: "var(--dash-accent)", color: "#0A0A0B" }}
                        >
                            Submit Another Paper
                        </button>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-bold transition-all hover:bg-white/5"
                            style={{ ...mutedCardStyle, color: "var(--dash-text-muted)" }}
                        >
                            Go to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up mx-auto max-w-4xl">
            <div className="mb-7">
                <div>
                    <Link
                        href="/dashboard"
                        className="mb-4 inline-flex items-center gap-2 text-sm transition-colors"
                        style={{ color: "var(--dash-text-dim)" }}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to dashboard
                    </Link>
                    <h1 className="text-3xl font-bold sm:text-4xl" style={{ color: "var(--dash-text)" }}>
                        Submit <span style={{ color: "var(--dash-accent)" }}>Paper</span>
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 sm:text-base" style={{ color: "var(--dash-text-dim)" }}>
                        Send strategic energy research to the ENERGClub editorial team for review. All submissions enter the
                        queue as <span className="font-medium" style={{ color: "var(--dash-text)" }}>submitted</span> and are timestamped automatically.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="rounded-xl overflow-hidden shadow-sm" style={cardStyle}>
                <div className="p-6 sm:p-7">
                    <div className="mb-7 flex items-start justify-between gap-4">
                        <div>
                            <div className="mb-3 flex items-center gap-3">
                                <div
                                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                                    style={{ background: "rgba(201,168,76,0.15)" }}
                                >
                                    <FileText size={18} style={{ color: "var(--dash-accent)" }} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold" style={{ color: "var(--dash-text)" }}>
                                        Paper Details
                                    </h2>
                                    <p className="text-sm" style={{ color: "var(--dash-text-dim)" }}>
                                        Complete the metadata and attach the paper file.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* <div className="mb-6 grid gap-3 md:grid-cols-3">
                        {[
                            "PDF, DOC, or DOCX up to 10 MB",
                            "Abstract must be at least 100 characters",
                            "Sector selection helps editorial routing",
                        ].map((item) => (
                            <div key={item} className="rounded-xl px-4 py-3 text-sm" style={{ ...mutedCardStyle, color: "var(--dash-text-muted)" }}>
                                {item}
                            </div>
                        ))}
                    </div> */}

                    <div className="grid gap-6">
                        <div className="grid gap-5 md:grid-cols-2">
                            <Field label="Paper Title" htmlFor="paper-title" required>
                                <input
                                    id="paper-title"
                                    type="text"
                                    value={title}
                                    onChange={(event) => setTitle(event.target.value)}
                                    placeholder="Enter the paper title"
                                    className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-all placeholder:text-[#6B6660] focus:border-[var(--dash-accent)]"
                                    style={{ background: "var(--dash-surface-2)", borderColor: "var(--dash-border-subtle)", color: "var(--dash-text)" }}
                                    disabled={isSubmitting}
                                    required
                                />
                            </Field>

                            <Field label="Affiliation" htmlFor="paper-affiliation">
                                <input
                                    id="paper-affiliation"
                                    type="text"
                                    value={affiliation}
                                    onChange={(event) => setAffiliation(event.target.value)}
                                    placeholder="Organisation or institution"
                                    className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-all placeholder:text-[#6B6660] focus:border-[var(--dash-accent)]"
                                    style={{ background: "var(--dash-surface-2)", borderColor: "var(--dash-border-subtle)", color: "var(--dash-text)" }}
                                    disabled={isSubmitting}
                                />
                            </Field>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                            <Field label="Author Name" htmlFor="author-name" required>
                                <input
                                    id="author-name"
                                    type="text"
                                    value={authorName}
                                    onChange={(event) => setAuthorName(event.target.value)}
                                    placeholder="Primary author name"
                                    className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-all placeholder:text-[#6B6660] focus:border-[var(--dash-accent)]"
                                    style={{ background: "var(--dash-surface-2)", borderColor: "var(--dash-border-subtle)", color: "var(--dash-text)" }}
                                    disabled={isSubmitting}
                                    required
                                />
                                {/* TODO: Hydrate this field from the authenticated user instead of the mock currentUser object. */}
                            </Field>

                            <Field label="Author Email" htmlFor="author-email" required>
                                <input
                                    id="author-email"
                                    type="email"
                                    value={authorEmail}
                                    onChange={(event) => setAuthorEmail(event.target.value)}
                                    placeholder="author@company.com"
                                    className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-all placeholder:text-[#6B6660] focus:border-[var(--dash-accent)]"
                                    style={{ background: "var(--dash-surface-2)", borderColor: "var(--dash-border-subtle)", color: "var(--dash-text)" }}
                                    disabled={isSubmitting}
                                    required
                                />
                                {/* TODO: Hydrate this field from the authenticated user instead of the mock currentUser object. */}
                            </Field>
                        </div>

                        <Field label="Sectors" htmlFor="paper-sector-groups">
                            <div id="paper-sector-groups" className="space-y-3">
                                <div
                                    className="rounded-xl px-4 py-3 text-sm"
                                    style={{ ...mutedCardStyle, color: "var(--dash-text-muted)" }}
                                >
                                    {selectedSectorIds.length > 0
                                        ? `${selectedSectorIds.length} sector${selectedSectorIds.length > 1 ? "s" : ""} selected`
                                        : "Select one or more sectors from the left, then pick sub-sectors from the right."}
                                    {selectedSubSectorNames.length > 0 ? ` ${selectedSubSectorNames.length} sub-sector${selectedSubSectorNames.length > 1 ? "s" : ""} selected.` : ""}
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div ref={sectorDropdownRef} className="relative">
                                        <div className="overflow-hidden rounded-xl" style={mutedCardStyle}>
                                            <button
                                                type="button"
                                                onClick={() => setIsSectorDropdownOpen((previous) => !previous)}
                                                disabled={isSectorSelectionDisabled}
                                                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                <div>
                                                    <div
                                                        className="text-[11px] font-bold uppercase tracking-wider"
                                                        style={{ color: "var(--dash-text-dim)" }}
                                                    >
                                                        Sector
                                                    </div>
                                                    <div className="mt-1 text-sm font-medium" style={{ color: "var(--dash-text)" }}>
                                                        {selectedSectorIds.length > 0
                                                            ? `${selectedSectorIds.length} sector${selectedSectorIds.length > 1 ? "s" : ""} selected`
                                                            : "Select sector"}
                                                    </div>
                                                </div>
                                                <ChevronDown
                                                    className={`h-4 w-4 transition-transform ${isSectorDropdownOpen ? "rotate-180" : ""}`}
                                                    style={{ color: "var(--dash-text-dim)" }}
                                                />
                                            </button>

                                            {isSectorDropdownOpen ? (
                                                <div
                                                    className=""
                                                    style={{ borderTop: "1px solid var(--dash-border-subtle)" }}
                                                >
                                                    {sectors.map((sector) => {
                                                        const sectorId = normalizeId(sector.id);
                                                        const isSelected = selectedSectorIds.includes(sectorId);

                                                        return (
                                                            <button
                                                                key={sectorId}
                                                                type="button"
                                                                onClick={() => toggleSector(sector)}
                                                                disabled={isSectorSelectionDisabled}
                                                                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60"
                                                                style={{
                                                                    background: isSelected ? "rgba(201,168,76,0.14)" : "transparent",
                                                                    borderBottom: "1px solid var(--dash-border-subtle)",
                                                                }}
                                                            >
                                                                <span
                                                                    className="flex h-5 w-5 items-center justify-center rounded border"
                                                                    style={{
                                                                        background: isSelected ? "var(--dash-accent)" : "transparent",
                                                                        borderColor: isSelected ? "var(--dash-accent)" : "var(--dash-border-subtle)",
                                                                        color: isSelected ? "#0A0A0B" : "transparent",
                                                                    }}
                                                                >
                                                                    <Check className="h-3.5 w-3.5" />
                                                                </span>
                                                                <span className="text-sm font-medium" style={{ color: "var(--dash-text)" }}>
                                                                    {sector.name}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div
                                        className="overflow-hidden rounded-xl"
                                        style={{
                                            ...mutedCardStyle,
                                            opacity: selectedSectors.length === 0 ? 0.65 : 1,
                                        }}
                                    >
                                        <div
                                            className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider"
                                            style={{ color: "var(--dash-text-dim)", borderBottom: "1px solid var(--dash-border-subtle)" }}
                                        >
                                            Sub-Sector
                                        </div>
                                        <div className="max-h-80 overflow-y-auto px-4 py-4">
                                            {selectedSectors.length === 0 ? (
                                                <div
                                                    className="rounded-lg px-4 py-5 text-sm"
                                                    style={{ background: "var(--dash-surface)", color: "var(--dash-text-dim)" }}
                                                >
                                                    Select a sector first to enable sub-sector selection.
                                                </div>
                                            ) : availableSubSectors.length === 0 ? (
                                                <div
                                                    className="rounded-lg px-4 py-5 text-sm"
                                                    style={{ background: "var(--dash-surface)", color: "var(--dash-text-dim)" }}
                                                >
                                                    No sub-sectors available for the selected sector.
                                                </div>
                                            ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    {availableSubSectors.map((subSector) => {
                                                        const isChildSelected = selectedSubSectorIds.includes(subSector.id);
                                                        const parentSector = selectedSectors.find((sector) => normalizeId(sector.id) === subSector.sectorId);
                                                        const child = parentSector?.children.find((item) => normalizeId(item.id) === subSector.id);

                                                        if (!parentSector || !child) {
                                                            return null;
                                                        }

                                                        return (
                                                            <button
                                                                key={`${subSector.sectorId}-${subSector.id}`}
                                                                type="button"
                                                                onClick={() => toggleSubSector(parentSector, child)}
                                                                disabled={isSectorSelectionDisabled}
                                                                className="rounded-full border px-3 py-1.5 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60"
                                                                style={{
                                                                    background: isChildSelected ? "var(--dash-accent)" : "var(--dash-surface)",
                                                                    borderColor: isChildSelected ? "var(--dash-accent)" : "var(--dash-border-subtle)",
                                                                    color: isChildSelected ? "#0A0A0B" : "var(--dash-text-muted)",
                                                                }}
                                                            >
                                                                {subSector.name}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p className="mt-2 text-sm" style={{ color: "var(--dash-text-dim)" }}>
                                Select one or more sectors first. Sub-sectors become available in the adjacent panel once a sector is chosen.
                            </p>
                        </Field>

                        <Field
                            label="Abstract"
                            htmlFor="paper-abstract"
                            required
                            aside={
                                <span
                                    className="text-xs font-medium"
                                    style={{ color: abstractLength >= ABSTRACT_MIN_LENGTH ? "var(--dash-text-dim)" : "var(--dash-accent)" }}
                                >
                                    {abstractLength} / {ABSTRACT_MIN_LENGTH} minimum
                                </span>
                            }
                        >
                            <textarea
                                id="paper-abstract"
                                value={abstract}
                                onChange={(event) => setAbstract(event.target.value)}
                                placeholder="Summarise the core argument, methods, and key findings."
                                rows={8}
                                className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition-all placeholder:text-[#6B6660] focus:border-[var(--dash-accent)]"
                                style={{ background: "var(--dash-surface-2)", borderColor: "var(--dash-border-subtle)", color: "var(--dash-text)" }}
                                disabled={isSubmitting}
                                required
                                minLength={ABSTRACT_MIN_LENGTH}
                            />
                            <p className="mt-2 text-sm" style={{ color: "var(--dash-text-dim)" }}>
                                A concise abstract helps the review team assess relevance quickly.
                            </p>
                        </Field>

                        <UploadZone
                            key={uploadZoneKey}
                            file={pdfFile}
                            onFileSelect={setPdfFile}
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                <div className="px-6 py-5 sm:px-7" style={{ borderTop: "1px solid var(--dash-border)" }}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm" style={{ color: "var(--dash-text-dim)" }}>
                            Your paper will be timestamped and submitted directly to the review workflow.
                        </p>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                            style={{ background: "var(--dash-accent)", color: "#0A0A0B" }}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Submitting paper...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Submit Paper
                                </>
                            )}
                        </button>
                    </div>

                    {formError ? (
                        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{formError}</span>
                        </div>
                    ) : null}
                </div>
            </form>
        </div>
    );
}

function Field({ label, htmlFor, required = false, aside = null, children }) {
    return (
        <div>
            <div className="mb-2 flex items-center justify-between gap-3">
                <label
                    htmlFor={htmlFor}
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: "var(--dash-text-dim)" }}
                >
                    {label}
                    {required ? <span className="ml-1" style={{ color: "var(--dash-accent)" }}>*</span> : null}
                </label>
                {aside}
            </div>
            {children}
        </div>
    );
}
