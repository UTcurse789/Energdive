"use client";

import Script from "next/script";

export default function ZohoSalesIQ() {
    return (
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
    );
}
