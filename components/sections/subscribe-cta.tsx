import { Button } from "@/components/ui/buttons";

export function SubscribeCTA() {
    return (
        <section className="bg-primary text-primary-foreground py-16">
            <div className="container text-center">
                <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4">
                    Empower Your Decisions
                </h2>
                <p className="text-accent max-w-2xl mx-auto mb-8 text-lg">
                    Get exclusive access to in-depth analysis, market data, and expert opinion from the leading voice in energy.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button variant="secondary" size="lg">
                        Start Free Trial
                    </Button>
                    <Button variant="ghost" className="text-white border-white hover:bg-white/10" size="lg">
                        View Enterprise Plans
                    </Button>
                </div>
                <p className="mt-4 text-xs opacity-70">
                    No credit card required for 14-day trial. Cancel anytime.
                </p>
            </div>
        </section>
    );
}
