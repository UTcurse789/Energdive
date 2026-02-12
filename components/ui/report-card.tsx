// components/ReportCard.tsx
import { motion } from "framer-motion";
import { ArrowRight, Clock, User } from "lucide-react";

interface Report {
    image: string;
    title: string;
    category: string;
    date: string;
    excerpt: string;
    author: string;
    readTime: string;
}

export const ReportCard = ({ report }: { report: Report }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        whileHover={{ y: -10 }}
        className="group relative flex flex-col bg-[#1A1A1A] border border-white/5 overflow-hidden transition-all duration-500 hover:border-[#00C6A7]/40 hover:shadow-[0_0_30px_rgba(0,198,167,0.1)]"
    >
        {/* Image Container */}
        <div className="relative aspect-16/10 overflow-hidden">
            <img
                src={report.image}
                alt={report.title}
                className="object-cover w-full h-full grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
            />
            <div className="absolute top-4 left-4">
                <span className="bg-[#00C6A7] text-[#0F0F0F] text-[9px] font-black px-3 py-1 uppercase tracking-widest">
                    {report.category}
                </span>
            </div>
        </div>

        {/* Content Area */}
        <div className="p-6 flex flex-col flex-1">
            <span className="text-[#B3B3B3] text-[10px] font-bold uppercase tracking-widest mb-3">
                {report.date}
            </span>
            <h3 className="text-xl font-bold text-white leading-tight mb-3 group-hover:text-[#00C6A7] transition-colors line-clamp-2">
                {report.title}
            </h3>
            <p className="text-[#B3B3B3]/70 text-sm line-clamp-1 mb-6 font-light">
                {report.excerpt}
            </p>

            <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase font-medium">
                    <User size={12} className="text-[#00C6A7]" /> {report.author}
                    <span className="mx-1">•</span>
                    <Clock size={12} /> {report.readTime}
                </div>
                <ArrowRight size={16} className="text-[#00C6A7] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
            </div>
        </div>
    </motion.div>
);