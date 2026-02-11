import { SectionHeading } from "@/components/ui/section-heading";
import { EventCard } from "@/components/ui/event-card";
import { EVENTS } from "@/data/dummy";

export function EventsSection() {
    return (
        <section className="py-16 border-b border-border overflow-hidden">
            <div className="container">
                <SectionHeading title="Upcoming Events" linkText="View Calendar" linkHref="/events" />

                <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
                    {EVENTS.map((event) => (
                        <EventCard key={event.id} event={event} />
                    ))}
                    {/* Duplicate for visual effect if list is short */}
                    {EVENTS.map((event) => (
                        <EventCard key={`${event.id}-dup`} event={event} />
                    ))}
                </div>
            </div>
        </section>
    );
}
