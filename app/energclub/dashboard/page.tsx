import { currentUser } from "@clerk/nextjs/server";
import { Zap, AlertTriangle, Download } from "lucide-react";

export default async function EnergClubDashboard() {
    const user = await currentUser();

    return (
        <div className="min-h-screen bg-black text-white selection:bg-[#E5B866] selection:text-black">
            <div className="container mx-auto px-6 lg:px-12 py-12">

                {/* Welcome Section */}
                <div className="flex flex-col md:flex-row justify-between items-end border-b border-white/20 pb-8 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2 text-[#E5B866]">
                            <Zap className="fill-current" />
                            <span className="uppercase tracking-widest text-sm font-bold">EnergClub Member Area</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
                            Welcome Back,<br />
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#E5B866] to-[#FFE0B2]">
                                {user?.firstName || "Member"}
                            </span>
                        </h1>
                    </div>

                    {/* Profile Widget */}
                    <div className="mt-8 md:mt-0 bg-[#111] border border-white/10 p-6 rounded-2xl flex items-center gap-4">
                        <div className="bg-white/10 p-1 rounded-full">
                            <img
                                src={user?.imageUrl || ""}
                                alt={user?.fullName || "User"}
                                className="w-12 h-12 rounded-full object-cover"
                            />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">{user?.fullName}</p>
                            <p className="text-xs text-gray-400">
                                {user?.primaryEmailAddress?.emailAddress?.startsWith("phone_")
                                    ? (user?.publicMetadata as any)?.phone || "Phone User"
                                    : user?.primaryEmailAddress?.emailAddress}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Main Content Area */}
                    <div className="md:col-span-2 space-y-8">
                        <div className="bg-[#111] border border-white/10 p-8 hover:border-[#E5B866]/50 transition-colors group cursor-pointer">
                            <div className="flex justify-between items-start mb-6">
                                <span className="px-3 py-1 bg-[#E5B866] text-black text-xs font-bold uppercase tracking-wider">Latest Report</span>
                                <Download className="text-gray-500 group-hover:text-[#E5B866] transition-colors" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4 group-hover:text-[#E5B866] transition-colors">Global Hydrogen Outlook 2026: The Critical Pivot</h3>
                            <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                Exclusive deep-dive into the hydrogen economy's shift from theoretical projects to FID. Analysis of subsidy mechanisms in EU vs US and the impact on supply chain.
                            </p>
                            <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
                                <span>PDF</span>
                                <span>•</span>
                                <span>4.2 MB</span>
                                <span>•</span>
                                <span>Released Today</span>
                            </div>
                        </div>

                        <div className="bg-[#111] border border-white/10 p-8 hover:border-[#E5B866]/50 transition-colors group cursor-pointer">
                            <div className="flex justify-between items-start mb-6">
                                <span className="px-3 py-1 bg-white/10 text-white text-xs font-bold uppercase tracking-wider">Market Alert</span>
                                <AlertTriangle className="text-[#E5B866]" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4 group-hover:text-[#E5B866] transition-colors">OPEC+ Unexpected Cut: Immediate Market Reaction</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Live analysis of the crude price spike following the Vienna meeting. What this means for Q3 forecasts and refinery margins in Asia-Pacific.
                            </p>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        <div className="bg-linear-to-br from-[#E5B866] to-[#BF9000] p-8 text-black">
                            <h4 className="font-bold uppercase tracking-widest border-b border-black/20 pb-4 mb-4">Your Membership</h4>
                            <div className="space-y-2 mb-8">
                                <div className="flex justify-between text-sm font-semibold">
                                    <span>Status</span>
                                    <span className="bg-black/20 px-2 py-0.5 rounded">ACTIVE</span>
                                </div>
                                <div className="flex justify-between text-sm font-semibold">
                                    <span>Tier</span>
                                    <span>PRO</span>
                                </div>
                                <div className="flex justify-between text-sm font-semibold">
                                    <span>Renews</span>
                                    <span>Mar 01, 2026</span>
                                </div>
                            </div>
                            <button className="w-full bg-black text-[#E5B866] py-3 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors">
                                Manage Subscription
                            </button>
                        </div>

                        <div className="bg-[#111] border border-white/10 p-6">
                            <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-6">Quick Links</h4>
                            <ul className="space-y-4">
                                {['Saved Reports', 'Analyst Calls', 'Data Export', 'Account Settings'].map(link => (
                                    <li key={link} className="flex items-center justify-between text-sm font-medium hover:text-[#E5B866] cursor-pointer transition-colors border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                        {link} <Zap size={12} className="opacity-0 hover:opacity-100" />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
