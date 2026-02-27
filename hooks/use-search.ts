import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "use-debounce";

export interface SearchResult {
    id: string;
    title: string;
    excerpt: string;
    type: string;
    slug: string;
    date: string;
    image?: string;
}

export function useSearch() {
    const [query, setQuery] = useState("");
    const [debouncedQuery] = useDebounce(query, 300);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchResults = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);

            if (!response.ok) {
                throw new Error("Failed to fetch search results");
            }

            const data = await response.json();
            setResults(data.results || []);
        } catch (err) {
            console.error("Search error:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred");
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchResults(debouncedQuery);
    }, [debouncedQuery, fetchResults]);

    return {
        query,
        setQuery,
        results,
        isLoading,
        error,
    };
}
