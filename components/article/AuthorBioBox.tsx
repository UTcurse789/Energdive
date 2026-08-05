import Image from "next/image";
import Link from "next/link";
import { Linkedin, Twitter, Mail, Award, CheckCircle2 } from "lucide-react";
import { slugify } from "@/lib/utils";

interface AuthorBioBoxProps {
    author: {
        name: string;
        avatar: string | null;
        bio?: string;
        role?: string;
        linkedinUrl?: string;
        twitterUrl?: string;
        email?: string;
    };
}

export function AuthorBioBox({ author }: AuthorBioBoxProps) {
    if (!author || !author.name) return null;

    const authorSlug = slugify(author.name);

    return (
        <div className="my-12 rounded-2xl bg-zinc-50 border border-zinc-100 p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start shadow-sm">
            {/* Avatar */}
            <Link href={`/author/${authorSlug}`} className="shrink-0 relative group">
                {author.avatar ? (
                    <div className="relative w-20 h-20 rounded-full overflow-hidden ring-4 ring-white shadow-md">
                        <Image
                            src={author.avatar}
                            alt={author.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                ) : (
                    <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-serif font-bold text-3xl ring-4 ring-white shadow-md">
                        {author.name.charAt(0)}
                    </div>
                )}
                {/* Verified Badge */}
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm" title="Verified Author">
                    <CheckCircle2 className="w-5 h-5 text-teal-500" fill="currentColor" stroke="white" />
                </div>
            </Link>

            {/* Content */}
            <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                        <h4 className="font-serif text-xl font-bold text-gray-900 group">
                            <Link href={`/author/${authorSlug}`} className="hover:text-teal-600 transition-colors">
                                {author.name}
                            </Link>
                        </h4>
                        <p className="text-sm font-medium text-teal-600 flex items-center gap-1.5 mt-1">
                            <Award className="w-4 h-4" />
                            {author.role || "Energy Market Analyst"}
                        </p>
                    </div>

                    {/* Social Links */}
                    <div className="flex items-center gap-2">
                        {author.linkedinUrl && (
                            <a href={author.linkedinUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-[#0A66C2] hover:bg-blue-50 rounded-full transition-colors" title="LinkedIn">
                                <Linkedin className="w-4 h-4" />
                            </a>
                        )}
                        {author.twitterUrl && (
                            <a href={author.twitterUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-[#1DA1F2] hover:bg-blue-50 rounded-full transition-colors" title="Twitter">
                                <Twitter className="w-4 h-4" />
                            </a>
                        )}
                        {author.email && (
                            <a href={`mailto:${author.email}`} className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors" title="Email">
                                <Mail className="w-4 h-4" />
                            </a>
                        )}
                    </div>
                </div>

                <p className="text-gray-600 text-sm leading-relaxed">
                    {author.bio || `${author.name} is a leading expert in the energy sector, providing in-depth analysis and reporting on market trends, policy changes, and technological innovations.`}
                </p>

                <div className="mt-4 pt-4 border-t border-zinc-200/60">
                    <Link href={`/author/${authorSlug}`} className="text-xs font-bold text-gray-900 uppercase tracking-widest hover:text-teal-600 transition-colors inline-flex items-center gap-1">
                        View all articles by {author.name} <span aria-hidden="true">&rarr;</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
