import Link from "next/link";
import Image from "next/image";

export function Footer() {
    return (
        <footer className="bg-black text-white py-12">
            <div className="container max-w-[1200px] mx-auto px-6">

                {/* Newsletter Subscription Section */}
                <div className="text-center mb-10">
                    <h3 className="text-2xl font-serif mb-6">Newsletter Subscription</h3>
                    <Link
                        href="/subscribe"
                        className="inline-block bg-[#7D9446] hover:bg-[#6a7e3b] text-white px-8 py-2.5 rounded-md font-semibold transition-colors text-sm"
                    >
                        Sign up
                    </Link>
                </div>

                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Link href="/">
                        <Image src="/energdive-logo-white-rr.png" alt="EnergDive" width={180} height={40} className="mb-6 object-contain h-auto w-auto" />
                    </Link>
                </div>

                {/* Social Media Section */}
                <div className="text-center mb-8">
                    <p className="text-sm mb-4">Follow us on</p>
                    <div className="flex justify-center gap-6">
                        {/* Facebook */}
                        <Link href="#" className="hover:text-[#7D9446] transition-colors">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                        </Link>

                        {/* X (Twitter) */}
                        <Link href="#" className="hover:text-[#7D9446] transition-colors">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                        </Link>

                        {/* YouTube */}
                        <Link href="#" className="hover:text-[#7D9446] transition-colors">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                        </Link>

                        {/* Instagram */}
                        <Link href="#" className="hover:text-[#7D9446] transition-colors">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                            </svg>
                        </Link>

                        {/* LinkedIn */}
                        <Link href="#" className="hover:text-[#7D9446] transition-colors">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                        </Link>
                    </div>
                </div>

                {/* Footer Links */}
                <div className="text-center mb-6">
                    <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-xs">
                        <Link href="/issues" className="hover:text-[#7D9446] transition-colors uppercase tracking-wider">
                            Latest Issue
                        </Link>
                        <span className="text-white/30">|</span>
                        <Link href="/contact" className="hover:text-[#7D9446] transition-colors uppercase tracking-wider">
                            Editorial Enquiry
                        </Link>
                        <span className="text-white/30">|</span>
                        <Link href="/subscribe" className="hover:text-[#7D9446] transition-colors uppercase tracking-wider">
                            Subscription
                        </Link>
                        <span className="text-white/30">|</span>
                        <Link href="/advertise" className="hover:text-[#7D9446] transition-colors uppercase tracking-wider">
                            Advertise With Us
                        </Link>
                        <span className="text-white/30">|</span>
                        <Link href="/about" className="hover:text-[#7D9446] transition-colors uppercase tracking-wider">
                            About
                        </Link>
                        <span className="text-white/30">|</span>
                        <Link href="/privacy" className="hover:text-[#7D9446] transition-colors uppercase tracking-wider">
                            Privacy Policy
                        </Link>
                        <span className="text-white/30">|</span>
                        <Link href="/terms" className="hover:text-[#7D9446] transition-colors uppercase tracking-wider">
                            Terms & Conditions
                        </Link>
                    </div>
                </div>

                {/* Copyright */}
                <div className="text-center text-xs text-white/70">
                    <p>ENERGDIVE © {new Date().getFullYear()}. All Rights Reserved.</p>
                </div>
            </div>
        </footer>
    );
}
