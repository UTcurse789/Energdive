import Link from "next/link";
import { ArrowRight, Building2, Package, Layers, Wrench } from "lucide-react";

export function ExploreByNeed() {
  const needs = [
    {
      intent: "Find an energy company",
      desc: "Browse verified utilities, IPPs, PSUs and manufacturers",
      href: "/marketplace/companies",
      Icon: "Building2",
    },
    {
      intent: "Find a product or technology",
      desc: "Explore utility-grade equipment and industrial solutions",
      href: "/marketplace/products",
      Icon: "Package",
    },
    {
      intent: "Explore a sector",
      desc: "Navigate the full energy value chain by domain",
      href: "/marketplace/sectors",
      Icon: "Layers",
    },
    {
      intent: "Discover energy services",
      desc: "EPC, O&M, advisory, testing and procurement support",
      href: "/marketplace/companies?sector=Energy Services",
      Icon: "Wrench",
    },
    {
      intent: "List my company",
      desc: "Establish your presence on the Energdive platform",
      href: "/contact",
      Icon: "ArrowRight",
    },
  ];

  return (
    <section className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Section header */}
        <div className="lg:col-span-4">
          <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-[#00A651] uppercase mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00A651]" />
            INTENT-BASED DISCOVERY
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-black uppercase tracking-tight text-zinc-950 mb-3">
            WHAT ARE YOU LOOKING FOR?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 font-normal leading-relaxed">
            Multiple entry points into the Energdive marketplace — find what you need based on your procurement intent, research objective, or discovery goal.
          </p>
        </div>

        {/* Right: Text action links — not large cards */}
        <div className="lg:col-span-8">
          <div className="divide-y divide-zinc-200/80 border-t border-zinc-200/80">
            {needs.map((item) => (
              <Link
                key={item.intent}
                href={item.href}
                className="group flex items-start justify-between gap-4 py-4 hover:bg-zinc-50/50 px-2 -mx-2 rounded-lg transition-colors"
              >
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 group-hover:text-[#00A651] transition-colors uppercase tracking-wide">
                    I want to &mdash; {item.intent}
                  </h3>
                  <p className="text-xs text-zinc-500 font-normal mt-0.5">{item.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-[#00A651] group-hover:translate-x-1 transition-all mt-0.5 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}