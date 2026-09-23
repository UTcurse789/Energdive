"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Package, LayoutGrid, Layers, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { EnquiryModal } from "./enquiry-modal";

export function MarketplaceNav() {
  const pathname = usePathname();
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);

  const links = [
    {
      name: "Overview",
      href: "/marketplace",
      exact: true,
      icon: LayoutGrid,
    },
    {
      name: "Companies",
      href: "/marketplace/companies",
      exact: false,
      icon: Building2,
    },
    {
      name: "Products",
      href: "/marketplace/products",
      exact: false,
      icon: Package,
    },
    {
      name: "Sectors",
      href: "/marketplace/sectors",
      exact: false,
      icon: Layers,
    },
  ];

  const isActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <div className="w-full bg-white border-b border-zinc-200 sticky top-[60px] sm:top-[70px] md:top-[80px] z-40 shadow-xs">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-12 sm:h-13">
          {/* Navigation Links */}
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="hidden md:flex items-center text-[10px] font-black tracking-widest text-[#00A651] uppercase mr-3 pr-3 border-r border-zinc-200">
              MARKETPLACE
            </span>

            {links.map((link) => {
              const active = isActive(link.href, link.exact);
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] sm:text-[12px] font-bold uppercase tracking-wider transition-all",
                    active
                      ? "bg-[#00A651] text-white shadow-xs"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Quick CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsListingModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-[#00A651]/10 border border-[#00A651]/30 hover:bg-[#00A651] hover:text-white text-[#00A651] text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-md transition-all cursor-pointer shadow-2xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List Your Company</span>
              <span className="sm:hidden">List Company</span>
            </button>
          </div>
        </div>
      </div>

      <EnquiryModal
        isOpen={isListingModalOpen}
        onClose={() => setIsListingModalOpen(false)}
        defaultTargetType="general"
        targetName="Marketplace Onboarding & Listing"
        title="List Your Company on Energdive Marketplace"
        subtitle="Submit your company and solution details for editorial review and directory inclusion."
      />
    </>
  );
}
