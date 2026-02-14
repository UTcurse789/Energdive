"use client";

import Image from "next/image";
import { Calendar, MapPin, Users, Info } from "lucide-react";

const EVENTS = [
    {
        id: "1",
        title: "India Energy Week 2026",
        date: "Jan 27-30, 2026",
        location: "Goa, India",
        registrants: "5000+ registered",
        type: "In-Person Conference",
        description: "Now in its 4th edition, India Energy Week will take place in Goa, under the patronage of India's Ministry of Petroleum and Natural Gas. As India strengthens its role at the heart of the global energy transformation...",
        tags: ["Policy", "Networking", "Exhibition"],
        image: "/energclub.png" // Placeholder, in real app use real event images
    },
    {
        id: "2",
        title: "International Process Safety Conference 2026",
        date: "Feb 12-14, 2026",
        location: "New Delhi, India",
        registrants: "1200+ registered",
        type: "Conference",
        description: "The seventh edition of the International Process Safety Conference (INPSC) convenes at a pivotal moment—when India's energy and process industries are not just growing, but transforming...",
        tags: ["Safety", "Industry", "Best Practices"],
        image: "/energclub.png"
    }
];

export default function EventsPage() {
    return (
        <div className="animate-fade-in-up">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Events</h1>
                <p className="text-gray-500">Webinars, digital dialogues, and industry conferences</p>
            </div>

            <div className="space-y-6">
                {EVENTS.map((event) => (
                    <div key={event.id} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:border-[--dash-accent-dim] transition-colors">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Thumbnail */}
                            <div className="w-full md:w-48 h-32 bg-gray-200 rounded-lg flex items-center justify-center shrink-0">
                                {/* Using placeholder div if no image, or Next/Image */}
                                <div className="text-gray-400 font-bold text-xs uppercase tracking-wider">Event Image</div>
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                                        {event.type}
                                    </span>
                                    <div className="flex gap-2">
                                        {event.tags.map(tag => (
                                            <span key={tag} className="border border-gray-200 text-gray-500 text-[10px] px-1.5 py-0.5 rounded">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-3">{event.title}</h3>
                                <p className="text-sm text-gray-500 mb-4 leading-relaxed line-clamp-2">
                                    {event.description}
                                </p>

                                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-6">
                                    <span className="flex items-center gap-1.5 font-medium"><Calendar size={16} className="text-[--dash-accent]" /> {event.date}</span>
                                    <span className="flex items-center gap-1.5"><MapPin size={16} /> {event.location}</span>
                                    <span className="flex items-center gap-1.5"><Users size={16} /> {event.registrants}</span>
                                </div>

                                <div className="flex gap-3">
                                    <button className="bg-[--dash-accent] hover:bg-[--dash-accent-hover] text-white px-6 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">
                                        Register Now
                                    </button>
                                    <button className="border border-gray-200 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-lg text-sm font-bold transition-colors">
                                        Learn More
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
