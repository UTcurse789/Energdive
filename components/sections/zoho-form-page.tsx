import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface ZohoFormPageProps {
    title: string;
    description: string;
    queryType?: string;
    formUrl?: string;
    backHref?: string;
    backLabel?: string;
}

const ZOHO_FORM_BASE =
    "https://forms.zohopublic.in/itenmedia1/form/ENERGDIVEEnquiriesForm/formperma/vGdZ0noLDdoGdPS8QIhuH69flKMawpU27Ws-TttbC1A";

export function ZohoFormPage({
    title,
    description,
    queryType,
    formUrl = ZOHO_FORM_BASE,
    backHref,
    backLabel,
}: ZohoFormPageProps) {
    const srcUrl = new URL(formUrl);

    if (queryType) {
        srcUrl.searchParams.set("QueryType", queryType);
    }

    const formSrc = srcUrl.toString();

    return (
        <div className="min-h-screen bg-[#F7F9FB] text-zinc-900 selection:bg-[#00A651]/30 pb-32 md:pb-48 lg:pb-64 flex flex-col gap-16 md:gap-24 lg:gap-32">
            <section className="relative h-[150px] sm:h-[200px] md:h-[260px] lg:h-[300px] overflow-hidden shrink-0">
                <Image
                    src="/advertise-breadrumb.jpg"
                    alt="ENERGDIVE background"
                    fill
                    priority
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-zinc-900/45" />
            </section>

            <section className="container mx-auto px-4 sm:px-6 lg:px-12 relative z-10 flex-grow">
                <div className="mx-auto max-w-5xl rounded-[28px] border border-zinc-200 bg-white p-6 sm:p-8 md:p-12 shadow-[0_20px_60px_rgba(2,6,23,0.08)]">
                    {backHref && backLabel ? (
                        <Link
                            href={backHref}
                            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-500 transition-colors hover:border-[#00A651]/30 hover:text-[#00A651]"
                        >
                            <ArrowLeft size={14} />
                            {backLabel}
                        </Link>
                    ) : null}

                    <h1 className="mt-6 text-3xl sm:text-4xl md:text-5xl font-black leading-tight text-zinc-900">
                        {title}
                    </h1>
                    <p className="mt-4 max-w-3xl text-base sm:text-lg text-zinc-500 leading-relaxed">
                        {description}
                    </p>

                    <div className="mt-8 rounded-2xl border border-zinc-200 overflow-hidden bg-white">
                        <iframe
                            title={title}
                            src={formSrc}
                            className="w-full h-[980px] sm:h-[980px] md:h-[1050px] lg:h-[1220px]"
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}
