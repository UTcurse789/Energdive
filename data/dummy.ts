// import { Article, Sector, Event } from "@/types";

// export const SECTORS: Sector[] = [
//     { title: "Oil & Gas", slug: "oil-gas" },
//     { title: "Power & Utilities", slug: "power-utilities" },
//     { title: "Renewables", slug: "renewables" },
//     { title: "Sustainability", slug: "sustainability" },
//     { title: "Climate Policy", slug: "climate-policy" },
// ];

// export const ARTICLES: Article[] = [
//     {
//         id: "1",
//         title: "Global Energy Demand Hits Record High Amid Supply Concerns",
//         slug: "global-energy-demand-record-high",
//         excerpt: "Despite renewable growth, fossil fuel consumption remains robust as emerging markets drive unprecedented demand spikes.",
//         content: "Full article content here...",
//         author: {
//             name: "Sarah Jenkings",
//             avatar: "https://i.pravatar.cc/150?u=sarah",
//             bio: "Senior Energy Analyst covering APAC markets."
//         },
//         category: "Oil & Gas",
//         image: "https://placehold.co/1000x600/e2e8f0/1e293b?text=Oil+Rig", // Oil rig placeholder
//         date: "Oct 24, 2024",
//         readTime: "5 min read",
//         featured: true,
//         trending: true,
//     },
//     {
//         id: "2",
//         title: "The Future of Hydrogen: Hype vs. Reality in 2025",
//         slug: "hydrogen-hype-vs-reality",
//         excerpt: "Green hydrogen projects are stalling due to cost overruns. Is the dream of a hydrogen economy fading?",
//         author: {
//             name: "David Ross",
//             avatar: "https://i.pravatar.cc/150?u=david",
//             bio: "Tech editor specializing in clean energy innovations."
//         },
//         category: "Renewables",
//         image: "https://placehold.co/1000x600/e2e8f0/1e293b?text=Solar+Hydrogen", // Solar/Hydrogen placeholder
//         date: "Oct 23, 2024",
//         readTime: "8 min read",
//         trending: true,
//     },
//     {
//         id: "3",
//         title: "Offshore Wind Auctions See Mixed Results in Europe",
//         slug: "offshore-wind-mixed-results",
//         excerpt: "Supply chain bottlenecks and rising interest rates are cooling investor sentiment in the North Sea.",
//         author: {
//             name: "Elena M.",
//             avatar: "https://i.pravatar.cc/150?u=elena",
//             bio: "Europe correspondent."
//         },
//         category: "Power & Utilities",
//         image: "https://placehold.co/1000x600/e2e8f0/1e293b?text=Wind+Turbines", // Wind turbines placeholder
//         date: "Oct 22, 2024",
//         readTime: "4 min read",
//     },
//     {
//         id: "4",
//         title: "Carbon Capture Technology: Essential or Distraction?",
//         slug: "carbon-capture-essential-or-distraction",
//         excerpt: "New report suggests CCS is critical for net-zero scenarios, but environmental groups remain skeptical.",
//         author: {
//             name: "Michael Chen",
//             avatar: "https://i.pravatar.cc/150?u=michael",
//             bio: "Climate policy researcher."
//         },
//         category: "Climate Policy",
//         image: "https://placehold.co/1000x600/e2e8f0/1e293b?text=Carbon+Capture", // Factory/Carbon placeholder
//         date: "Oct 21, 2024",
//         readTime: "6 min read",
//     },
//     {
//         id: "5",
//         title: "Solar Panel Prices Drop to Historic Lows",
//         slug: "solar-panel-prices-lows",
//         excerpt: "Oversupply from Chinese manufacturers is driving down costs but squeezing margins for Western competitors.",
//         author: {
//             name: "Sarah Jenkings",
//             avatar: "https://i.pravatar.cc/150?u=sarah",
//             bio: "Senior Energy Analyst covering APAC markets."
//         },
//         category: "Renewables",
//         image: "https://placehold.co/1000x600/e2e8f0/1e293b?text=Solar+Panels", // Solar panels placeholder
//         date: "Oct 20, 2024",
//         readTime: "3 min read",
//     }
// ];

// export const EVENTS: Event[] = [
//     {
//         id: "1",
//         title: "Global Energy Transition Summit 2025",
//         date: "Nov 12-14, 2025",
//         location: "London, UK",
//         image: "https://placehold.co/1000x600/e2e8f0/1e293b?text=Energy+Summit" // Conference placeholder
//     },
//     {
//         id: "2",
//         title: "Future Power Grid Conference",
//         date: "Dec 05, 2025",
//         location: "Houston, TX",
//         image: "https://placehold.co/1000x600/e2e8f0/1e293b?text=Power+Grid" // Grid/Transmission placeholder
//     },
//     {
//         id: "3",
//         title: "Renewable Finance Forum",
//         date: "Jan 10, 2026",
//         location: "Singapore",
//         image: "https://placehold.co/1000x600/e2e8f0/1e293b?text=Renewable+Finance" // Finance/Office placeholder
//     }
// ];


import { Article, Sector, Event, Opinion, Issue } from "@/types";


export const SECTORS: Sector[] = [
    {
        title: "Oil & Gas",
        slug: "oil-gas",
        description: "Upstream exploration, midstream transport, downstream refining, and LNG trade intelligence.",
        heroImage: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=1600",
        subSectors: ["Upstream", "Midstream", "Downstream", "LNG"],
    },
    {
        title: "Power & Utilities",
        slug: "power-utilities",
        description: "Grid modernisation, transmission infrastructure, smart metering, and utility regulation updates.",
        heroImage: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&q=80&w=1600",
        subSectors: ["Transmission", "Distribution", "Smart Grid", "Nuclear"],
    },
    {
        title: "New Energies",
        slug: "new-energies",
        description: "Hydrogen, solar, wind, battery storage, and emerging clean-tech breakthroughs.",
        heroImage: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=1600",
        subSectors: ["Solar", "Wind", "Hydrogen", "Battery Storage"],
    },
    {
        title: "Sustainability",
        slug: "sustainability",
        description: "Carbon markets, ESG frameworks, climate policy, and corporate net-zero strategies.",
        heroImage: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=1600",
        subSectors: ["Carbon Markets", "ESG", "Climate Policy", "Net Zero"],
    },
];

export const ARTICLES: Article[] = [
    // ── Oil & Gas ────────────────────────────────────────
    {
        id: "1",
        title: "Global Energy Demand Hits Record High Amid Supply Concerns",
        slug: "global-energy-demand-record-high",
        excerpt: "Despite renewable growth, fossil fuel consumption remains robust as emerging markets drive unprecedented demand spikes.",
        content: "Full article content here...",
        author: { name: "Sarah Jenkings", avatar: "https://i.pravatar.cc/150?u=sarah", bio: "Senior Energy Analyst covering APAC markets." },
        category: "Oil & Gas",
        image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=1000",
        date: "Oct 24, 2024",
        readTime: "5 min read",
        featured: true,
        trending: true,
        downloadUrl: "https://encis.in/report-on-the-next-frontier-advancing-hse-to-achieve-global-sdgs.html",
        pdfSize: "4.2 MB",
    },
    {
        id: "2",
        title: "The Future of Hydrogen: Hype vs. Reality in 2025",
        slug: "hydrogen-hype-vs-reality",
        excerpt: "Green hydrogen projects are stalling due to cost overruns. Is the dream of a hydrogen economy fading?",
        author: {
            name: "David Ross",
            avatar: "https://i.pravatar.cc/150?u=david",
            bio: "Tech editor specializing in clean energy innovations."
        },
        category: "Renewables",
        image: "https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?auto=format&fit=crop&q=80&w=1000",
        date: "Oct 23, 2024",
        readTime: "8 min read",
        trending: true,
    },
    {
        id: "3",
        title: "Offshore Wind Auctions See Mixed Results in Europe",
        slug: "offshore-wind-mixed-results",
        excerpt: "Supply chain bottlenecks and rising interest rates are cooling investor sentiment in the North Sea.",
        author: {
            name: "Elena M.",
            avatar: "https://i.pravatar.cc/150?u=elena",
            bio: "Europe correspondent."
        },
        category: "Power & Utilities",
        image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&q=80&w=1000",
        date: "Oct 22, 2024",
        readTime: "4 min read",
    },
    {
        id: "4",
        title: "Carbon Capture Technology: Essential or Distraction?",
        slug: "carbon-capture-essential-or-distraction",
        excerpt: "New report suggests CCS is critical for net-zero scenarios, but environmental groups remain skeptical.",
        author: {
            name: "Michael Chen",
            avatar: "https://i.pravatar.cc/150?u=michael",
            bio: "Climate policy researcher."
        },
        category: "Climate Policy",
        image: "https://images.unsplash.com/photo-1623190829878-c1e1381e46bc?q=80&w=1000&auto=format&fit=crop",
        date: "Oct 21, 2024",
        readTime: "6 min read",
    },
    {
        id: "5",
        title: "Solar Panel Prices Drop to Historic Lows",
        slug: "solar-panel-prices-lows",
        excerpt: "Oversupply from Chinese manufacturers is driving down costs but squeezing margins for Western competitors.",
        author: {
            name: "Sarah Jenkings",
            avatar: "https://i.pravatar.cc/150?u=sarah",
            bio: "Senior Energy Analyst covering APAC markets."
        },
        category: "Renewables",
        image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=1000",
        date: "Oct 20, 2024",
        readTime: "3 min read",
    },
    {
        id: "13",
        title: "Offshore Wind Capacity Doubles in Asia-Pacific Region",
        slug: "offshore-wind-asia-pacific",
        excerpt: "China, South Korea, and Japan lead an unprecedented build-out of floating and fixed-bottom turbines.",
        author: { name: "Ahmed Khalil", avatar: "https://i.pravatar.cc/150?u=ahmed" },
        category: "New Energies",
        subCategory: "Wind",
        image: "https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?auto=format&fit=crop&q=80&w=1000",
        date: "Feb 6, 2026",
        readTime: "5 min read",
    },
    {
        id: "14",
        title: "Battery Storage Costs Fall Below $100/kWh Milestone",
        slug: "battery-storage-cost-milestone",
        excerpt: "Lithium-iron-phosphate chemistry breakthroughs are making grid-scale storage economically viable worldwide.",
        author: { name: "Michael Chen", avatar: "https://i.pravatar.cc/150?u=michael", bio: "Climate researcher." },
        category: "New Energies",
        subCategory: "Battery Storage",
        image: "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&q=80&w=1000",
        date: "Feb 4, 2026",
        readTime: "6 min read",
        trending: true,
    },

    // ── Sustainability ───────────────────────────────────
    {
        id: "4",
        title: "Carbon Capture Technology: Essential or Distraction?",
        slug: "carbon-capture-essential-or-distraction",
        excerpt: "New report suggests CCS is critical for net-zero scenarios, but environmental groups remain skeptical.",
        author: { name: "Michael Chen", avatar: "https://i.pravatar.cc/150?u=michael", bio: "Climate policy researcher." },
        category: "Sustainability",
        subCategory: "Carbon Markets",
        image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000",
        date: "Feb 9, 2026",
        readTime: "6 min read",
    },
    {
        id: "15",
        title: "EU Carbon Border Tax Takes Effect, Reshaping Global Trade",
        slug: "eu-carbon-border-tax",
        excerpt: "CBAM begins full implementation, forcing exporters to account for embedded emissions in steel, cement, and aluminium.",
        author: { name: "Elena M.", avatar: "https://i.pravatar.cc/150?u=elena", bio: "Europe correspondent." },
        category: "Sustainability",
        subCategory: "Climate Policy",
        image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=1000",
        date: "Feb 7, 2026",
        readTime: "5 min read",
        trending: true,
    },
    {
        id: "16",
        title: "ESG Reporting Standards Converge Under ISSB Framework",
        slug: "esg-reporting-issb-framework",
        excerpt: "The International Sustainability Standards Board achieves near-universal adoption across 40+ jurisdictions.",
        author: { name: "Sarah Jenkings", avatar: "https://i.pravatar.cc/150?u=sarah", bio: "Senior Analyst." },
        category: "Sustainability",
        subCategory: "ESG",
        image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1000",
        date: "Feb 5, 2026",
        readTime: "4 min read",
    },
    {
        id: "17",
        title: "Fortune 500 Net-Zero Pledges: Only 12% on Track",
        slug: "fortune-500-net-zero-progress",
        excerpt: "A new analysis reveals that the vast majority of corporate climate commitments lack credible transition plans.",
        author: { name: "Michael Chen", avatar: "https://i.pravatar.cc/150?u=michael", bio: "Climate researcher." },
        category: "Sustainability",
        subCategory: "Net Zero",
        image: "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?auto=format&fit=crop&q=80&w=1000",
        date: "Feb 3, 2026",
        readTime: "7 min read",
    },
];

export const EVENTS: Event[] = [
    {
        id: "iew-2026",
        title: "India Energy Week 2026",
        date: "27th – 30th January 2026",
        time: "09:00 AM",
        location: "Goa, India",
        venue: "Goa Exhibition Centre",
        status: "past",
        image: "/events/india-energy-week.png",
        url: "https://www.indiaenergyweek.com",
        mapUrl: "https://maps.google.com/?q=Goa Exhibition Centre",
        description: "India Energy Week returns as a global platform shaping India’s energy transition, convening policymakers, business leaders, innovators and investors."
    },

    {
        id: "ipsc-2026",
        title: "International Process Safety Conference 2026",
        date: "26th February 2026",
        time: "10:00 AM",
        location: "Hyatt Regency, New Delhi",
        venue: "Hyatt Regency",
        status: "upcoming",
        image: "/events/ipsc.png",
        url: "https://ipscindia.com",
        mapUrl: "https://maps.google.com/?q=Hyatt Regency New Delhi",
        description: "A pivotal conference addressing process safety, decarbonisation, digitalisation and resilience across India’s industrial ecosystem."
    },

    {
        id: "bharat-fire-2026",
        title: "Bharat Fire Safety Congress 2026",
        date: "14th – 15th May 2026",
        time: "09:30 AM",
        location: "Yashobhoomi IICC, Dwarka, New Delhi",
        venue: "Yashobhoomi IICC",
        status: "upcoming",
        image: "/events/bharat-fire.png",
        url: "https://bharatfiresafety.com",
        mapUrl: "https://maps.google.com/?q=Yashobhoomi IICC Dwarka",
        description: "A national platform advancing fire safety, emergency response and infrastructure resilience through policy, innovation and industry collaboration."
    },

    {
        id: "grpc-2026",
        title: "Global Refining & Petrochemicals Congress (GRPC) 2026",
        date: "18th – 19th June 2026",
        time: "10:00 AM",
        location: "Le Méridien, New Delhi",
        venue: "Le Méridien",
        status: "upcoming",
        image: "/events/grpc.png",
        url: "https://grpcindia.com",
        mapUrl: "https://maps.google.com/?q=Le Méridien New Delhi",
        description: "India’s premier downstream energy summit addressing refining, petrochemicals, decarbonisation and competitiveness."
    },

    {
        id: "transform-hse-2026",
        title: "Transform HSE 2026",
        date: "06th – 07th August 2026",
        time: "09:00 AM",
        location: "Hyatt Regency, New Delhi",
        venue: "Hyatt Regency",
        status: "upcoming",
        image: "/events/transform-hse.png",
        url: "https://transformhse.com",
        mapUrl: "https://maps.google.com/?q=Hyatt Regency New Delhi",
        description: "Transform HSE explores how Health, Safety and Environment strategies are evolving to support sustainability, resilience and global SDGs."
    },

    {
        id: "bharat-electricity-2026",
        title: "Bharat Electricity 2026",
        date: "01st – 03rd September 2026",
        time: "10:00 AM",
        location: "Yashobhoomi IICC, Dwarka, New Delhi",
        venue: "Yashobhoomi IICC",
        status: "upcoming",
        image: "/events/bharat-electricity.png",
        url: "https://bharatelectricity.com",
        mapUrl: "https://maps.google.com/?q=Yashobhoomi IICC Dwarka",
        description: "A flagship power sector summit bringing utilities, generators and policymakers together for India’s electricity transformation."
    },

    {
        id: "oil-spill-india-2026",
        title: "Oil Spill India 2026",
        date: "06th – 07th October 2026",
        time: "09:30 AM",
        location: "Hotel JW Marriott, Aerocity, Delhi",
        venue: "JW Marriott Aerocity",
        status: "upcoming",
        image: "/events/oil-spill.png",
        url: "https://oilspillindia.com",
        mapUrl: "https://maps.google.com/?q=JW Marriott Aerocity Delhi",
        description: "India’s leading platform on oil spill prevention, preparedness, response and restoration for maritime and industrial stakeholders."
    },

    {
        id: "energniti-2025",
        title: "EnergNiti Dialogue 2025",
        date: "15th December 2025",
        time: "10:00 AM",
        location: "New Delhi, India",
        venue: "New Delhi Conference Centre",
        status: "past",
        image: "/events/energniti.png",
        url: "https://energniti.com",
        mapUrl: "https://maps.google.com/?q=New Delhi Conference Centre",
        description: "A strategic dialogue shaping India’s energy future through policy, innovation and global collaboration."
    }
]

export const ISSUES: Issue[] = [
    {
        id: "1",
        title: "Global Energy Transition Summit 2025",
        date: "Nov 12-14, 2025",
        location: "London, UK",
        image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000"
    },
    {
        id: "2",
        title: "Future Power Grid Conference",
        date: "Dec 05, 2025",
        location: "Houston, TX",
        image: "https://images.unsplash.com/photo-1596232604084-219ee5433385?auto=format&fit=crop&q=80&w=1000"
    },
    {
        id: "3",
        title: "Renewable Finance Forum",
        date: "Jan 10, 2026",
        location: "Singapore",
        image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1000"
    }
];
