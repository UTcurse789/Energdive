


import { Article, Event, Opinion, Issue, Video, Sector } from "@/types";


export const SECTORS: Sector[] = [
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
        date: "Feb 10, 2026",
        readTime: "5 min read",
    },
    {
        id: "6",
        title: "OPEC+ Output Cuts Extended Through Q3 as Prices Stabilise",
        slug: "opec-output-cuts-q3",
        excerpt: "The cartel agrees to maintain current production ceilings amid softening global demand signals.",
        author: { name: "Ahmed Khalil", avatar: "https://i.pravatar.cc/150?u=ahmed", bio: "MENA energy correspondent." },
        category: "Oil & Gas",
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
        category: "Transmission",
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
        category: "Distribution",
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
        category: "Power Generation",
        image: "https://images.unsplash.com/photo-1591768793355-74d04bb6608f?auto=format&fit=crop&q=80&w=1000",
        date: "Feb 5, 2026",
        readTime: "7 min read",
    },
    {
        id: "12",
        title: "Distribution Network Upgrade Slashes Outage Times by 40%",
        slug: "distribution-network-upgrade",
        excerpt: "Automated fault isolation and self-healing grid technology drastically improve reliability for rural communities.",
        author: { name: "Elena M.", avatar: "https://i.pravatar.cc/150?u=elena", bio: "Europe correspondent." },
        category: "Distribution",
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
        image: "https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?auto=format&fit=crop&q=80&w=1000",
        date: "Feb 10, 2026",
        readTime: "8 min read",
    },
    {
        id: "5",
        title: "Solar Panel Prices Drop to Historic Lows",
        slug: "solar-panel-prices-lows",
        excerpt: "Oversupply from Chinese manufacturers is driving down costs but squeezing margins for Western competitors.",
        author: { name: "Sarah Jenkings", avatar: "https://i.pravatar.cc/150?u=sarah", bio: "Senior Energy Analyst." },
        category: "Renewables",
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
        category: "Renewables",
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
        category: "Energy Storage",
        image: "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&q=80&w=1000",
        date: "Feb 4, 2026",
        readTime: "6 min read",
    },

    // ── Sustainability ───────────────────────────────────
    {
        id: "4",
        title: "Carbon Capture Technology: Essential or Distraction?",
        slug: "carbon-capture-essential-or-distraction",
        excerpt: "New report suggests CCS is critical for net-zero scenarios, but environmental groups remain skeptical.",
        author: { name: "Michael Chen", avatar: "https://i.pravatar.cc/150?u=michael", bio: "Climate policy researcher." },
        category: "Sustainability & Safety",
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
        category: "Sustainability & Safety",
        image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=1000",
        date: "Feb 7, 2026",
        readTime: "5 min read",
    },
    {
        id: "16",
        title: "ESG Reporting Standards Converge Under ISSB Framework",
        slug: "esg-reporting-issb-framework",
        excerpt: "The International Sustainability Standards Board achieves near-universal adoption across 40+ jurisdictions.",
        author: { name: "Sarah Jenkings", avatar: "https://i.pravatar.cc/150?u=sarah", bio: "Senior Analyst." },
        category: "Sustainability & Safety",
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
        category: "Sustainability & Safety",
        image: "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?auto=format&fit=crop&q=80&w=1000",
        date: "Feb 3, 2026",
        readTime: "7 min read",
    },
];

export const EVENTS: Event[] = [
    {
        id: "1",
        title: "Global Energy Transition Summit 2025",
        date: "Nov 12-14, 2025",
        location: "London, UK",
        image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000",
        url: "/events/global-energy-transition-summit-2025",
        status: "upcoming",
        time: "09:00 AM - 05:00 PM",
        venue: "ExCeL London",
        mapUrl: "https://maps.google.com/?q=ExCeL+London",
        description: "Join industry leaders to discuss the roadmap to net zero."
    },
    {
        id: "2",
        title: "Future Power Grid Conference",
        date: "Dec 05, 2025",
        location: "Houston, TX",
        image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000",
        url: "/events/future-power-grid-conference",
        status: "upcoming",
        time: "10:00 AM - 06:00 PM",
        venue: "George R. Brown Convention Center",
        mapUrl: "https://maps.google.com/?q=George+R.+Brown+Convention+Center",
        description: "Exploring the latest technologies in grid modernization."
    },
    {
        id: "3",
        title: "Renewable Finance Forum",
        date: "Jan 10, 2026",
        location: "Singapore",
        image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1000",
        url: "/events/renewable-finance-forum",
        status: "upcoming",
        time: "09:30 AM - 04:30 PM",
        venue: "Marina Bay Sands",
        mapUrl: "https://maps.google.com/?q=Marina+Bay+Sands",
        description: "Investment strategies for the renewable energy sector."
    }
];
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
        volume: "1",
        Issue: "2",
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
];

export const OPINIONS: Opinion[] = [
    {
        id: "op-1",
        title: "Building a Robust Energy System",
        category: "Strategy",
        slug: "building-robust-energy-system",
        excerpt: "India is building energy resilience, not simply replacing fuels. Security, refining flexibility, grid execution, and policy reform now shape reliable decarbonisation. The next decade demands structural choices, not marginal gains.",
        content: [{ type: "paragraph", children: [{ text: "Full opinion content..." }] }],
        author: {
            name: "Abhishek Bhatnagar",
            image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800",
            role: "Energy Strategist",
            bio: "Expert in global energy markets and infrastructure."
        },
        date: "January 20, 2026",
        featuredImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800",
    },
    {
        id: "op-2",
        title: "Our Energy Transition is Well on Course",
        slug: "energy-transition-on-course",
        excerpt: "Kerala Additional Chief Secretary Puneet Kumar argues that the state's roadmap to 100% renewable energy by 2040 is backed by concrete policy actions and investment.",
        content: [{ type: "paragraph", children: [{ text: "Full opinion content..." }] }],
        author: {
            name: "Puneet Kumar",
            image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=800",
            role: "Additional Chief Secretary (Power), Kerala"
        },
        date: "January 20, 2026",
        featuredImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=800",
    },
    {
        id: "op-3",
        title: "India did Well Globally by First Positioning Itself as an Energy Leader",
        slug: "india-energy-leader-positioning",
        excerpt: "Dr. Ajay Mathur discusses how India's strategic maneuvering in the global energy market has set the stage for its renewable leadership.",
        content: [{ type: "paragraph", children: [{ text: "Full opinion content..." }] }],
        author: {
            name: "Dr. Ajay Mathur",
            image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=800",
            role: "Director General, ISA"
        },
        date: "January 20, 2026",
        featuredImage: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=800",
    },
    {
        id: "op-4",
        title: "India's Energy Security by 2047: From Import Dependence to System Resilience",
        slug: "india-energy-security-2047",
        excerpt: "Achieving energy independence requires a paradigm shift in how we view storage, grid connectivity, and domestic manufacturing.",
        content: [{ type: "paragraph", children: [{ text: "Full opinion content..." }] }],
        author: {
            name: "Abhishek Bhatnagar",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800",
            role: "Energy Strategist"
        },
        date: "January 20, 2026",
        featuredImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800",
    }
];

export const ABOUT_DATA = {
    foreword: {
        title: "Foreword",
        content: "We stand at the precipice of the greatest industrial transformation in history. The transition from a hydrocarbon-based economy to a diversified, sustainable energy system is not merely a technical challenge—it is a geopolitical, economic, and social imperative. At Energdive, we believe that navigating this complexity requires more than just news; it demands intelligence, context, and a forward-looking perspective."
    },
    theNeed: {
        title: "The Need",
        content: "In an era of information overload, decision-makers are drowning in noise. Fragmented data, biased narratives, and short-termism obscure the long-term trends shaping the energy sector. There is a critical vacuum for deep, analytical, and data-driven journalism that bridges the gap between traditional energy sectors and the emerging green economy. We exist to fill that void."
    },
    thePublication: {
        title: "The Publication",
        content: "Energdive is a premier intelligence platform dedicated to the global energy sector. We provide actionable insights, rigourous analysis, and exclusive reporting on Oil & Gas, Power & Utilities, Renewables, and Climate Policy. Our mission is to empower leaders with the knowledge to make high-stakes decisions with confidence. We are not just observers; we are the chroniclers of the energy transition."
    }
};
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
