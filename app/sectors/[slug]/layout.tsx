import { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || "";

  if (slug === "oil-gas") {
    return {
      title: "Oil & Gas Industry India | Upstream, Refining, Pipelines & Markets | ENERGDIVE",
      description: "Explore oil & gas intelligence from ENERGDIVE covering upstream, pipelines, refining, petrochemicals, CGD, LPG, retail and oil markets with insights on policy, infrastructure, technology, and market developments shaping India’s energy future.",
      keywords: [
        "oil and gas industry india",
        "oil and gas sector india",
        "oil and gas market india",
        "energdive",
        "energy dive",
        "energdive magazine",
        "energy dive magazine",
        "energydive magazine",
        "energ dive magazine",
        "oil and gas news india",
        "upstream oil and gas india",
        "oil and gas pipelines india",
        "oil refining india",
        "petrochemicals india",
        "city gas distribution india",
        "cgd india",
        "lpg market india",
        "oil retail india",
        "oil markets india",
        "downstream oil and gas india",
        "energy transition oil and gas india",
        "oil and gas policy india",
        "oil and gas infrastructure india"
      ],
      authors: [{ name: "ClariSector Technologies Pvt. Ltd." }],
      publisher: "ENERGDIVE",
      generator: "ClariSector Technologies Pvt. Ltd.",
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
        },
      },
      alternates: {
        canonical: "https://www.energdive.com/sectors/oil-gas",
      },
      openGraph: {
        title: "Oil & Gas Industry India | ENERGDIVE",
        description: "Get insights on India’s oil & gas sector including upstream, refining, pipelines, petrochemicals and energy markets shaping the industry’s future.",
        url: "https://www.energdive.com/sectors/oil-gas",
        type: "website",
        siteName: "ENERGDIVE",
        images: [
          {
            url: "https://www.energdive.com/og-image.jpg",
            width: 1200,
            height: 630,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Oil & Gas Industry India | ENERGDIVE",
        description: "Explore insights on oil & gas markets, infrastructure, and policy shaping India’s energy ecosystem.",
        site: "@energdive",
      },
      other: {
        classification: "Oil & Gas Intelligence Platform, Energy Sector Platform, Industry Insights Portal",
        topic: "Oil & Gas, Upstream, Refining, Pipelines, Petrochemicals, CGD, LPG, Energy Markets",
        audience: "Oil & gas professionals, policymakers, energy companies, investors, analysts, industry leaders",
        distribution: "global",
        language: "English",
        copyright: "© 2026 ENERGDIVE",
        city: "New Delhi",
        state: "Delhi",
        location: "New Delhi, India",
      },
    };
  } else if (slug === "power-generation") {
    return {
      title: "Power Generation India | Thermal, Nuclear & Utilities Sector Insights | ENERGDIVE",
      description: "Track India’s power generation and utilities sector with ENERGDIVE covering thermal, nuclear, grid innovation, renewables integration, energy storage, digitalisation, and policy developments shaping the future of electricity in India.",
      keywords: [
        "power generation india",
        "power and utilities india",
        "power sector india",
        "energdive",
        "energy dive",
        "energdive magazine",
        "energy dive magazine",
        "energydive magazine",
        "energ dive magazine",
        "thermal power india",
        "nuclear power india",
        "electricity generation india",
        "power plants india",
        "coal power india",
        "gas power india",
        "power utilities india",
        "electricity sector india",
        "grid infrastructure india",
        "power transmission india",
        "energy storage power sector india",
        "renewable integration india",
        "power sector policy india",
        "electricity market india",
        "smart grid india"
      ],
      authors: [{ name: "ClariSector Technologies Pvt. Ltd." }],
      publisher: "ENERGDIVE",
      generator: "ClariSector Technologies Pvt. Ltd.",
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
        },
      },
      alternates: {
        canonical: "https://www.energdive.com/sectors/power-generation",
      },
      openGraph: {
        title: "Power Generation India | ENERGDIVE",
        description: "Explore insights on India’s power generation sector including thermal, nuclear, utilities, grid innovation, and energy transition.",
        url: "https://www.energdive.com/sectors/power-generation",
        type: "website",
        siteName: "ENERGDIVE",
        images: [
          {
            url: "https://www.energdive.com/og-image.jpg",
            width: 1200,
            height: 630,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Power Generation India | ENERGDIVE",
        description: "Track thermal, nuclear, and utilities sector developments shaping India’s electricity and power ecosystem.",
        site: "@energdive",
      },
      other: {
        classification: "Power Sector Intelligence Platform, Energy Utilities Platform, Electricity Industry Portal",
        topic: "Power Generation, Thermal Power, Nuclear Power, Utilities, Electricity, Grid, Energy Transition",
        audience: "Power sector professionals, utilities, policymakers, energy companies, investors, analysts",
        distribution: "global",
        language: "English",
        copyright: "© 2026 ENERGDIVE",
        city: "New Delhi",
        state: "Delhi",
        location: "New Delhi, India",
      },
    };
  } else if (slug === "renewables") {
    return {
      title: "Renewable Energy India | Solar, Wind, Hydro & Bioenergy Insights | ENERGDIVE",
      description: "Explore renewable energy insights from ENERGDIVE covering solar, wind, hydro, biopower, cogeneration and waste-to-energy, tracking India’s renewable expansion, policy developments, investments, and market growth.",
      keywords: [
        "renewable energy india",
        "energdive",
        "energy dive",
        "energdive magazine",
        "energy dive magazine",
        "energydive magazine",
        "energ dive magazine",
        "solar energy india",
        "wind energy india",
        "hydropower india",
        "bioenergy india",
        "biopower india",
        "cogeneration india",
        "waste to energy india",
        "renewable power india",
        "clean energy india",
        "green energy india",
        "renewable energy policy india",
        "renewable energy investments india",
        "renewable energy market india",
        "energy transition india renewables",
        "india renewable sector growth"
      ],
      authors: [{ name: "ClariSector Technologies Pvt. Ltd." }],
      publisher: "ENERGDIVE",
      generator: "ClariSector Technologies Pvt. Ltd.",
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
        },
      },
      alternates: {
        canonical: "https://www.energdive.com/sectors/renewables",
      },
      openGraph: {
        title: "Renewable Energy India | ENERGDIVE",
        description: "Track India’s renewable energy growth across solar, wind, hydro, and bioenergy with insights on policy, investments, and market developments.",
        url: "https://www.energdive.com/sectors/renewables",
        type: "website",
        siteName: "ENERGDIVE",
        images: [
          {
            url: "https://www.energdive.com/og-image.jpg",
            width: 1200,
            height: 630,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Renewable Energy India | ENERGDIVE",
        description: "Explore solar, wind, hydro, and bioenergy insights shaping India’s renewable energy transition.",
        site: "@energdive",
      },
      other: {
        classification: "Renewable Energy Platform, Clean Energy Intelligence Platform, Energy Transition Portal",
        topic: "Renewable Energy, Solar, Wind, Hydro, Bioenergy, Clean Energy, Sustainability, Energy Transition",
        audience: "Renewable energy professionals, policymakers, investors, developers, utilities, industry leaders",
        distribution: "global",
        language: "English",
        copyright: "© 2026 ENERGDIVE",
        city: "New Delhi",
        state: "Delhi",
        location: "New Delhi, India",
      },
    };
  } else if (slug === "transmission") {
    return {
      title: "Power Transmission India | Grid, Interconnections & Smart Grid Insights | ENERGDIVE",
      description: "Explore power transmission insights from ENERGDIVE covering grid expansion, interconnections, smart grids, and digital infrastructure shaping India’s modern power system and energy transition.",
      keywords: [
        "power transmission india",
        "transmission sector india",
        "electricity transmission india",
        "energdive",
        "energy dive",
        "energdive magazine",
        "energy dive magazine",
        "energydive magazine",
        "energ dive magazine",
        "smart grid india",
        "grid infrastructure india",
        "power grid india",
        "electric grid india",
        "transmission network india",
        "interconnections power india",
        "high voltage transmission india",
        "grid modernization india",
        "transmission lines india",
        "electricity infrastructure india",
        "energy transition grid india",
        "power transmission policy india",
        "grid digitalisation india"
      ],
      authors: [{ name: "ClariSector Technologies Pvt. Ltd." }],
      publisher: "ENERGDIVE",
      generator: "ClariSector Technologies Pvt. Ltd.",
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
        },
      },
      alternates: {
        canonical: "https://www.energdive.com/sectors/transmission",
      },
      openGraph: {
        title: "Power Transmission India | ENERGDIVE",
        description: "Track grid expansion, smart grid technologies, and transmission infrastructure shaping India’s evolving power system.",
        url: "https://www.energdive.com/sectors/transmission",
        type: "website",
        siteName: "ENERGDIVE",
        images: [
          {
            url: "https://www.energdive.com/og-image.jpg",
            width: 1200,
            height: 630,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Power Transmission India | ENERGDIVE",
        description: "Explore transmission networks, smart grids, and infrastructure driving India’s power system transformation.",
        site: "@energdive",
      },
      other: {
        classification: "Power Transmission Platform, Grid Infrastructure Intelligence Platform, Energy Network Portal",
        topic: "Power Transmission, Smart Grid, Grid Infrastructure, Interconnections, Electricity Networks, Energy Transition",
        audience: "Power utilities, transmission companies, policymakers, grid operators, energy professionals, investors",
        distribution: "global",
        language: "English",
        copyright: "© 2026 ENERGDIVE",
        city: "New Delhi",
        state: "Delhi",
        location: "New Delhi, India",
      },
    };
  } else if (slug === "distribution") {
    return {
      title: "Power Distribution India | Smart Meters, EV Charging & Digital Utilities | ENERGDIVE",
      description: "Explore power distribution insights from ENERGDIVE covering smart meters, EV charging, data centres, smart cities, and digital infrastructure transforming utilities and consumer energy systems in India.",
      keywords: [
        "power distribution india",
        "electricity distribution india",
        "distribution sector india",
        "energdive",
        "energy dive",
        "energdive magazine",
        "energy dive magazine",
        "energydive magazine",
        "energ dive magazine",
        "smart meters india",
        "ami metering india",
        "advanced metering infrastructure india",
        "ev charging infrastructure india",
        "electric vehicle charging india",
        "data centres energy india",
        "smart cities india energy",
        "railways electrification india",
        "metro rail power india",
        "distribution utilities india",
        "power discoms india",
        "electricity consumers india",
        "distribution network india",
        "grid edge technologies india",
        "energy digitalisation india"
      ],
      authors: [{ name: "ClariSector Technologies Pvt. Ltd." }],
      publisher: "ENERGDIVE",
      generator: "ClariSector Technologies Pvt. Ltd.",
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
        },
      },
      alternates: {
        canonical: "https://www.energdive.com/sectors/distribution",
      },
      openGraph: {
        title: "Power Distribution India | ENERGDIVE",
        description: "Track smart meters, EV charging, and digital utilities transforming India’s power distribution and consumer energy ecosystem.",
        url: "https://www.energdive.com/sectors/distribution",
        type: "website",
        siteName: "ENERGDIVE",
        images: [
          {
            url: "https://www.energdive.com/og-image.jpg",
            width: 1200,
            height: 630,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Power Distribution India | ENERGDIVE",
        description: "Explore smart metering, EV charging, and digital infrastructure shaping India’s power distribution sector.",
        site: "@energdive",
      },
      other: {
        classification: "Power Distribution Platform, Utility Intelligence Platform, Energy Infrastructure Portal",
        topic: "Power Distribution, Smart Meters, EV Charging, Utilities, Digital Infrastructure, Smart Cities, Electricity Consumers",
        audience: "Utilities, discoms, policymakers, energy professionals, infrastructure companies, investors",
        distribution: "global",
        language: "English",
        copyright: "© 2026 ENERGDIVE",
        city: "New Delhi",
        state: "Delhi",
        location: "New Delhi, India",
      },
    };
  } else if (slug === "electricity-markets") {
    return {
      title: "Electricity Markets India | Power Trading, Carbon Markets & Pricing | ENERGDIVE",
      description: "Explore electricity market insights from ENERGDIVE covering power trading, carbon markets, pricing mechanisms, and regulatory developments shaping how electricity is exchanged and managed in India.",
      keywords: [
        "electricity markets india",
        "power markets india",
        "power trading india",
        "electricity trading india",
        "carbon markets india",
        "electricity pricing india",
        "energy markets india",
        "energdive",
        "energy dive",
        "energdive magazine",
        "energy dive magazine",
        "energydive magazine",
        "energ dive magazine",
        "wholesale electricity market india",
        "power exchange india",
        "energy exchange india",
        "grid market india",
        "electricity tariffs india",
        "electricity regulation india",
        "rco electricity india",
        "renewable certificates india",
        "energy policy india electricity",
        "electricity demand supply india"
      ],
      authors: [{ name: "ClariSector Technologies Pvt. Ltd." }],
      publisher: "ENERGDIVE",
      generator: "ClariSector Technologies Pvt. Ltd.",
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
        },
      },
      alternates: {
        canonical: "https://www.energdive.com/sectors/electricity-markets",
      },
      openGraph: {
        title: "Electricity Markets India | ENERGDIVE",
        description: "Understand power trading, carbon markets, and electricity pricing trends shaping India’s evolving energy markets.",
        url: "https://www.energdive.com/sectors/electricity-markets",
        type: "website",
        siteName: "ENERGDIVE",
        images: [
          {
            url: "https://www.energdive.com/og-image.jpg",
            width: 1200,
            height: 630,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Electricity Markets India | ENERGDIVE",
        description: "Explore power trading, carbon markets, and pricing dynamics shaping India’s electricity markets.",
        site: "@energdive",
      },
      other: {
        classification: "Electricity Market Intelligence Platform, Energy Trading Platform, Power Market Insights Portal",
        topic: "Electricity Markets, Power Trading, Carbon Markets, Energy Pricing, Electricity Regulation, Energy Exchanges",
        audience: "Energy traders, utilities, policymakers, regulators, power companies, investors, analysts",
        distribution: "global",
        language: "English",
        copyright: "© 2026 ENERGDIVE",
        city: "New Delhi",
        state: "Delhi",
        location: "New Delhi, India",
      },
    };
  } else if (slug === "new-energies") {
    return {
      title: "New Energy India | Green Hydrogen, E-Fuels & Emerging Technologies | ENERGDIVE",
      description: "Explore new energy insights from ENERGDIVE covering green hydrogen, e-fuels, and emerging low-carbon technologies driving India’s next phase of energy transition and industrial decarbonisation.",
      keywords: [
        "new energy india",
        "energdive",
        "energy dive",
        "energdive magazine",
        "energy dive magazine",
        "energydive magazine",
        "energ dive magazine",
        "green hydrogen india",
        "hydrogen economy india",
        "e-fuels india",
        "synthetic fuels india",
        "low carbon energy india",
        "clean fuels india",
        "energy transition technologies india",
        "hydrogen policy india",
        "green hydrogen mission india",
        "hydrogen production india",
        "fuel innovation india",
        "industrial decarbonisation india",
        "future energy india",
        "alternative fuels india"
      ],
      authors: [{ name: "ClariSector Technologies Pvt. Ltd." }],
      publisher: "ENERGDIVE",
      generator: "ClariSector Technologies Pvt. Ltd.",
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
        },
      },
      alternates: {
        canonical: "https://www.energdive.com/sectors/new-energies",
      },
      openGraph: {
        title: "New Energy India | ENERGDIVE",
        description: "Track green hydrogen, e-fuels, and emerging low-carbon technologies shaping India’s next phase of energy transition.",
        url: "https://www.energdive.com/sectors/new-energies",
        type: "website",
        siteName: "ENERGDIVE",
        images: [
          {
            url: "https://www.energdive.com/og-image.jpg",
            width: 1200,
            height: 630,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "New Energy India | ENERGDIVE",
        description: "Explore hydrogen, e-fuels, and emerging technologies driving India’s clean energy future.",
        site: "@energdive",
      },
      other: {
        classification: "New Energy Platform, Clean Technology Intelligence Platform, Energy Transition Innovation Portal",
        topic: "New Energies, Green Hydrogen, E-Fuels, Low Carbon Technologies, Energy Innovation, Decarbonisation",
        audience: "Energy innovators, policymakers, hydrogen industry, investors, technology providers, industry leaders",
        distribution: "global",
        language: "English",
        copyright: "© 2026 ENERGDIVE",
        city: "New Delhi",
        state: "Delhi",
        location: "New Delhi, India",
      },
    };
  } else if (slug === "energy-storage") {
    return {
      title: "Energy Storage India | BESS, Pumped Hydro & Grid Flexibility Insights | ENERGDIVE",
      description: "Explore energy storage insights from ENERGDIVE covering battery energy storage systems (BESS), pumped hydro, CAES, thermal and long-duration storage enabling grid flexibility and renewable integration in India.",
      keywords: [
        "energy storage india",
        "energdive",
        "energy dive",
        "energdive magazine",
        "energy dive magazine",
        "energydive magazine",
        "energ dive magazine",
        "battery energy storage india",
        "bess india",
        "pumped hydro storage india",
        "caes india",
        "compressed air energy storage india",
        "thermal energy storage india",
        "flywheel energy storage india",
        "long duration energy storage india",
        "grid flexibility india",
        "renewable integration storage india",
        "energy storage systems india",
        "battery storage policy india",
        "grid scale storage india",
        "energy storage market india",
        "clean energy storage india"
      ],
      authors: [{ name: "ClariSector Technologies Pvt. Ltd." }],
      publisher: "ENERGDIVE",
      generator: "ClariSector Technologies Pvt. Ltd.",
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
        },
      },
      alternates: {
        canonical: "https://www.energdive.com/sectors/energy-storage",
      },
      openGraph: {
        title: "Energy Storage India | ENERGDIVE",
        description: "Track battery storage, pumped hydro, and long-duration energy storage solutions shaping India’s grid flexibility and renewable integration.",
        url: "https://www.energdive.com/sectors/energy-storage",
        type: "website",
        siteName: "ENERGDIVE",
        images: [
          {
            url: "https://www.energdive.com/og-image.jpg",
            width: 1200,
            height: 630,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Energy Storage India | ENERGDIVE",
        description: "Explore battery storage, pumped hydro, and grid flexibility technologies enabling India’s renewable energy transition.",
        site: "@energdive",
      },
      other: {
        classification: "Energy Storage Platform, Grid Flexibility Intelligence Platform, Clean Energy Infrastructure Portal",
        topic: "Energy Storage, Battery Storage, Pumped Hydro, Grid Flexibility, Renewable Integration, Energy Systems",
        audience: "Energy storage companies, utilities, policymakers, investors, developers, technology providers",
        distribution: "global",
        language: "English",
        copyright: "© 2026 ENERGDIVE",
        city: "New Delhi",
        state: "Delhi",
        location: "New Delhi, India",
      },
    };
  } else if (slug === "sustainability-and-safety") {
    return {
      title: "Sustainability & Safety in Energy India | Environment, HSE & Efficiency | ENERGDIVE",
      description: "Explore sustainability and safety insights from ENERGDIVE covering environmental responsibility, energy efficiency, occupational health, and industrial safety practices shaping safer and sustainable energy operations in India.",
      keywords: [
        "sustainability energy india",
        "energy safety india",
        "hse india energy",
        "industrial safety india energy",
        "environment energy india",
        "energy efficiency india",
        "energdive",
        "energy dive",
        "energdive magazine",
        "energy dive magazine",
        "energydive magazine",
        "energ dive magazine",
        "occupational health energy india",
        "process safety india",
        "industrial safety oil and gas india",
        "environmental sustainability energy india",
        "esg energy india",
        "climate safety energy india",
        "safety compliance india energy",
        "risk management energy india",
        "energy sector safety india",
        "sustainable energy practices india"
      ],
      authors: [{ name: "ClariSector Technologies Pvt. Ltd." }],
      publisher: "ENERGDIVE",
      generator: "ClariSector Technologies Pvt. Ltd.",
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
        },
      },
      alternates: {
        canonical: "https://www.energdive.com/sectors/sustainability-and-safety",
      },
      openGraph: {
        title: "Sustainability & Safety in Energy India | ENERGDIVE",
        description: "Explore energy sustainability, HSE practices, and safety innovations shaping responsible and resilient energy systems in India.",
        url: "https://www.energdive.com/sectors/sustainability-and-safety",
        type: "website",
        siteName: "ENERGDIVE",
        images: [
          {
            url: "https://www.energdive.com/og-image.jpg",
            width: 1200,
            height: 630,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Sustainability & Safety in Energy India | ENERGDIVE",
        description: "Discover insights on energy sustainability, industrial safety, and HSE practices shaping India’s energy ecosystem.",
        site: "@energdive",
      },
      other: {
        classification: "Sustainability Platform, Safety & HSE Intelligence Platform, Energy Compliance Portal",
        topic: "Sustainability, Safety, HSE, Energy Efficiency, Environment, Occupational Health, Industrial Safety",
        audience: "Energy companies, HSE professionals, policymakers, compliance officers, industry leaders, consultants",
        distribution: "global",
        language: "English",
        copyright: "© 2026 ENERGDIVE",
        city: "New Delhi",
        state: "Delhi",
        location: "New Delhi, India",
      },
    };
  }

  // Fallback for other sectors
  const formattedTitle = slug.split("-").map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  return {
    title: `${formattedTitle} | ENERGDIVE`,
    description: `Insights and intelligence for the ${formattedTitle} sector in India's energy transition.`,
    alternates: {
      canonical: `https://www.energdive.com/sectors/${slug}`,
    },
    openGraph: {
      title: `${formattedTitle} | ENERGDIVE`,
      description: `Insights and intelligence for the ${formattedTitle} sector in India's energy transition.`,
      url: `https://www.energdive.com/sectors/${slug}`,
    }
  };
}

export default function SectorSlugLayout({
  children,
}: Props) {
  return <>{children}</>;
}
