"use client";

import { useAuth } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuthModal } from "@/hooks/use-auth-modal";

export function KnowledgeHubStartSubmissionButton() {
  const { isLoaded, isSignedIn } = useAuth();
  const { openAuthModal } = useAuthModal();

  const submitUrl = "/knowledge-hub/submit";

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isLoaded && !isSignedIn) {
      e.preventDefault();
      // Open modal and return to the submit page after login
      openAuthModal(submitUrl);
    }
  };

  return (
    <Link
      href={submitUrl}
      onClick={handleClick}
      className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3.5 text-sm font-semibold text-white transition-all hover:bg-emerald-600"
    >
      Start Submission
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

export const KnowledgeBaseStartSubmissionButton = KnowledgeHubStartSubmissionButton;
export default KnowledgeHubStartSubmissionButton;
