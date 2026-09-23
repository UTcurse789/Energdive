import Link from "next/link";
import { MarketplaceCategory } from "@/data/marketplace/types";
import {
  Zap,
  Sun,
  Wind,
  Flame,
  GitBranch,
  BatteryCharging,
  Car,
  Atom,
  Radiation,
  Cpu,
  Building2,
  Wrench,
  ArrowRight,
  LucideIcon,
} from "lucide-react";

interface SectorCardProps {
  category: MarketplaceCategory;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Zap,
  Sun,
  Wind,
  Flame,
  GitBranch,
  BatteryCharging,
  Car,
  Atom,
  Radiation,
  Radioactive: Radiation,
  Cpu,
  Building2,
  Wrench,
};

export function SectorCard({ category }: SectorCardProps) {
  const IconComponent = ICON_MAP[category.iconName] || Zap;

  return (
    <Link
      href={`/marketplace/companies?sector=${encodeURIComponent(category.name)}`}
      className="group relative bg-white border border-zinc-200/90 rounded-xl p-5 hover:border-[#00A651] hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden"
    >
      {/* Top indicator strip on hover */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#00A651] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />

      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="w-11 h-11 rounded-lg bg-zinc-100 group-hover:bg-[#00A651]/10 text-zinc-700 group-hover:text-[#00A651] flex items-center justify-center transition-colors">
            <IconComponent className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 group-hover:text-[#00A651] transition-colors flex items-center gap-1">
            Sector <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>

        <h3 className="text-sm sm:text-base font-bold text-zinc-900 group-hover:text-[#00A651] transition-colors leading-snug">
          {category.name}
        </h3>

        <p className="text-xs text-zinc-500 mt-2 line-clamp-2 leading-relaxed">
          {category.description}
        </p>
      </div>

      <div className="mt-4 pt-3.5 border-t border-zinc-100 flex items-center justify-between text-[11px] font-medium text-zinc-400">
        <span>{category.companyCount ?? 0} Companies</span>
        <span className="w-1 h-1 rounded-full bg-zinc-300" />
        <span>{category.productCount ?? 0} Solutions</span>
      </div>
    </Link>
  );
}
