import Link from "next/link";
import { Briefcase, MapPin, ArrowRight, Building2, ChevronRight } from "lucide-react";
import { loadPublicEnergJobs } from "@/lib/energjob-public";

export async function EnergyJobsSidebar() {
  let jobs: Awaited<ReturnType<typeof loadPublicEnergJobs>> = [];
  try {
    jobs = await loadPublicEnergJobs();
  } catch {
    jobs = [];
  }

  const latest = jobs.slice(0, 3);

  return (
    <div className="bg-white border border-slate-200/90 rounded-md shadow-xs overflow-hidden">
      {/* Header */}
      <div className="bg-zinc-950 px-4 py-3 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
            <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.16em] text-white">
            ENERGY<span className="text-emerald-400">JOBS</span>
          </span>
        </div>
        <Link
          href="/energyjobs"
          className="group inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          View All
          <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Job Listings */}
      <div className="divide-y divide-slate-100">
        {latest.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-slate-400">
            No active openings at the moment
          </div>
        ) : (
          latest.map((job) => (
            <Link
              key={job.routeSlug}
              href={`/energyjobs/${job.routeSlug}`}
              className="block px-4 py-3.5 hover:bg-slate-50/80 transition-colors group"
            >
              <h4 className="text-xs font-bold text-slate-900 leading-snug group-hover:text-emerald-600 transition-colors line-clamp-2">
                {job.title}
              </h4>
              
              <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                {job.companyName && (
                  <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                    <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                    {job.companyName}
                  </span>
                )}
                {job.location && (
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    {job.location}
                  </span>
                )}
              </div>

              {job.jobType && (
                <div className="mt-2">
                  <span className="inline-block text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                    {job.jobType}
                  </span>
                </div>
              )}
            </Link>
          ))
        )}
      </div>

      {/* Footer CTA */}
      <div className="p-3 bg-slate-50/50 border-t border-slate-100">
        <Link
          href="/energyjobs"
          className="group flex items-center justify-center gap-2 w-full py-2.5 bg-zinc-950 hover:bg-emerald-600 text-white text-[11px] font-black uppercase tracking-[0.14em] transition-all rounded shadow-xs"
        >
          Browse All Openings
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}

