import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, ArrowUpRight, Clock } from "lucide-react";
import { Event } from "@/types";

interface EventCardProps {
    event: Event | any; // Use any to allow flexibility with strapi response structure
}

export function EventCard({ event }: EventCardProps) {
    // Determine the HREF. If URL is external, use it directly.
    // If internal (e.g. /events/slug), use that.
    const href = event.url || `/events/${event.slug}`;
    const isExternal = !!event.url && event.url.startsWith('http');

    return (
        <Link
            href={href}
            target={isExternal ? "_blank" : "_self"}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="w-[320px] shrink-0 snap-start group block"
        >
            <div className="bg-white border border-slate-100 overflow-hidden hover:border-[#09B697] hover:shadow-lg hover:shadow-[rgba(9,182,151,0.08)] transition-all duration-300 relative">

                {/* Image */}
                <div className="relative h-44 w-full overflow-hidden ">
                    <Image
                        src={event.image || "/magazine-default.jpg"}
                        alt={event.title}
                        fill
                        className="object-cover p-0 transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />

                    {/* Register badge */}
                    <div className="absolute top-3 right-3 bg-[#09B697] text-white text-[10px] font-black uppercase px-3 py-1 tracking-[2px]">
                        Register ↗
                    </div>

                    {/* Date pill on image bottom */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-2.5 py-1 z-10">
                        <Calendar className="w-3 h-3 text-[#09B697]" />
                        <span className="text-[11px] font-bold text-slate-700 tracking-wide">
                            {event.date}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 relative bg-white">
                    {/* Time */}
                    {event.time && (
                        <div className="flex items-center gap-1.5 text-[10px] text-[#09B697] font-black uppercase tracking-widest mb-2">
                            <Clock className="w-3 h-3" />
                            {event.time}
                        </div>
                    )}

                    <h3 className="font-serif font-bold text-base leading-snug mb-3 text-slate-900 group-hover:text-[#09B697] transition-colors line-clamp-2 min-h-[42px]">
                        {event.title}
                    </h3>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <MapPin className="w-3 h-3 text-[#09B697]" />
                            <span className="font-medium line-clamp-1 max-w-[180px]">{event.location}</span>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-[#09B697] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" />
                    </div>
                </div>

                {/* Bottom accent line animation */}
                <div className="h-[2px] w-0 group-hover:w-full bg-[#09B697] transition-all duration-500 absolute bottom-0 left-0" />
            </div>
        </Link>
    );
}