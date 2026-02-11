import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";

import { Event } from "@/types";

interface EventCardProps {
    event: Event;
}

export function EventCard({ event }: EventCardProps) {
    return (
        <div className="w-[300px] shrink-0 bg-white border border-border group overflow-hidden">
            <div className="relative h-40 w-full overflow-hidden">
                <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                    Register
                </div>
            </div>

            <div className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Calendar className="w-3 h-3" />
                    <span>{event.date}</span>
                </div>

                <h3 className="font-serif font-bold text-lg mb-2 leading-tight group-hover:text-primary transition-colors">
                    {event.title}
                </h3>

                <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-3 mt-3">
                    <MapPin className="w-3 h-3" />
                    <span>{event.location}</span>
                </div>
            </div>
        </div>
    );
}
