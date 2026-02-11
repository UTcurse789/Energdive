import { Article, Sector, Event } from "@/types";

export const SECTORS: Sector[] = [
    { title: "Oil & Gas", slug: "oil-gas" },
    { title: "Power & Utilities", slug: "power-utilities" },
    { title: "Renewables", slug: "renewables" },
    { title: "Sustainability", slug: "sustainability" },
    { title: "Climate Policy", slug: "climate-policy" },
];

export const ARTICLES: Article[] = [
    {
        id: "1",
        title: "Global Energy Demand Hits Record High Amid Supply Concerns",
        slug: "global-energy-demand-record-high",
        excerpt: "Despite renewable growth, fossil fuel consumption remains robust as emerging markets drive unprecedented demand spikes.",
        content: "Full article content here...",
        author: {
            name: "Sarah Jenkings",
            avatar: "https://i.pravatar.cc/150?u=sarah",
            bio: "Senior Energy Analyst covering APAC markets."
        },
        category: "Oil & Gas",
        image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=1000",
        date: "Oct 24, 2024",
        readTime: "5 min read",
        featured: true,
        trending: true,
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
        image: "/images/hero1.jpg",
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
    }
];

export const EVENTS: Event[] = [
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
        image: "/images/hero1.jpg"
    },
    {
        id: "3",
        title: "Renewable Finance Forum",
        date: "Jan 10, 2026",
        location: "Singapore",
        image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1000"
    }
]
