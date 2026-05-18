"use client";

import posthog from "posthog-js";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/buttons";

interface ReportDownloadButtonProps {
    downloadUrl: string;
    reportTitle: string;
    reportSlug: string;
}

export function ReportDownloadButton({ downloadUrl, reportTitle, reportSlug }: ReportDownloadButtonProps) {
    const handleClick = () => {
        posthog.capture("report_download_clicked", {
            report_title: reportTitle,
            report_slug: reportSlug,
            download_url: downloadUrl,
        });
    };

    return (
        <a href={downloadUrl} target="_blank" rel="noopener" className="block" onClick={handleClick}>
            <Button className="w-full bg-[#00A651] hover:bg-[#008c44] text-white text-[10px] font-black uppercase py-7 rounded-2xl transition-all">
                Download PDF
                <Download className="w-4 h-4 ml-2" />
            </Button>
        </a>
    );
}
