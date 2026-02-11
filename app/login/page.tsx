import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/buttons";
import Link from "next/link";

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-background font-sans flex flex-col">
            <Header />

            <main className="flex-1 flex items-center justify-center py-24 bg-muted/20">
                <div className="w-full max-w-md bg-white p-8 border border-border shadow-sm">
                    <div className="text-center mb-8">
                        <h1 className="font-serif text-3xl font-bold mb-2">Welcome Back</h1>
                        <p className="text-sm text-muted-foreground">Sign in to access your dashboard</p>
                    </div>

                    <form className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Email Address</label>
                            <input type="email" className="w-full p-2 border border-input focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Password</label>
                            <input type="password" className="w-full p-2 border border-input focus:outline-none focus:border-primary" />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded" />
                                <span>Remember me</span>
                            </label>
                            <Link href="#" className="text-primary hover:underline">Forgot password?</Link>
                        </div>

                        <Button fullWidth size="lg">Sign In</Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-muted-foreground">Don't have an account? </span>
                        <Link href="/register" className="font-bold text-primary hover:underline">Register now</Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
