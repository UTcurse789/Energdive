import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import DarkVeil from "@/components/DarkVeil";

export const metadata: Metadata = {
  title: "EnergJob | Energy Careers, Hiring and Talent Platform",
  description:
    "EnergJob is ENERGDIVE's careers and hiring page for India's energy, power, oil and gas, renewables, and climate workforce.",
  alternates: {
    canonical: "https://www.energdive.com/energjob",
  },
  openGraph: {
    title: "EnergJob | Energy Careers and Hiring",
    description:
      "Discover the first layer of EnergJob - a focused jobs and hiring destination for India's energy ecosystem.",
    url: "https://www.energdive.com/energjob",
    type: "website",
  },
};

export default async function EnergJobPage() {
  const { userId } = await auth();
  const hireTalentHref = userId
    ? "/contact"
    : `/auth?redirect_url=${encodeURIComponent("/contact")}`;

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-[#111111]">
      <div className="pointer-events-none absolute inset-0">
        <DarkVeil
          hueShift={0}
          noiseIntensity={0}
          scanlineIntensity={0}
          speed={0.45}
          scanlineFrequency={0}
          warpAmount={0.08}
          waveColor="#09B697"
        />
      </div>

      <section className="relative mx-auto flex min-h-[calc(100vh-140px)] w-full max-w-[1440px] items-center px-6 py-14 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="mt-5 font-sans text-4xl font-black leading-[0.94] tracking-[-0.06em] text-[#142020] sm:text-5xl lg:text-7xl">
            Where energy innovation and talent connect
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-black/62 sm:text-base">
            A focused ecosystem built for the future of energy, connecting ambitious
            companies, industry leaders, analysts, operators, and next-generation talent
            driving the transition forward.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={hireTalentHref}
              className="inline-flex min-w-[220px] items-center justify-center rounded-[18px] bg-[#143f52] px-8 py-4 text-base font-bold text-white transition-colors hover:bg-[#0d3140]"
            >
              Hire a Talent?
            </Link>
            <Link
              href="/energjob/jobs"
              className="inline-flex min-w-[220px] items-center justify-center rounded-[18px] border border-black/12 bg-white px-8 py-4 text-base font-bold text-[#1a1a1a] transition-colors hover:border-[#09B697]/35 hover:text-[#09B697]"
            >
              Find your next job
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
