"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function ZohoSalesIQ() {
    const pathname = usePathname() || "";
    const [shouldLoad, setShouldLoad] = useState(false);

    // Only show on these specific pages
    const allowedPaths = ["/energclub", "/subscribe", "/newsletter", "/contact"];
    const isAllowedPath = allowedPaths.some(path => pathname.startsWith(path));

    useEffect(() => {
        // Load the widget if screen width is 768px or greater AND it's an allowed path
        if (window.innerWidth >= 768 && isAllowedPath) {
            setShouldLoad(true);
        }
    }, [isAllowedPath]);

    return (
        <>
            {shouldLoad && (
                <>
                    <Script id="zoho-salesiq-init" strategy="lazyOnload">
                        {"window.$zoho=window.$zoho || {};$zoho.salesiq=$zoho.salesiq||{ready:function(){}}"}
                    </Script>
                    <Script
                        id="zsiqscript"
                        src="https://salesiq.zohopublic.in/widget?wc=siqe7427becac05b796f13e957c1acd50ed0f72f5df2fa22a28bf6688f5aef8ead2"
                        strategy="lazyOnload"
                    />
                </>
            )}
            {/* Fallback CSS to hide Zoho injected elements if not on allowed path or on mobile */}
            <style dangerouslySetInnerHTML={{
                __html: `
                ${!isAllowedPath ? `
                [id^="zsiq"] {
                    display: none !important;
                }
                ` : ''}

                @media (max-width: 767px) {
                    [id^="zsiq"] {
                        display: none !important;
                    }
                }
                `
            }} />
        </>
    );
}
