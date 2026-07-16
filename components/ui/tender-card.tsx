import Link from "next/link";
import Image from "next/image";
import { MoveRight } from "lucide-react";
import { DateChip } from "./date-chip";
import { TagBadge } from "./tag-badge";

export interface TenderCardProps {
    slug: string;
    title: string;
    image: string;
    excerpt: string;
    organization?: string;
    country?: string;
    tenderType?: string;
    tenderStatus?: string;
    deadline?: string;
    date: string;
    sector?: string;
    sectorSlug?: string;
}

export function TenderCard({
    slug,
    title,
    image,
    excerpt,
    organization,
    country,
    tenderType,
    tenderStatus,
    deadline,
    date,
    sector,
    sectorSlug,
}: TenderCardProps) {
    return (
        <div className="group flex flex-col border-t border-gray-100 pt-6 hover:border-black transition-all duration-500 h-full">
            <Link href={`/tenders/${slug}`} className="block relative aspect-4/3 mb-6 overflow-hidden bg-gray-100 border border-gray-100">
                <Image 
                    src={image} 
                    alt={title} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-700" 
                />
                
                {/* Status Badge overlay */}
                {tenderStatus && (
                    <div className="absolute top-3 right-3">
                        <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm rounded-sm ${tenderStatus.toLowerCase().includes('open') ? 'bg-[#00A651]' : 'bg-gray-600'}`}>
                            {tenderStatus}
                        </span>
                    </div>
                )}
            </Link>
            
            <div className="flex flex-col flex-1">
                <div className="flex justify-between items-center text-[9px] font-black uppercase text-gray-400 mb-3">
                    <div className="flex flex-wrap gap-2">
                        {sector && (
                            <span className="text-[#00A651]">{sector}</span>
                        )}
                        {country && (
                            <span>• {country}</span>
                        )}
                    </div>
                    <DateChip value={date} className="text-[9px]" />
                </div>
                
                <h4 className="font-bold text-lg leading-tight line-clamp-3 group-hover:text-[#00A651] transition-colors mb-3">
                    <Link href={`/tenders/${slug}`}>{title}</Link>
                </h4>
                
                <p className="text-sm text-gray-500 line-clamp-2 mb-4 font-serif">
                    {excerpt}
                </p>

                <div className="mt-auto flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2 text-xs border-y border-gray-100 py-3 mb-2">
                        {organization && (
                            <div className="flex flex-col">
                                <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black">Org</span>
                                <span className="font-medium text-gray-800 truncate" title={organization}>{organization}</span>
                            </div>
                        )}
                        {deadline && (
                            <div className="flex flex-col">
                                <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black">Deadline</span>
                                <span className="font-medium text-red-600 truncate">{deadline}</span>
                            </div>
                        )}
                    </div>
                    
                    <Link href={`/tenders/${slug}`} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:gap-4 transition-all text-black w-fit">
                        View Tender <MoveRight size={14} className="text-[#00A651]" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
