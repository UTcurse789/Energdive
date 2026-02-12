export interface Author {
    name: string;
    avatar: string;
    bio?: string;
}

export interface Article {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content?: string;
    author?: Author;
    category: string;
    subCategory?: string;
    image: string;
    date: string;
    readTime: string;
    featured?: boolean;
    trending?: boolean;
    downloadUrl?: string; // New field for report download
    pdfSize?: string;     // New field for report size
}

export interface Sector {
    title: string;
    slug: string;
    description?: string;
    heroImage?: string;
    subSectors?: string[];
}

export interface Event {
    id: string;
    title: string;
    date: string;
    location: string;
    image: string;
}

export interface MarketQuote {
    symbol: string;
    name: string;
    price: number;
    changesPercentage: number;
    change: number;
}

export interface Issue {
    id: string;
    title: string;
    slug: string;
    description: string;
    coverImage: string;
    date: string;
    pdfUrl?: string;
    month?: string;
    year?: string;
    volume?: string;
    number?: string;
    sections?: {
        title: string;
        articles: Article[];
    }[];
}
