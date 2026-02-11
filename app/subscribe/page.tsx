import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/buttons";
import { Check } from "lucide-react";

const plans = [
    {
        name: "Basic",
        price: "Free",
        description: "Essential news and daily newsletter.",
        features: ["Access to 5 articles/month", "Daily Briefing Newsletter", "Sector Overview"],
        cta: "Sign Up Free",
        highlight: false
    },
    {
        name: "Pro",
        price: "$49/mo",
        description: "Comprehensive analysis for professionals.",
        features: ["Unlimited Articles", "Weekly Industry Reports", "Data Dashboard Access", "Ad-free Experience"],
        cta: "Start 14-Day Trial",
        highlight: true
    },
    {
        name: "Enterprise",
        price: "Custom",
        description: "Full access for teams and organizations.",
        features: ["Multi-user Access", "API Access", "Custom Research Requests", "Priority Support", "White-label Reports"],
        cta: "Contact Sales",
        highlight: false
    }
];

export default function SubscribePage() {
    return (
        <div className="min-h-screen bg-background font-sans">
            <Header />

            <main className="pt-24 pb-16">
                <div className="container">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h1 className="font-serif text-4xl md:text-6xl font-black mb-6 text-primary">
                            Power Your Decisions
                        </h1>
                        <p className="text-xl text-muted-foreground">
                            Join 50,000+ energy professionals who trust EnergDive for market-moving intelligence.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {plans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`
                            border p-8 flex flex-col relative
                            ${plan.highlight ? 'border-primary bg-primary/5 shadow-lg' : 'border-border bg-white'}
                        `}
                            >
                                {plan.highlight && (
                                    <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest px-3 py-1">
                                        Most Popular
                                    </span>
                                )}

                                <h3 className="font-serif text-2xl font-bold mb-2">{plan.name}</h3>
                                <div className="text-3xl font-bold mb-4">{plan.price}</div>
                                <p className="text-muted-foreground mb-8 text-sm">{plan.description}</p>

                                <ul className="flex-1 space-y-4 mb-8">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3 text-sm">
                                            <Check className="w-5 h-5 text-primary shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    variant={plan.highlight ? "primary" : "outline"}
                                    fullWidth
                                >
                                    {plan.cta}
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 text-center border-t border-border pt-12">
                        <h3 className="font-serif text-2xl font-bold mb-8">Trusted by teams at</h3>
                        <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale">
                            {/* Logo Placeholders */}
                            {["Shell", "BP", "TotalEnergies", "Orsted", "Nextera"].map(brand => (
                                <span key={brand} className="text-xl font-black font-serif">{brand}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
