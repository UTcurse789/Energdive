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
