/**
 * Data Provenance Types & Constants
 *
 * Centralizes all provenance-related type definitions, consent version
 * tracking, and helper utilities for DPDP compliance.
 */

// ── Source types ─────────────────────────────────────────────────────────────
export type DataSource = "show_form" | "ad_lead" | "backstage" | "trade_india";
export type OptInMethod = "checkbox" | "double_optin" | "api";
export type ConsentPurpose = "registration" | "marketing" | "analytics" | "data_sharing";

// ── Current consent version ──────────────────────────────────────────────────
export const CURRENT_CONSENT_VERSION = "v2.1_T&C_Mar2026";

// ── Consent text snapshot (exact text shown to users) ────────────────────────
export const CONSENT_TEXT_PORTAL =
    "I agree to EnergyClub's Terms of Service and Privacy Policy. " +
    "I consent to the collection and processing of my personal data as described " +
    "in the Privacy Policy for registration, communication, and service delivery purposes.";

export const CONSENT_TEXT_AD_LEAD =
    "By submitting this form, I agree to EnergyClub's Terms of Service and Privacy Policy. " +
    "I consent to being contacted by EnergyClub regarding energy industry insights and services.";

export const CONSENT_TEXT_THIRD_PARTY =
    "I consent to the transfer and processing of my personal data by EnergyClub " +
    "as per the applicable Data Processing Agreement. I understand my data was sourced " +
    "from a third-party platform and I may withdraw consent at any time.";

// ── DPA reference mapping ────────────────────────────────────────────────────
const DPA_REFERENCES: Record<string, string> = {
    backstage: "Backstage_DPA_Ref_456",
    trade_india: "TradeIndia_Agreement_789",
};

export function getThirdPartyAgreementRef(source: string): string | undefined {
    return DPA_REFERENCES[source];
}

// ── Map internal source values to DataSource ─────────────────────────────────
export function resolveDataSource(source: string | null | undefined): DataSource {
    switch (source) {
        case "zoho_form":
            return "ad_lead";
        case "website":
        case "show_form":
            return "show_form";
        case "backstage":
            return "backstage";
        case "trade_india":
            return "trade_india";
        default:
            return "show_form";
    }
}

// ── Get the consent text for a given source ──────────────────────────────────
export function getConsentText(source: DataSource): string {
    switch (source) {
        case "show_form":
            return CONSENT_TEXT_PORTAL;
        case "ad_lead":
            return CONSENT_TEXT_AD_LEAD;
        case "backstage":
        case "trade_india":
            return CONSENT_TEXT_THIRD_PARTY;
        default:
            return CONSENT_TEXT_PORTAL;
    }
}

// ── Get the opt-in method for a given source ─────────────────────────────────
export function getOptInMethod(source: DataSource): OptInMethod {
    switch (source) {
        case "show_form":
            return "checkbox";
        case "ad_lead":
            return "double_optin";
        case "backstage":
        case "trade_india":
            return "api";
        default:
            return "checkbox";
    }
}
