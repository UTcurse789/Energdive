"use client";

import Link from "next/link";
import Image from "next/image";
import { Issue } from "@/types";
import { Calendar, Download } from "lucide-react";

interface IssueCardProps {
    issue: Issue;
}

export function IssueCard({ issue }: IssueCardProps) {
    return (
        <div className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-teal-500 transition-all duration-300 flex flex-col h-full shadow-xs hover:shadow-md">
            <Link href={`/issues/${issue.slug}`} className="block aspect-3/4 overflow-hidden relative">
                <Image
                    src={issue.coverImage}
                    alt={issue.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>

            <div className="p-5 grow flex flex-col">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{issue.date}</span>
                </div>

                <Link href={`/issues/${issue.slug}`}>
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-teal-600 transition-colors line-clamp-2 font-serif">
                        {issue.title}
                    </h3>
                </Link>

                <p className="text-slate-600 text-sm line-clamp-3 mb-4 leading-relaxed">
                    {issue.description}
                </p>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                    <Link
                        href={`/issues/${issue.slug}`}
                        className="text-teal-600 text-sm font-bold hover:text-teal-700 transition-colors flex items-center gap-1"
                    >
                        Read Now
                    </Link>

                    {/* {issue.pdfUrl && (
                        <a
                            href={issue.pdfUrl}
                            className="p-2 bg-slate-50 hover:bg-teal-50 text-slate-400 hover:text-teal-600 rounded-full transition-colors group/btn border border-slate-200 hover:border-teal-200"
                            title="Download PDF"
                        >
                            <Download className="w-4 h-4" />
                        </a>
                    )} */}
                </div>
            </div>
        </div>
    );
}
