"""
Tender model — the core data structure for the entire platform.
Enriched with all CPPP Government portal fields.
"""

from dataclasses import dataclass, field
from typing import Optional, Any


@dataclass
class TenderDocumentItem:
    doc_name: str
    doc_type: str = "NIT Document"
    description: Optional[str] = None
    size_kb: Optional[str] = None
    download_url: Optional[str] = None


@dataclass
class Tender:
    """Represents a single government tender with all extracted metadata."""

    # --- Listing fields ---
    title: str
    reference: str
    closing_date: str
    opening_date: str
    detail_url: str

    # --- Basic Details ---
    tender_id: Optional[str] = None
    organisation: Optional[str] = None
    department: Optional[str] = None
    tender_number: Optional[str] = None
    tender_category: Optional[str] = None
    tender_type: Optional[str] = None
    form_of_contract: Optional[str] = None
    withdrawal_allowed: Optional[str] = None
    no_of_covers: Optional[str] = None
    payment_mode: Optional[str] = None

    # --- Financial & Fee Details ---
    tender_value: Optional[str] = None
    emd: Optional[str] = None
    emd_exemption: Optional[str] = None
    emd_fee_type: Optional[str] = None
    tender_fee: Optional[str] = None
    fee_payable_to: Optional[str] = None
    fee_payable_at: Optional[str] = None

    # --- Work Item Details ---
    description: Optional[str] = None
    product_category: Optional[str] = None
    sub_category: Optional[str] = None
    contract_type: Optional[str] = None
    bid_validity_days: Optional[str] = None
    period_of_work_days: Optional[str] = None
    location: Optional[str] = None
    pincode: Optional[str] = None
    pre_qualification: Optional[str] = None

    # --- Critical Dates (Chronological) ---
    published_date: Optional[str] = None
    doc_download_start_date: Optional[str] = None
    doc_download_end_date: Optional[str] = None
    clarification_start_date: Optional[str] = None
    clarification_end_date: Optional[str] = None
    bid_submission_start_date: Optional[str] = None
    bid_submission_end_date: Optional[str] = None
    pre_bid_meeting_date: Optional[str] = None
    pre_bid_meeting_place: Optional[str] = None
    bid_opening_place: Optional[str] = None

    # --- Inviting Authority ---
    inviting_authority_name: Optional[str] = None
    inviting_authority_address: Optional[str] = None

    # --- Documents ---
    pdf_url: Optional[str] = None
    supporting_documents: list[str] = field(default_factory=list)
    documents_metadata: list[dict[str, Any]] = field(default_factory=list)

    # --- PDF & Extraction fields ---
    pdf_local_path: Optional[str] = None
    extracted_text: Optional[str] = None

    # --- Integration fields ---
    scraped_at: Optional[str] = None
    portal_source: str = "CPPP"

    def to_dict(self) -> dict:
        """Serialize to dictionary for JSON API responses."""
        return {
            "title": self.title,
            "reference": self.reference,
            "tender_id": self.tender_id,
            "closing_date": self.closing_date,
            "opening_date": self.opening_date,
            "detail_url": self.detail_url,
            "organisation": self.organisation,
            "department": self.department,
            "tender_number": self.tender_number,
            "tender_category": self.tender_category,
            "tender_type": self.tender_type,
            "form_of_contract": self.form_of_contract,
            "withdrawal_allowed": self.withdrawal_allowed,
            "no_of_covers": self.no_of_covers,
            "payment_mode": self.payment_mode,
            "published_date": self.published_date,
            "doc_download_start_date": self.doc_download_start_date,
            "doc_download_end_date": self.doc_download_end_date,
            "clarification_start_date": self.clarification_start_date,
            "clarification_end_date": self.clarification_end_date,
            "bid_submission_start_date": self.bid_submission_start_date,
            "bid_submission_end_date": self.bid_submission_end_date,
            "pre_bid_meeting_date": self.pre_bid_meeting_date,
            "pre_bid_meeting_place": self.pre_bid_meeting_place,
            "bid_opening_place": self.bid_opening_place,
            "tender_value": self.tender_value,
            "emd": self.emd,
            "emd_exemption": self.emd_exemption,
            "emd_fee_type": self.emd_fee_type,
            "tender_fee": self.tender_fee,
            "fee_payable_to": self.fee_payable_to,
            "fee_payable_at": self.fee_payable_at,
            "description": self.description,
            "product_category": self.product_category,
            "sub_category": self.sub_category,
            "contract_type": self.contract_type,
            "bid_validity_days": self.bid_validity_days,
            "period_of_work_days": self.period_of_work_days,
            "location": self.location,
            "pincode": self.pincode,
            "pre_qualification": self.pre_qualification,
            "inviting_authority_name": self.inviting_authority_name,
            "inviting_authority_address": self.inviting_authority_address,
            "pdf_url": self.pdf_url,
            "supporting_documents": self.supporting_documents,
            "documents_metadata": self.documents_metadata,
            "pdf_local_path": self.pdf_local_path,
            "extracted_text": self.extracted_text[:200] if self.extracted_text else None,
            "scraped_at": self.scraped_at,
            "portal_source": self.portal_source,
        }