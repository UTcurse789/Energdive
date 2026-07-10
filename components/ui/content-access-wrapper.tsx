"use client";

import { useAuth } from "@clerk/nextjs";
import { useAuthModal } from "@/hooks/use-auth-modal";
import { usePathname } from "next/navigation";

interface ContentAccessWrapperProps {
  isPremium?: boolean;
  requiresLogin?: boolean;
  children: React.ReactNode;
}

export function ContentAccessWrapper({ isPremium = false, requiresLogin = false, children }: ContentAccessWrapperProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { openAuthModal } = useAuthModal();
  const pathname = usePathname();

  // If content is completely public
  if (!isPremium && !requiresLogin) {
    return <>{children}</>;
  }

  // If loading auth state, show a loading skeleton
  if (!isLoaded) {
    return (
      <div className="animate-pulse flex flex-col space-y-4 my-8">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  // If the user is signed in and it's NOT premium (only requires login)
  if (isSignedIn && !isPremium) {
    return <>{children}</>;
  }

  // At this point, either:
  // 1. User is not signed in (needs to login/register)
  // 2. User IS signed in, but the content is PREMIUM (needs to pay)

  return (
    <div className="relative my-10 border-2 border-[#00A651] rounded-xl p-2 bg-white">
      <div className="bg-slate-50 rounded-lg p-8 md:p-12 text-center flex flex-col items-center justify-center">
        
        <h3 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight uppercase">
          ENERGDIVE <span className="text-[#00A651] italic font-serif tracking-normal lowercase">Insider</span>
        </h3>
        
        <p className="text-lg md:text-xl font-bold text-slate-700 mb-4">
          Where clean energy's most influential leaders get their intelligence
        </p>

        <p className="text-slate-500 max-w-2xl mb-10 leading-relaxed">
          Exclusive reporting, market intelligence, and insider access that shapes billion-dollar decisions in renewable energy and clean technology.
        </p>

        <div className="flex flex-col items-center gap-4">
          {!isSignedIn ? (
            <>
              <p className="text-slate-600 text-lg">
                Already have an account?{" "}
                <button
                  onClick={() => openAuthModal(pathname)}
                  className="text-[#00A651] font-bold hover:underline"
                >
                  Sign In
                </button>
              </p>
              <button
                onClick={() => openAuthModal(pathname)}
                className="text-[#00A651] font-bold text-lg hover:underline mt-2"
              >
                Register for free
              </button>
            </>
          ) : (
            <>
              <p className="text-slate-600 text-lg font-medium">
                You need a premium subscription to access this content.
              </p>
              <button
                onClick={() => alert("Payment gateway integration pending.")}
                className="bg-[#00A651] text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-emerald-600 transition-colors mt-2 shadow-lg shadow-[#00A651]/20"
              >
                Upgrade to Premium
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
