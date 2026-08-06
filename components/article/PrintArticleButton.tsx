"use client";

import { Printer } from "lucide-react";

type PrintArticleButtonProps = {
    className: string;
    iconClassName?: string;
};

/** Opens the browser's native print dialog without navigating to a print URL. */
export function PrintArticleButton({ className, iconClassName = "w-4 h-4" }: PrintArticleButtonProps) {
    return (
        <button
            type="button"
            className={`${className} print:hidden`}
            title="Print this article"
            onClick={() => window.print()}
        >
            <Printer className={iconClassName} />
            Print
        </button>
    );
}
