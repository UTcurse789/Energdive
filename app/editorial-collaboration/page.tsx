import { ZohoFormPage } from "@/components/sections/zoho-form-page";

const EDITORIAL_COLLABORATION_FORM_URL =
    "https://forms.zohopublic.in/itenmedia1/form/ENERGDIVEEditorialCollaborationsForm/formperma/1AeMOZCWc1aZ9_Vv4QGQ1ljU5umOM4U3EXSdeHlsMI4";

export default function EditorialCollaborationPage() {
    return (
        <ZohoFormPage
            title="Editorial Collaboration"
            description="Are you a thought leader, researcher, or policymaker? We are always looking for compelling narratives and expert analysis on the energy sector."
            formUrl={EDITORIAL_COLLABORATION_FORM_URL}
        />
    );
}
