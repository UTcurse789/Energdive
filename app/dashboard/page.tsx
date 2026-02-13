import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { Zap, Activity, Globe, Newspaper } from "lucide-react";

export default async function DashboardPage() {
    const user = await currentUser();

    return (
        <div className="min-h-screen bg-black text-white selection:bg-[#E5B866] selection:text-black">
            <div className="container mx-auto px-6 lg:px-12 py-12">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-end border-b border-white/20 pb-8 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2 text-[#E5B866]">
                            <Zap className="fill-current" />
                            <span className="uppercase tracking-widest text-sm font-bold">EnergDive Dashboard</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
                            Hello, <span className="text-transparent bg-clip-text bg-linear-to-r from-[#E5B866] to-[#FFE0B2]">
                                {user?.firstName || "User"}
                            </span>
                        </h1>
                    </div>

                    {/* User Profile */}
                    <div className="mt-8 md:mt-0 bg-[#111] border border-white/10 p-6 rounded-2xl flex items-center gap-4">
                        <div className="bg-white/10 p-1 rounded-full">
                            <UserButton appearance={{
                                elements: {
                                    userButtonAvatarBox: "w-12 h-12"
                                }
                            }} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">{user?.fullName}</p>
                            <p className="text-xs text-gray-400">{user?.primaryEmailAddress?.emailAddress}</p>
                        </div>
                    </div>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                    {/* Market Overview Card */}
                    <div className="bg-[#111] border border-white/10 p-8 hover:border-[#E5B866]/50 transition-colors group cursor-pointer rounded-xl">
                        <div className="flex justify-between items-start mb-6">
                            <span className="p-3 bg-white/5 rounded-lg text-[#E5B866]">
                                <Activity size={24} />
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold mb-2 group-hover:text-[#E5B866] transition-colors">Market Overview</h3>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            Real-time tracking of global energy indices and commodity prices.
                        </p>
                        <span className="text-xs font-bold uppercase tracking-widest text-[#E5B866]">View Analytics →</span>
                    </div>

                    {/* Global News Card */}
                    <div className="bg-[#111] border border-white/10 p-8 hover:border-[#E5B866]/50 transition-colors group cursor-pointer rounded-xl">
                        <div className="flex justify-between items-start mb-6">
                            <span className="p-3 bg-white/5 rounded-lg text-[#E5B866]">
                                <Globe size={24} />
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold mb-2 group-hover:text-[#E5B866] transition-colors">Global News</h3>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            Curated intelligence feed from top energy markets and policy hubs.
                        </p>
                        <span className="text-xs font-bold uppercase tracking-widest text-[#E5B866]">Read Latest →</span>
                    </div>

                    {/* Reports Card */}
                    <div className="bg-[#111] border border-white/10 p-8 hover:border-[#E5B866]/50 transition-colors group cursor-pointer rounded-xl">
                        <div className="flex justify-between items-start mb-6">
                            <span className="p-3 bg-white/5 rounded-lg text-[#E5B866]">
                                <Newspaper size={24} />
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold mb-2 group-hover:text-[#E5B866] transition-colors">My Reports</h3>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            Access your saved research papers and market outlooks.
                        </p>
                        <span className="text-xs font-bold uppercase tracking-widest text-[#E5B866]">Go to Library →</span>
                    </div>

                </div>
            </div>
        </div>
    );
}
