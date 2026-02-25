"use client";

import { Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatContentDate } from "@/lib/date";

interface DateChipProps {
    value?: string | Date | null;
    className?: string;
}

export function DateChip({ value, className }: DateChipProps) {
    const formatted = formatContentDate(value);
    if (!formatted) return null;

    return (
        <span className={cn("inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em]", className)}>
            <Clock3 size={14} className="shrink-0" />
            <span>{formatted}</span>
        </span>
    );
}

