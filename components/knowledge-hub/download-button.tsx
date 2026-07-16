"use client";

import { useAuth } from "@clerk/nextjs";
import { Download } from "lucide-react";
import Link from "next/link";
import { useAuthModal } from "@/hooks/use-auth-modal";

export function KnowledgeHubDownloadButton({ 
  slug 
}: { 
  slug: string 
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const { openAuthModal } = useAuthModal();

  const downloadUrl = `/knowledge-hub/abstract/${slug}/download`;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isLoaded && !isSignedIn) {
      e.preventDefault();
      // Open modal and return to the download API route after login
      openAuthModal(downloadUrl);
    }
  };

  return (
    <Link
      href={downloadUrl}
      onClick={handleClick}
      className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-6 py-4 text-[15px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg"
    >
      <Download className="h-[18px] w-[18px] transition-transform group-hover:translate-y-0.5" />
      Save & Download
    </Link>
  );
}

export const KnowledgeBaseDownloadButton = KnowledgeHubDownloadButton;
export default KnowledgeHubDownloadButton;
