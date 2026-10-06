import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

interface ThePublicationSectionProps {
  coverImage?: string | null;
  issueSlug?: string | null;
}

export function ThePublicationSection({
  coverImage,
  issueSlug,
}: ThePublicationSectionProps) {
  const issuesLink = issueSlug ? `/issues/${issueSlug}` : "/issues";
  const finalCoverImage = coverImage || "/current-magazine.jpg";

  return (
    <section className="bg-white py-10 lg:py-12 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Heading */}
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-zinc-900 font-serif">
            The Publication
          </h2>
          <div className="mt-2 h-1 w-12 bg-emerald-600" />
        </div>

        {/* Dark Publication Feature Card */}
        <div className="relative overflow-hidden bg-zinc-900 rounded-2xl p-6 sm:p-10 lg:p-12 text-white shadow-xl border border-zinc-800">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-4">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight font-serif">
                The Definitive Voice of India’s Energy Transition.
              </h3>
              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-sans">
                ENERGDIVE stands as India’s most premium energy leadership publication, blending the depth of a knowledge journal with the design sophistication of a global business review. Published by ClariSector Technologies Pvt. Ltd., a group company of ENCIS and ITEN Media, the magazine carries the intellectual and institutional credibility of India’s foremost voices in energy and sustainability.
              </p>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
                Positioned at the intersection of policy, enterprise, and innovation, ENERGDIVE chronicles India’s decisive decade of transformation—spotlighting reforms, investments, and breakthroughs across key energy sectors.
              </p>
            </div>

            {/* Right Magazine Cover */}
            <div className="flex flex-col items-center lg:items-end justify-center">
              <Link href={issuesLink} className="group block text-center lg:text-right">
                <div className="relative aspect-[3/4] w-[180px] sm:w-[200px] overflow-hidden rounded-md border border-white/20 bg-zinc-800 shadow-2xl transition-transform duration-300 group-hover:scale-105">
                  <Image
                    src={finalCoverImage}
                    alt="ENERGDIVE current issue cover"
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                </div>
                <span className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-500 hover:text-emerald-400 transition-colors">
                  View Issues
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
