import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/buttons";
import Link from "next/link";

export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-background font-sans flex flex-col">
            <Header />

            <main className="flex-1 flex items-center justify-center py-24 bg-muted/20">
                <div className="w-full max-w-md bg-white p-8 border border-border shadow-sm">
                    <div className="text-center mb-8">
                        <h1 className="font-serif text-3xl font-bold mb-2">Create Account</h1>
                        <p className="text-sm text-muted-foreground">Join the professional energy community</p>
                    </div>

                    <form className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">First Name</label>
                                <input type="text" className="w-full p-2 border border-input focus:outline-none focus:border-primary" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Last Name</label>
                                <input type="text" className="w-full p-2 border border-input focus:outline-none focus:border-primary" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Work Email</label>
                            <input type="email" className="w-full p-2 border border-input focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Password</label>
                            <input type="password" className="w-full p-2 border border-input focus:outline-none focus:border-primary" />
                        </div>

                        <Button fullWidth size="lg">Create Account</Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-muted-foreground">Already have an account? </span>
                        <Link href="/login" className="font-bold text-primary hover:underline">Sign in</Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
