import Image from "next/image";
import Link from "next/link";
import {
    ArrowUpRight,
    BarChart3,
    FileText,
    Flame,
    Globe,
    Layers,
    Lightbulb,
    Map,
    PenTool,
    Wind,
    Zap,
    type LucideIcon,
} from "lucide-react";

const brandGreen = "#00A859";

type FeatureHighlight = {
    title: string;
    desc: string;
    Icon: LucideIcon;
};

type Sector = {
    title: string;
    Icon: LucideIcon;
};

type EditorialProfile = {
    initials: string;
    name: string;
    href: string;
    role: string;
    bio: string;
    image?: string; // Added optional image field
};

const sectors: Sector[] = [
    { title: "Oil & Gas", Icon: Flame },
    { title: "Power & Utilities", Icon: Zap },
    { title: "Renewables", Icon: Wind },
    { title: "Climate Action", Icon: Globe },
];

const featureHighlights: FeatureHighlight[] = [
    {
        title: "Leadership Perspectives",
        desc: "Vision statements and forewords from global leaders.",
        Icon: PenTool,
    },
    {
        title: "Cover Features",
        desc: "Deep-dive narratives on transformation and impact.",
        Icon: Layers,
    },
    {
        title: "Strategic Essays",
        desc: "Columns from policymakers, CMDs, and CEOs.",
        Icon: FileText,
    },
    {
        title: "Innovation & Research",
        desc: "Stories from the frontier of technology and R&D.",
        Icon: Lightbulb,
    },
    {
        title: "State Spotlights",
        desc: "Ground-level data on reform implementation.",
        Icon: Map,
    },
    {
        title: "Visual Intelligence",
        desc: "Infographics that decode complexity into clarity.",
        Icon: BarChart3,
    },
];

const editorialProfiles: EditorialProfile[] = [
    {
        initials: "AB",
        name: "Abhishek Bhatnagar",
        href: "https://energdive.com/author/abhishek-bhatnagar",
        role: "EDITOR-IN-CHIEF",
        image: "/abhishek-bhatnagar.jpg", // Update path as per public folder
        bio: "Abhishek's nearly twenty-five-year journey is defined by a commitment to building institutions, ideas, and ecosystems that strengthen India's energy transition, sustainability agenda, and long-term development priorities. An engineer with a strategist's clarity and an entrepreneur's instinct, he has founded and shaped platforms that sit at the intersection of policy, industry, innovation, and public purpose — enabling leaders to transform insight into influence, and influence into impact.",
    },
    {
        initials: "MB",
        name: "Mrinmoy Bhattacharjee",
        href: "https://energdive.com/author/mrinmoy-bhattacharjee",
        role: "SENIOR EDITOR",
        image: "/mrinmoy-bhattacharjee.jpg", // Update path as per public folder
        bio: "Mrinmoy Bhattacharjee is Senior Editor at ENERGDIVE with over 16 years of experience in energy-business journalism across print and digital media. His work covers oil and gas, power and utilities, new energies, energy efficiency, sustainability, and climate change. He has produced research-driven reporting and analysis for industry and institutional audiences. He holds a master's degree in Communication Studies from the University of Pune.",
    },
];

/* Mercom-Style Heading */
function SectionHeading({ title }: { title: string }) {
    return (
        <div className="mb-6">
            <h2 className="text-xl font-extrabold uppercase tracking-wide text-zinc-900 sm:text-2xl">
                {title}
            </h2>
            <div className="mt-2 h-1 w-12" style={{ backgroundColor: brandGreen }} />
        </div>
    );
}

/* Section Container */
function SectionBand({
    children,
    background = "white",
}: {
    children: React.ReactNode;
    background?: "white" | "gray";
}) {
    return (
        <section className={background === "gray" ? "bg-[#F4F5F7]" : "bg-white"}>
            <div className="mx-auto max-w-[1140px] px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
                {children}
            </div>
        </section>
    );
}

/* Editorial Card with Author Image Support */
function EditorialProfileCard({ profile }: { profile: EditorialProfile }) {
    return (
        <article className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
            {/* Author Avatar / Image */}
            <Link
                href={profile.href}
                className="group relative flex h-28 w-28 shrink-0 overflow-hidden bg-zinc-900 transition-opacity hover:opacity-90"
                aria-label={`Read ${profile.name}'s author profile`}
            >
                {profile.image ? (
                    <Image
                        src={profile.image}
                        alt={profile.name}
                        fill
                        sizes="112px"
                        className="object-cover object-center grayscale transition-all duration-300 group-hover:grayscale-0"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-white">
                        <span className="text-2xl font-black">{profile.initials}</span>
                    </div>
                )}
            </Link>

            {/* Profile Content */}
            <div className="space-y-1.5">
                <Link href={profile.href} className="group inline-flex items-center gap-1.5">
                    <h3 className="text-lg font-bold text-zinc-900 transition-colors group-hover:text-[#00A859]">
                        {profile.name}
                    </h3>
                    <ArrowUpRight className="h-4 w-4 text-zinc-400 group-hover:text-[#00A859]" />
                </Link>

                <p className="text-xs font-bold uppercase tracking-wider text-[#00A859]">
                    {profile.role}
                </p>

                <p className="pt-1 text-sm leading-relaxed text-zinc-700">
                    {profile.bio}
                </p>
            </div>
        </article>
    );
}

export default function AboutPage() {
    return (
        <div className="bg-white font-sans text-zinc-800 antialiased selection:bg-[#00A859]/20">
            {/* 1. HERO SECTION */}
            <section className="relative isolate min-h-[320px] overflow-hidden bg-zinc-900 sm:min-h-[380px]">
                <Image
                    src="/the club.jpg"
                    alt="Energy leaders with industrial, wind, and solar infrastructure"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover opacity-40"
                />
                <div className="relative z-10 mx-auto flex min-h-[320px] max-w-[1140px] items-center justify-center px-4 text-center sm:min-h-[380px]">
                    <h1 className="max-w-4xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
                        The definitive voice of India&apos;s energy transformation.
                    </h1>
                </div>
            </section>

            {/* 2. FOREWORD */}
            <SectionBand background="white">
                <SectionHeading title="About Energdive" />
                <div className="space-y-4 text-sm leading-relaxed text-zinc-700 sm:text-base sm:leading-7">
                    <p className="text-base font-semibold text-zinc-900 sm:text-lg">
                        India is entering a defining decade—one that will shape not only its energy security but also its global influence in the age of sustainability.
                    </p>
                    <p>
                        Over the past ten years, bold policy reforms, resilient public sector leadership, and a surge in private innovation have transformed India into one of the world’s most dynamic and diversified energy markets.
                    </p>
                    <p>
                        Yet, as the nation accelerates toward its <strong className="font-semibold text-zinc-950">net-zero</strong> goals and the vision of <strong className="font-semibold text-zinc-950">Viksit Bharat 2047</strong>, the challenge has evolved—from access to advancement, from growth to green leadership.
                    </p>

                    <div className="mt-6 border-l-4 p-4 text-sm font-semibold italic text-zinc-900 bg-[#F4F5F7]" style={{ borderColor: brandGreen }}>
                        ENERGDIVE emerges at this pivotal juncture as the definitive voice of India’s energy transformation—documenting not just the journey, but the leadership and ideas shaping it.
                    </div>
                </div>
            </SectionBand>

            {/* 3. STRATEGIC INTELLIGENCE PLATFORM */}
            <SectionBand background="gray">
                <SectionHeading title="A Strategic Intelligence Platform for India’s Energy Future" />
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
                    <div className="space-y-4 text-sm leading-relaxed text-zinc-700 lg:col-span-7 sm:text-base sm:leading-7">
                        <p>
                            India’s energy transition is not a single narrative—it is a convergence of technologies, markets, and policies that must evolve in harmony. The pace and scale of this transformation demand more than coverage; they demand strategic intelligence.
                        </p>
                        <p>
                            <strong className="font-bold text-[#00A859]">ENERGDIVE</strong> is designed to fill this critical void. Conceived as India’s foremost Strategic Intelligence Platform, it will unify diverse stakeholders—ministries, PSUs, industry leaders, investors, and global institutions—on one credible and data-driven platform.
                        </p>
                        <p>
                            Its mission is to transform information into intelligence, insight into influence, and influence into impact. By curating high-quality thought leadership and evidence-based dialogue, ENERGDIVE will empower decision-makers to translate ambition into action.
                        </p>
                    </div>

                    <div className="border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-5">
                        <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-500">
                            Coverage Priorities
                        </h3>
                        <div className="grid grid-cols-2 gap-2.5">
                            {sectors.map(({ title, Icon }) => (
                                <div key={title} className="flex items-center gap-3 border border-zinc-100 bg-[#F4F5F7] p-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#00A859]/10 text-[#00A859]">
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-bold uppercase text-zinc-900">
                                        {title}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <p className="mt-5 border-t border-zinc-100 pt-4 text-xs font-semibold text-[#00A859]">
                            Anchored in India’s national vision for sustainable and inclusive growth.
                        </p>
                    </div>
                </div>
            </SectionBand>

            {/* 4. THE PUBLICATION */}
            <SectionBand background="white">
                <SectionHeading title="The Publication" />
                <div className="grid grid-cols-1 gap-6 bg-zinc-900 p-6 text-white sm:p-8 lg:grid-cols-[1fr_220px] lg:items-center">
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold text-white sm:text-3xl">
                            The Definitive Voice of India’s Energy Transition.
                        </h3>
                        <p className="text-sm leading-relaxed text-zinc-300">
                            ENERGDIVE stands as India’s most premium energy leadership publication, blending the depth of a knowledge journal with the design sophistication of a global business review. Published by ClariSector Technologies Pvt. Ltd., a group company of ENCIS and ITEN Media, the magazine carries the intellectual and institutional credibility of India’s foremost voices in energy and sustainability.
                        </p>
                        <p className="text-sm leading-relaxed text-zinc-400">
                            Positioned at the intersection of policy, enterprise, and innovation, ENERGDIVE chronicles India’s decisive decade of transformation—spotlighting reforms, investments, and breakthroughs across key energy sectors.
                        </p>
                    </div>

                    <Link href="/issues" className="group block justify-self-center lg:justify-self-end">
                        <div className="relative aspect-[3/4] w-[180px] border border-white/20 bg-zinc-800 shadow-md">
                            <Image
                                src="/current-magazine.jpg"
                                alt="ENERGDIVE current issue cover"
                                fill
                                sizes="180px"
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                        </div>
                        <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#00A859]">
                            View Issues
                            <ArrowUpRight className="h-3.5 w-3.5" />
                        </span>
                    </Link>
                </div>

                <div className="mt-12">
                    <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Editorial Architecture & Highlights
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {featureHighlights.map(({ title, desc, Icon }) => (
                            <div key={title} className="flex items-start gap-3.5 border border-zinc-200 bg-white p-4">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#00A859]/10 text-[#00A859]">
                                    <Icon className="h-4 w-4" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-zinc-900">
                                        {title}
                                    </h4>
                                    <p className="mt-1 text-xs leading-relaxed text-zinc-600">
                                        {desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </SectionBand>

            {/* 5. EDITORIAL TEAM */}
            <SectionBand background="gray">
                <SectionHeading title="Editorial Team" />
                <p className="mb-8 text-sm text-zinc-600 sm:text-base">
                    ENERGDIVE&apos;s reporting and analysis is guided by an editorial team with deep, combined experience across energy-business journalism, policy, and industry strategy.
                </p>

                <div className="space-y-8">
                    {editorialProfiles.map((profile) => (
                        <EditorialProfileCard key={profile.name} profile={profile} />
                    ))}
                </div>
            </SectionBand>

            {/* 6. CORRECTIONS & EDITORIAL POLICY */}
            <SectionBand background="white">
                <SectionHeading title="Corrections & Editorial Policy" />
                <div className="grid grid-cols-1 gap-6 text-sm leading-relaxed text-zinc-700 md:grid-cols-2 sm:text-base sm:leading-7">
                    <p>
                        ENERGDIVE is committed to accuracy, fairness, and editorial integrity in all its reporting. If you believe a factual error appears in any of our published content, please write to us at{" "}
                        <a href="mailto:info@energdive.com" className="font-bold text-[#00A859] underline underline-offset-4 transition-colors hover:text-emerald-700">
                            info@energdive.com
                        </a>{" "}
                        with details, and our editorial team will review and correct it promptly. Significant corrections will be noted transparently on the relevant article.
                    </p>
                    <p>
                        Editorial decisions at ENERGDIVE are made independently of advertising, sponsorship, and commercial partnerships. Our news and analysis reflect the independent judgment of our editorial team.
                    </p>
                </div>
            </SectionBand>
        </div>
    );
}