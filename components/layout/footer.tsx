import Link from "next/link";
import { Button } from "@/components/ui/buttons";
import { SECTORS } from "@/data/dummy";

export function Footer() {
    return (
        <footer className="bg-foreground text-background pt-16 pb-8 border-t border-white/10">
            <div className="container">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">

                    {/* Brand & Newsletter */}
                    <div className="md:col-span-4 space-y-6">
                        <Link href="/" className="inline-block">
                            <span className="font-serif text-3xl font-black tracking-tight text-white">
                                EnergDive<span className="text-accent text-4xl">.</span>
                            </span>
                        </Link>
                        <p className="text-background/70 text-sm leading-relaxed max-w-sm">
                            The leading source for energy market intelligence, policy analysis, and technological innovation. Providing the insights decision-makers need.
                        </p>

                        <div className="pt-4">
                            <h4 className="font-bold text-white mb-2">Stay Informed</h4>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="bg-white/5 border border-white/20 text-white px-4 py-2 text-sm w-full focus:outline-none focus:border-accent"
                                />
                                <Button variant="primary">Join</Button>
                            </div>
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div className="md:col-span-2">
                        <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Sectors</h4>
                        <ul className="space-y-3">
                            {SECTORS.map((sector) => (
                                <li key={sector.slug}>
                                    <Link href={`/sectors/${sector.slug}`} className="text-background/70 hover:text-accent text-sm transition-colors">
                                        {sector.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="md:col-span-2">
                        <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Company</h4>
                        <ul className="space-y-3">
                            {["About Us", "Careers", "Contact", "Advertise", "Press"].map((item) => (
                                <li key={item}>
                                    <Link href="#" className="text-background/70 hover:text-accent text-sm transition-colors">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="md:col-span-2">
                        <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Resources</h4>
                        <ul className="space-y-3">
                            {["Reports", "Whitepapers", "Events", "Webinars", "API Access"].map((item) => (
                                <li key={item}>
                                    <Link href="#" className="text-background/70 hover:text-accent text-sm transition-colors">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="md:col-span-2">
                        <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Legal</h4>
                        <ul className="space-y-3">
                            {["Privacy Policy", "Terms of Service", "Cookie Policy", "Accessibility"].map((item) => (
                                <li key={item}>
                                    <Link href="#" className="text-background/70 hover:text-accent text-sm transition-colors">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-background/50 text-xs">
                        © {new Date().getFullYear()} EnergDive Media Group. All rights reserved.
                    </p>
                    <div className="flex gap-4">
                        {/* Social Icons Placeholder */}
                        {["Twitter", "LinkedIn", "Facebook"].map((social) => (
                            <span key={social} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-background/50 hover:bg-accent hover:text-primary transition-colors cursor-pointer text-xs">
                                {social[0]}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
