import Link from "next/link";
import Image from "next/image";
import { ChevronRight, ArrowUpRight } from "lucide-react";

/* ─── Main sector definitions with display info ─── */
const MAIN_SECTORS = [
    {
        title: "Oil & Gas",
        slug: "oil-gas",
        description: "From upstream exploration to refining, petrochemicals, city gas, and fuel markets, ENERGDIVE follows the developments shaping India’s hydrocarbon economy and energy security.",
        heroImage: "https://images.unsplash.com/photo-1516937941344-00b4e0337589?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        subSectors: ["Upstream", "Midstream", "Downstream", "LNG", "CGD", "Refining", "Petrochemicals"],
    },
    {
        title: "Power Generation",
        slug: "power-generation",
        description: "ENERGDIVE brings clarity to India’s generation landscape, covering thermal, nuclear, hydro, and emerging technologies as the country balances reliability with transition goals.",
        heroImage: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&q=80&w=800",
        subSectors: ["Thermal", "Hydro", "Nuclear", "Gas-to-Power", "Cogeneration"],
    },
    {
        title: "Renewables",
        slug: "renewables",
        description: "Across solar, wind, hydro, and bio-based solutions, ENERGDIVE tracks the momentum of India’s renewable expansion and the policies and investments driving scale.",
        heroImage: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=800",
        subSectors: ["Solar", "Wind", "Hydro", "Biopower", "Waste-to-Energy"],
    },
    {
        title: "Transmission",
        slug: "transmission",
        description: "Grid expansion, interconnections, and digital infrastructure remain central to the energy transition, and ENERGDIVE examines how transmission is evolving to support a modern power system.",
        heroImage: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        subSectors: ["HVDC", "Interconnectors", "Grid Infrastructure", "Smart Grid"],
    },
    {
        title: "Distribution",
        slug: "distribution",
        description: "As utilities modernise through smart metering, electrified mobility, and digital infrastructure, ENERGDIVE explores how distribution is redefining the interface between power systems and consumers.",
        heroImage: "https://images.unsplash.com/photo-1548337138-e87d889cc369?auto=format&fit=crop&q=80&w=800",
        subSectors: ["Smart Meters & AMI", "EV Charging", "Data Centres", "Smart Cities", "Rural Electrification"],
    },
    {
        title: "Electricity Markets",
        slug: "electricity-markets",
        description: "ENERGDIVE analyses power trading, carbon markets, and regulatory developments shaping how electricity is priced, exchanged, and managed in an increasingly dynamic market environment.",
        heroImage: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=800",
        subSectors: ["Power Markets", "Carbon Markets", "RCO", "Power Exchange"],
    },
    {
        title: "New Energies",
        slug: "new-energies",
        description: "Green hydrogen, e-fuels, and emerging low-carbon pathways signal the next phase of transition, and ENERGDIVE follows the technologies and strategies moving these ideas toward scale.",
        heroImage: "https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?auto=format&fit=crop&q=80&w=800",
        subSectors: ["Green Hydrogen", "Green Ammonia", "E-Fuels", "CCUS", "Biofuels"],
    },
    {
        title: "Energy Storage",
        slug: "energy-storage",
        description: "From battery systems to pumped hydro and long-duration solutions, ENERGDIVE tracks how storage is strengthening grid flexibility and enabling deeper renewable integration.",
        heroImage: "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&q=80&w=800",
        subSectors: ["BESS", "Pumped Hydro", "CAES", "Flywheel", "Thermal Storage"],
    },
    {
        title: "Sustainability & Safety",
        slug: "sustainability-and-safety",
        description: "Environmental responsibility, efficiency, occupational health, and industrial safety remain integral to modern energy operations, and ENERGDIVE highlights the practices shaping safer and more sustainable outcomes.",
        heroImage: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=800",
        subSectors: ["ESG", "HSSE", "Safety", "Net Zero", "Environment", "Energy Efficiency"],
    },
];

export default function SectorsPage() {
    return (
        <div className="min-h-screen bg-[#fafafa] text-[#121212]">

            {/* ── Hero Section ── */}
            <section className="relative bg-black overflow-hidden">
                <div
                    className="absolute inset-0 opacity-40"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage:
                            "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
                        backgroundSize: "44px 44px",
                    }}
                />

                <div className="container mx-auto px-6 lg:px-16 max-w-[1400px] relative z-10 py-28 md:py-36">
                    <nav className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[10px] font-black text-[#00C6A7] uppercase tracking-[0.2em] mb-10 backdrop-blur-sm mt-8">
                        <Link href="/" className="hover:text-white transition">ENERGDIVE</Link>
                        <ChevronRight size={10} className="text-white/40" />
                        <span className="text-white">Sectors</span>
                    </nav>

                    <h1 className="text-5xl md:text-7xl lg:text-[96px] font-black uppercase leading-[0.9] tracking-tighter text-white mb-6">
                        Energy <br />Sectors
                    </h1>

                    <p className="text-lg md:text-xl text-gray-300 max-w-xl border-l-2 border-[#00C6A7] pl-6 font-light leading-relaxed">
                        Step into India’s interconnected energy ecosystem with ENERGDIVE, covering oil & gas, power, renewables, markets, storage, sustainability, and new technologies.
                    </p>

                    <div className="mt-8 flex flex-wrap gap-3 mb-20">
                        <div className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                            {MAIN_SECTORS.length} Sectors
                        </div>
                        {/* <div className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                            {MAIN_SECTORS.reduce((sum, s) => sum + s.subSectors.length, 0)}+ Sub-Sectors
                        </div> */}
                    </div>
                </div>

                <div className="absolute left-0 right-0 bottom-0 h-16 bg-gradient-to-t from-[#fafafa] to-transparent" />
            </section>

            {/* ── Sectors Grid ── */}
            <section className="container mx-auto mt-20 px-6 lg:px-16 max-w-[1400px] pt-20 pb-48">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-30">
                    {MAIN_SECTORS.map((sector) => (
                        <Link key={sector.slug} href={`/sectors/${sector.slug}`} className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
                            <div className="relative h-48 overflow-hidden">
                                <Image src={sector.heroImage} alt={sector.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2 rounded-full opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                    <ArrowUpRight size={16} className="text-black" />
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-5">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight leading-tight">{sector.title}</h3>
                                </div>
                            </div>
                            <div className="p-5">
                                <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-2">{sector.description}</p>
                                {/* <div className="flex flex-wrap gap-1.5">
                                    {sector.subSectors.slice(0, 4).map((sub) => (
                                        <span key={sub} className="inline-flex items-center rounded-full bg-gray-50 border border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2.5 py-1 group-hover:border-[#009624]/20 group-hover:text-[#009624] transition-colors">{sub}</span>
                                    ))}
                                    {sector.subSectors.length > 4 && (
                                        <span className="inline-flex items-center rounded-full bg-gray-50 border border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2.5 py-1">+{sector.subSectors.length - 4}</span>
                                    )}
                                </div> */}
                                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                                    <span className="text-[11px] font-black text-[#009624] uppercase tracking-[0.15em] group-hover:tracking-[0.2em] transition-all">Explore Sector</span>
                                    <ChevronRight size={14} className="text-[#009624] transition-transform group-hover:translate-x-1 duration-300" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
