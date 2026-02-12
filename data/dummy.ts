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


import { Article, Sector, Event, Opinion, Issue, Video } from "@/types";


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
        subCategory: "Upstream",
        image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=1000",
        date: "Feb 10, 2026",
        readTime: "5 min read",
        featured: true,
        trending: true,
        downloadUrl: "https://encis.in/report-on-the-next-frontier-advancing-hse-to-achieve-global-sdgs.html",
        pdfSize: "4.2 MB",
    },
    {
        id: "6",
        title: "OPEC+ Output Cuts Extended Through Q3 as Prices Stabilise",
        slug: "opec-output-cuts-q3",
        excerpt: "The cartel agrees to maintain current production ceilings amid softening global demand signals.",
        author: { name: "Ahmed Khalil", avatar: "https://i.pravatar.cc/150?u=ahmed", bio: "MENA energy correspondent." },
        category: "Oil & Gas",
        subCategory: "Upstream",
        image: "https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&q=80&w=1000",
        date: "Feb 8, 2026",
        readTime: "4 min read",
    },
    {
        id: "7",
        title: "US LNG Export Terminals Face New Environmental Review",
        slug: "us-lng-export-environmental-review",
        excerpt: "Federal regulators pause approvals for three Gulf Coast facilities pending updated climate impact assessments.",
        author: { name: "Sarah Jenkings", avatar: "https://i.pravatar.cc/150?u=sarah", bio: "Senior Energy Analyst." },
        category: "Oil & Gas",
        subCategory: "LNG",
        image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=1000",
        date: "Feb 6, 2026",
        readTime: "6 min read",
    },
    {
        id: "8",
        title: "Pipeline Operators Invest $12B in Midstream Digitalisation",
        slug: "pipeline-midstream-digitalisation",
        excerpt: "IoT sensors and AI-driven leak detection are transforming how crude and gas are transported across continents.",
        author: { name: "David Ross", avatar: "https://i.pravatar.cc/150?u=david", bio: "Tech editor." },
        category: "Oil & Gas",
        subCategory: "Midstream",
        image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&q=80&w=1000",
        date: "Feb 4, 2026",
        readTime: "5 min read",
    },
    {
        id: "9",
        title: "Asian Refinery Margins Surge on Tight Diesel Supply",
        slug: "asian-refinery-margins-surge",
        excerpt: "Crack spreads hit multi-year highs as seasonal demand and reduced Russian supply tighten the market.",
        author: { name: "Elena M.", avatar: "https://i.pravatar.cc/150?u=elena", bio: "Asia markets correspondent." },
        category: "Oil & Gas",
        subCategory: "Downstream",
        image: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?auto=format&fit=crop&q=80&w=1000",
        date: "Feb 2, 2026",
        readTime: "4 min read",
    },

    // ── Power & Utilities ────────────────────────────────
    {
        id: "3",
        title: "Offshore Wind Auctions See Mixed Results in Europe",
        slug: "offshore-wind-mixed-results",
        excerpt: "Supply chain bottlenecks and rising interest rates are cooling investor sentiment in the North Sea.",
        author: { name: "Elena M.", avatar: "https://i.pravatar.cc/150?u=elena", bio: "Europe correspondent." },
        category: "Power & Utilities",
        subCategory: "Transmission",
        image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&q=80&w=1000",
        date: "Feb 9, 2026",
        readTime: "4 min read",
    },
    {
        id: "10",
        title: "Smart Grid Rollout Reaches 60% of US Households",
        slug: "smart-grid-rollout-us",
        excerpt: "Advanced metering infrastructure now covers the majority of American homes, enabling real-time demand response.",
        author: { name: "Michael Chen", avatar: "https://i.pravatar.cc/150?u=michael", bio: "Infrastructure analyst." },
        category: "Power & Utilities",
        subCategory: "Smart Grid",
        image: "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&q=80&w=1000",
        date: "Feb 7, 2026",
        readTime: "5 min read",
    },
    {
        id: "11",
        title: "Nuclear Renaissance: 14 New Reactors Approved Globally",
        slug: "nuclear-renaissance-new-reactors",
        excerpt: "Small modular reactors gain momentum as governments seek reliable baseload power for decarbonisation goals.",
        author: { name: "David Ross", avatar: "https://i.pravatar.cc/150?u=david", bio: "Tech editor." },
        category: "Power & Utilities",
        subCategory: "Nuclear",
        image: "https://images.unsplash.com/photo-1591768793355-74d04bb6608f?auto=format&fit=crop&q=80&w=1000",
        date: "Feb 5, 2026",
        readTime: "7 min read",
        trending: true,
    },
    {
        id: "12",
        title: "Distribution Network Upgrade Slashes Outage Times by 40%",
        slug: "distribution-network-upgrade",
        excerpt: "Automated fault isolation and self-healing grid technology drastically improve reliability for rural communities.",
        author: { name: "Elena M.", avatar: "https://i.pravatar.cc/150?u=elena", bio: "Europe correspondent." },
        category: "Power & Utilities",
        subCategory: "Distribution",
        image: "https://images.unsplash.com/photo-1548337138-e87d889cc369?auto=format&fit=crop&q=80&w=1000",
        date: "Feb 3, 2026",
        readTime: "4 min read",
    },

    // ── New Energies ─────────────────────────────────────
    {
        id: "2",
        title: "The Future of Hydrogen: Hype vs. Reality in 2025",
        slug: "hydrogen-hype-vs-reality",
        excerpt: "Green hydrogen projects are stalling due to cost overruns. Is the dream of a hydrogen economy fading?",
        author: { name: "David Ross", avatar: "https://i.pravatar.cc/150?u=david", bio: "Tech editor specializing in clean energy innovations." },
        category: "New Energies",
        subCategory: "Hydrogen",
        image: "https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?auto=format&fit=crop&q=80&w=1000",
        date: "Feb 10, 2026",
        readTime: "8 min read",
        trending: true,
    },
    {
        id: "5",
        title: "Solar Panel Prices Drop to Historic Lows",
        slug: "solar-panel-prices-lows",
        excerpt: "Oversupply from Chinese manufacturers is driving down costs but squeezing margins for Western competitors.",
        author: { name: "Sarah Jenkings", avatar: "https://i.pravatar.cc/150?u=sarah", bio: "Senior Energy Analyst." },
        category: "New Energies",
        subCategory: "Solar",
        image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=1000",
        date: "Feb 8, 2026",
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
        title: "January 2026",
        slug: "january-2026",
        description: "Exploring the global shift towards net-zero emissions and the technologies driving this transition.",
        coverImage: "/magazine-default.jpg",
        date: "Jan 2026",
        month: "January",
        year: "2026",
        pdfUrl: "#",
        volume: "105",
        number: "1",
        sections: [
            {
                title: "Essays",
                articles: [
                    {
                        id: "101",
                        title: "The Geopolitics of Green Energy",
                        slug: "geopolitics-green-energy",
                        excerpt: "How the shift to renewables is reshaping global power dynamics.",
                        author: { name: "Dr. Aris Vlahos", avatar: "", bio: "" },
                        category: "Essay",
                        image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&q=80&w=400",
                        date: "Jan 10, 2026",
                        readTime: "12 min read"
                    },
                    {
                        id: "102",
                        title: "Beyond the Grid",
                        slug: "beyond-the-grid",
                        excerpt: "Decentralised power systems are the future of resilience.",
                        author: { name: "Sarah Jenkings", avatar: "", bio: "" },
                        category: "Essay",
                        image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=400",
                        date: "Jan 12, 2026",
                        readTime: "8 min read"
                    }
                ]
            },
            {
                title: "Review & Response",
                articles: [
                    {
                        id: "103",
                        title: "Carbon Markets 2.0",
                        slug: "carbon-markets-2",
                        excerpt: "A critique of the new voluntary carbon credit standards.",
                        author: { name: "Michael Chen", avatar: "", bio: "" },
                        category: "Review",
                        image: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?auto=format&fit=crop&q=80&w=400",
                        date: "Jan 15, 2026",
                        readTime: "6 min read"
                    }
                ]
            },
            {
                title: "Letters to the Editor",
                articles: [
                    {
                        id: "104",
                        title: "On Nuclear Safety",
                        slug: "on-nuclear-safety",
                        excerpt: "Response to last month's cover story on SMR safety protocols.",
                        author: { name: "Elena M.", avatar: "", bio: "" },
                        category: "Letter",
                        image: "https://images.unsplash.com/photo-1591768793355-74d04bb6608f?auto=format&fit=crop&q=80&w=400",
                        date: "Jan 18, 2026",
                        readTime: "3 min read"
                    }
                ]
            }
        ]
    },
    {
        id: "2",
        title: "December 2025",
        slug: "december-2025",
        description: "Is nuclear energy making a comeback? We dive deep into SMRs and the future of baseload power.",
        coverImage: "/current-magazine.jpg",
        date: "Dec 2025",
        month: "December",
        year: "2025",
        pdfUrl: "#",
        volume: "104",
        number: "12",
    },
];

export const OPINIONS: Opinion[] = [
    {
        id: "op-1",
        title: "Building a Robust Energy System",
        category: "Strategy",
        slug: "building-robust-energy-system",
        excerpt: "India is building energy resilience, not simply replacing fuels. Security, refining flexibility, grid execution, and policy reform now shape reliable decarbonisation. The next decade demands structural choices, not marginal gains.",
        content: "Full opinion content...",
        author: {
            name: "Abhishek Bhatnagar",
            image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800",
            role: "Energy Strategist",
            bio: "Expert in global energy markets and infrastructure."
        },
        date: "January 20, 2026",
    },
    {
        id: "op-2",
        title: "Our Energy Transition is Well on Course",
        slug: "energy-transition-on-course",
        excerpt: "Kerala Additional Chief Secretary Puneet Kumar argues that the state's roadmap to 100% renewable energy by 2040 is backed by concrete policy actions and investment.",
        content: "Full opinion content...",
        author: {
            name: "Puneet Kumar",
            image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=800",
            role: "Additional Chief Secretary (Power), Kerala"
        },
        date: "January 20, 2026",
    },
    {
        id: "op-3",
        title: "India did Well Globally by First Positioning Itself as an Energy Leader",
        slug: "india-energy-leader-positioning",
        excerpt: "Dr. Ajay Mathur discusses how India's strategic maneuvering in the global energy market has set the stage for its renewable leadership.",
        content: "Full opinion content...",
        author: {
            name: "Dr. Ajay Mathur",
            image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=800",
            role: "Director General, ISA"
        },
        date: "January 20, 2026",
    },
    {
        id: "op-4",
        title: "India's Energy Security by 2047: From Import Dependence to System Resilience",
        slug: "india-energy-security-2047",
        excerpt: "Achieving energy independence requires a paradigm shift in how we view storage, grid connectivity, and domestic manufacturing.",
        content: "Full opinion content...",
        author: {
            name: "Abhishek Bhatnagar",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800",
            role: "Energy Strategist"
        },
        date: "January 20, 2026",
    }
];

export const VIDEOS: Video[] = [
    {
        id: "v-1",
        title: "The Future of Green Hydrogen: Challenges & Opportunities",
        slug: "future-of-green-hydrogen",
        description: "An in-depth look at how green hydrogen is poised to revolutionize the energy sector, from transportation to heavy industry.",
        youtubeId: "dQw4w9WgXcQ", // Placeholder ID
        thumbnail: "https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?auto=format&fit=crop&q=80&w=1000",
        date: "Feb 10, 2026",
        duration: "12:45",
        author: {
            name: "Dr. Aris Vlahos",
            role: "Energy Analyst",
            avatar: "https://i.pravatar.cc/150?u=aris"
        },
        category: "New Energies",
        views: "1.2K views"
    },
    {
        id: "v-2",
        title: "Global Energy Transition Summit 2025 Highlights",
        slug: "energy-transition-summit-2025",
        description: "Key takeaways and panel discussions from the biggest energy event of the year.",
        youtubeId: "Rlskemjd79U", // Placeholder ID
        thumbnail: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000",
        date: "Nov 15, 2025",
        duration: "45:20",
        author: {
            name: "EnergDive Team",
            role: "Editorial",
            avatar: "https://i.pravatar.cc/150?u=energdive"
        },
        category: "Events",
        views: "5.4K views"
    },
    {
        id: "v-3",
        title: "Understanding Carbon Markets",
        slug: "understanding-carbon-markets",
        description: "A beginner's guide to how carbon credits work and their impact on global emissions.",
        youtubeId: "dQw4w9WgXcQ", // Placeholder ID
        thumbnail: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=1000",
        date: "Jan 05, 2026",
        duration: "08:30",
        author: {
            name: "Sarah Jenkings",
            role: "Senior Analyst",
            avatar: "https://i.pravatar.cc/150?u=sarah"
        },
        category: "Sustainability",
        views: "3.1K views"
    },
    {
        id: "v-4",
        title: "Offshore Wind: The Next Frontier",
        slug: "offshore-wind-next-frontier",
        description: "Exploring the engineering marvels of offshore wind farms in the North Sea.",
        youtubeId: "dQw4w9WgXcQ", // Placeholder ID
        thumbnail: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&q=80&w=1000",
        date: "Dec 12, 2025",
        duration: "15:10",
        author: {
            name: "Elena M.",
            role: "Europe Correspondent",
            avatar: "https://i.pravatar.cc/150?u=elena"
        },
        category: "Power & Utilities",
        views: "2.8K views"
    }
];
