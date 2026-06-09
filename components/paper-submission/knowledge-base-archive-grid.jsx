"use client";

import { useMemo, useState } from "react";
import { Building2, CalendarDays, Filter, UserRound } from "lucide-react";
import { formatSubmissionDate, truncateText } from "@/lib/paper-submissions";
import Link from "next/link";

export default function KnowledgeBaseArchiveGrid({ papers }) {
    const [selectedSector, setSelectedSector] = useState("all");
    const [selectedSubSector, setSelectedSubSector] = useState("all");
    const [selectedAffiliation, setSelectedAffiliation] = useState("all");

    const sectorOptions = useMemo(
        () => Array.from(new Set(
            papers.flatMap((paper) => paper.sectorNames || []).filter(Boolean)
        )).sort((left, right) => left.localeCompare(right)),
        [papers]
    );

    const subSectorOptions = useMemo(() => {
        const visibleSubSectors = papers.flatMap((paper) =>
            (paper.subSectors || []).filter((subSector) =>
                selectedSector === "all" || subSector.parentName === selectedSector
            )
        );

        return Array.from(
            new Set(visibleSubSectors.map((subSector) => subSector.name).filter(Boolean))
        ).sort((left, right) => left.localeCompare(right));
    }, [papers, selectedSector]);

    const affiliationOptions = useMemo(
        () => Array.from(new Set(
            papers
                .map((paper) => paper.affiliation?.trim())
                .filter(Boolean)
        )).sort((left, right) => left.localeCompare(right)),
        [papers]
    );

    const activeSubSector = subSectorOptions.includes(selectedSubSector) ? selectedSubSector : "all";

    const filteredPapers = useMemo(
        () => papers.filter((paper) => {
            const matchesSector =
                selectedSector === "all" ||
                (paper.sectorNames || []).includes(selectedSector);

            const matchesSubSector =
                activeSubSector === "all" ||
                (paper.subSectorNames || []).includes(activeSubSector);

            const matchesAffiliation =
                selectedAffiliation === "all" ||
                paper.affiliation?.trim() === selectedAffiliation;

            return matchesSector && matchesSubSector && matchesAffiliation;
        }),
        [activeSubSector, papers, selectedAffiliation, selectedSector]
    );

    return (
        <div className="mt-1">
            <div className="rounded-[26px] border border-slate-200/90 bg-white/92 px-4 py-3 shadow-[0_16px_34px_rgba(15,23,42,0.05)] backdrop-blur sm:px-5 sm:py-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                    <div className="flex items-center gap-3 xl:w-[190px] xl:flex-none">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                            <Filter className="h-4 w-4" />
                        </div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                            Filter Papers
                        </p>
                    </div>

                    <div className="grid flex-1 gap-3 md:grid-cols-2 xl:min-w-0 xl:grid-cols-3">
                        <FilterSelect
                            compact
                            label="Sector"
                            value={selectedSector}
                            onChange={(value) => {
                                setSelectedSector(value);
                                setSelectedSubSector("all");
                            }}
                            options={sectorOptions}
                            placeholder="All sectors"
                        />
                        <FilterSelect
                            compact
                            label="Sub-sector"
                            value={activeSubSector}
                            onChange={setSelectedSubSector}
                            options={subSectorOptions}
                            placeholder="All sub-sectors"
                        />
                        <FilterSelect
                            compact
                            label="University / Institution"
                            value={selectedAffiliation}
                            onChange={setSelectedAffiliation}
                            options={affiliationOptions}
                            placeholder="All institutions"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setSelectedSector("all");
                            setSelectedSubSector("all");
                            setSelectedAffiliation("all");
                        }}
                        className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-white xl:flex-none"
                    >
                        Reset Filters
                    </button>
                </div>
            </div>

            {filteredPapers.length === 0 ? (
                <div className="mt-6 rounded-[30px] border border-slate-200/90 bg-white/95 px-6 py-10 text-center shadow-[0_18px_38px_rgba(15,23,42,0.06)]">
                    <p className="text-lg font-semibold text-slate-900">
                        No approved papers match these filters.
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-500">
                        Try another sector, sub-sector, or institution to explore the archive.
                    </p>
                </div>
            ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredPapers.map((paper) => (
                        <article
                            key={paper.id}
                            className="flex h-full flex-col rounded-[30px] border border-slate-200/90 bg-white/96 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_54px_rgba(15,23,42,0.09)] sm:p-6"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <span className="inline-flex items-center rounded-full border border-emerald-900/10 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
                                    {paper.primarySector}
                                </span>
                                <span className="text-xs font-medium text-slate-500">
                                    {formatSubmissionDate(paper.submittedDate)}
                                </span>
                            </div>

                            <h3 className="mt-5 break-words text-3xl font-bold leading-tight text-slate-950">
                                {truncateText(paper.title || "Untitled paper", 50)}
                            </h3>

                            <p className="mt-4 flex-1 break-words text-sm leading-7 text-slate-600">
                                {truncateText(paper.abstract, 173) || "Abstract not available."}
                            </p>

                            <div className="mt-5 grid grid-cols-3 gap-4 border-t border-slate-200/80 pt-4">
                                <MetaRow icon={UserRound} label="Author" value={paper.authorName || "Not provided"} />
                                <MetaRow icon={Building2} label="University / Institution" value={paper.affiliation || "Not provided"} />
                                <MetaRow
                                    icon={CalendarDays}
                                    label="Date"
                                    value={formatSubmissionDate(paper.submittedDate)}
                                />
                            </div>

                            <div className="mt-6 pt-5 border-t border-slate-200/80">
                                <Link
                                    href={`/knowledge-base/abstract/${slugify(paper.title || "untitled-paper")}`}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-50 text-emerald-800 px-5 py-3 text-sm font-semibold transition-all hover:bg-emerald-100"
                                >
                                    Read more
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}

function slugify(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function FilterSelect({ label, value, onChange, options, placeholder, compact = false }) {
    return (
        <label className="block">
            <span className={compact ? "sr-only" : "mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500"}>
                {label}
            </span>
            <select
                aria-label={label}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className={`w-full rounded-2xl border border-slate-200 bg-[#faf8f2] px-4 text-sm font-medium text-slate-800 outline-none transition-colors focus:border-emerald-700 ${
                    compact ? "h-11 py-2.5" : "py-3"
                }`}
            >
                <option value="all">{placeholder}</option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </label>
    );
}

function MetaRow({ icon: Icon, label, value }) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                <Icon className="h-3 w-3 text-emerald-700" />
                {label === "University / Institution" ? "University" : label}
            </div>
            <p className="text-sm font-medium text-slate-900 line-clamp-1">
                {value}
            </p>
        </div>
    );
}
