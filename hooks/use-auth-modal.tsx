"use client";

import React, { createContext, useContext, useState } from "react";

interface AuthModalContextType {
    isOpen: boolean;
    openAuthModal: (redirectUrl?: string) => void;
    closeAuthModal: () => void;
    redirectUrl: string | null;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

    const openAuthModal = (url?: string) => {
        setIsOpen(true);
        if (url) {
            setRedirectUrl(url);
        } else if (typeof window !== "undefined") {
            setRedirectUrl(window.location.pathname + window.location.search);
        }
    };

    const closeAuthModal = () => {
        setIsOpen(false);
        setRedirectUrl(null);
    };

    return (
        <AuthModalContext.Provider value={{ isOpen, openAuthModal, closeAuthModal, redirectUrl }}>
            {children}
        </AuthModalContext.Provider>
    );
}

export function useAuthModal() {
    const context = useContext(AuthModalContext);
    if (!context) {
        throw new Error("useAuthModal must be used within an AuthModalProvider");
    }
    return context;
}
