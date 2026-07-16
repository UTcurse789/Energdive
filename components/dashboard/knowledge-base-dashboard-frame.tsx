"use client";

export function KnowledgeBaseDashboardFrame({ children }: { children: React.ReactNode }) {

    return (
        <div className="mx-auto w-full max-w-[1600px] animate-fade-in-up">
            <section className="min-w-0">
                {children}
            </section>
        </div>
    );
}
