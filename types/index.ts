export interface Author {
    name: string;
    avatar: string;
    role?: string; // e.g. "Senior Energy Analyst"
    bio?: string;
}

// export interface Article {
//     id: string;
//     title: string;
//     slug: string;
//     excerpt: string;
//     content?: string;
//     author?: Author;
//     category: string;
//     subCategory?: string;
//     image: string;
//     date: string;
//     readTime: string;
//     featured?: boolean;
//     trending?: boolean;
//     downloadUrl?: string; // New field for report download
//     pdfSize?: string;     // New field for report size
// }

export interface Article {
    id: number | string;
    slug: string;
    href: string;           // full route e.g. /opinion/some-slug
    title: string;
    excerpt?: string;
    author?: { name: string } | null;
    image?: string | null;
    contentType?: string | null;   // "Opinion", "News", etc.
    sectors: string[];
    tags: string[];
}

// export interface Sector {
//     title: string;
//     slug: string;
//     description?: string;
//     heroImage?: string;
//     subSectors?: string[];
// }
export interface Section {
    title: string;
    articles: Article[];
}

export interface Event {
    id: string;
    title: string;
    date: string;
    location: string;
    image: string;
    url: string;
    // Add these new properties:
    status: 'upcoming' | 'ongoing' | 'past';
    time: string;
    venue: string;
    mapUrl: string;
    description: string;
}

export interface MarketQuote {
    symbol: string;
    name: string;
    price: number;
    changesPercentage: number;
    change: number;
}

// export interface Issue {
//     id: string;
//     title: string;
//     slug: string;
//     description: string;
//     coverImage: string;
//     date: string;
//     pdfUrl?: string;
//     month?: string;
//     year?: string;
//     volume?: string;
//     number?: string;
//     sections?: {
//         title: string;
//         articles: Article[];
//     }[];
// }

export interface Issue {
    id: number | string;
    slug: string;
    title: string;
    description: string;
    date: string;
    month: string;
    year: string;
    volume?: string;
    number?: string;
    coverImage: string;
    sections: Section[];
}

export interface Opinion {
    id: string;
    title: string;
    author: {
        name: string;
        role: string;
        image: string; // Large portrait image
        bio?: string;
    };
    date: string;
    excerpt: string;
    content: any[];
    category?: string;
    slug: string;
    featuredImage: string;
}

export interface Video {
    id: string;
    title: string;
    slug: string;
    description: string;
    youtubeId: string;
    thumbnail: string;
    date: string;
    duration: string;
    author: {
        name: string;
        role: string;
        avatar: string; // Small avatar
    };
    category: string;
    views?: string;
}
