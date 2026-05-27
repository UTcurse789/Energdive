import { ZohoFormPage } from "@/components/sections/zoho-form-page";

export default function DownloadMediaKitPage() {
    return (
        <ZohoFormPage
            title="Download Media Kit"
            description="Get official ENERGDIVE logos, media kits, and brand materials for editorial, promotional, and communications use."
            queryType="Brochure Download"
            backHref="/advertise-with-us"
            backLabel="Back To Advertise"
        />
    );
}
