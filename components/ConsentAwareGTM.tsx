"use client";

import Script from "next/script";

interface ConsentAwareGTMProps {
    gtmId: string;
}

export default function ConsentAwareGTM({ gtmId }: ConsentAwareGTMProps) {
    const hasConsent = true;

    if (!hasConsent) return null;

    return (
        <>
            <Script id="gtm-data-layer" strategy="lazyOnload">
                {`
                    window.dataLayer = window.dataLayer || [];
                    window.dataLayer.push({
                        "gtm.start": new Date().getTime(),
                        event: "gtm.js"
                    });
                `}
            </Script>
            <Script
                id="gtm-loader"
                src={`https://www.googletagmanager.com/gtm.js?id=${gtmId}`}
                strategy="lazyOnload"
            />
            <noscript>
                <iframe
                    src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
                    height="0"
                    width="0"
                    style={{ display: "none", visibility: "hidden" }}
                />
            </noscript>
        </>
    );
}
