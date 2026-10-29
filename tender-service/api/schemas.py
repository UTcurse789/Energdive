"""
Pydantic response and request schemas for the Tender API.
"""

from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


class DocumentMetadata(BaseModel):
    name: str
    description: Optional[str] = None
    size_kb: Optional[str] = None
    download_url: Optional[str] = None


class TenderBase(BaseModel):
    """Core tender fields from the Raw_Tenders sheet & CPPP portal."""
    reference: str
    tender_id: Optional[str] = None
    title: Optional[str] = None
    organisation: Optional[str] = None
    department: Optional[str] = None
    tender_number: Optional[str] = None
    tender_category: Optional[str] = None
    tender_type: Optional[str] = None
    form_of_contract: Optional[str] = None
    withdrawal_allowed: Optional[str] = None
    no_of_covers: Optional[str] = None
    payment_mode: Optional[str] = None
    
    # Financial fields
    tender_value: Optional[str] = None
    emd: Optional[str] = None
    emd_exemption: Optional[str] = None
    emd_fee_type: Optional[str] = None
    tender_fee: Optional[str] = None
    fee_payable_to: Optional[str] = None
    fee_payable_at: Optional[str] = None
    
    # Work item specifications
    description: Optional[str] = None
    product_category: Optional[str] = None
    sub_category: Optional[str] = None
    contract_type: Optional[str] = None
    bid_validity_days: Optional[str] = None
    period_of_work_days: Optional[str] = None
    location: Optional[str] = None
    pincode: Optional[str] = None
    pre_qualification: Optional[str] = None

    # Chronological Critical Dates
    published_date: Optional[str] = None
    doc_download_start_date: Optional[str] = None
    doc_download_end_date: Optional[str] = None
    clarification_start_date: Optional[str] = None
    clarification_end_date: Optional[str] = None
    bid_submission_start_date: Optional[str] = None
    bid_submission_end_date: Optional[str] = None
    closing_date: Optional[str] = None
    opening_date: Optional[str] = None
    pre_bid_meeting_date: Optional[str] = None
    pre_bid_meeting_place: Optional[str] = None
    bid_opening_place: Optional[str] = None

    # Authority
    inviting_authority_name: Optional[str] = None
    inviting_authority_address: Optional[str] = None

    # Documents
    pdf_url: Optional[str] = None
    pdf_path: Optional[str] = None
    supporting_documents: Optional[list[str]] = None
    documents_metadata: Optional[list[dict[str, Any]]] = None


class AIAnalysis(BaseModel):
    """AI analysis fields from the AI_Analysis sheet."""
    is_energy_related: Optional[bool] = None
    energy_sector: Optional[str] = None
    headline: Optional[str] = None
    summary: Optional[str] = None
    seo_title: Optional[str] = None
    meta_description: Optional[str] = None
    slug: Optional[str] = None
    keywords: Optional[list[str]] = None
    tags: Optional[list[str]] = None
    importance_score: Optional[int] = None
    publish_recommendation: Optional[str] = None
    why_it_matters: Optional[str] = None
    industry_impact: Optional[str] = None
    companies_interested: Optional[list[str]] = None
    eligibility: Optional[str] = None
    required_documents: Optional[str] = None
    important_dates: Optional[str] = None
    risk_level: Optional[str] = None
    estimated_value: Optional[str] = None
    key_scopes: Optional[list[str]] = None


class ProcessingStatus(BaseModel):
    """Processing pipeline status from the Processing_Status sheet."""
    downloaded: Optional[bool] = None
    pdf_parsed: Optional[bool] = None
    ai_completed: Optional[bool] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class TenderResponse(BaseModel):
    """Full tender response combining all three sheets."""
    tender: TenderBase
    ai_analysis: Optional[AIAnalysis] = None
    processing_status: Optional[ProcessingStatus] = None


class TenderListResponse(BaseModel):
    """Paginated list of tenders."""
    tenders: list[TenderResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class SectorCount(BaseModel):
    """Count of tenders per energy sector."""
    sector: str
    count: int


class StatsResponse(BaseModel):
    """Dashboard statistics."""
    total_tenders: int
    energy_related: int
    non_energy: int
    ai_completed: int
    ai_pending: int
    pdfs_downloaded: int
    sector_breakdown: list[SectorCount]


class ScrapeJobResponse(BaseModel):
    """Response for scrape trigger."""
    status: str
    message: str
    tenders_found: int = 0
    tenders_saved: int = 0
    ai_completed: int = 0
    ai_failed: int = 0


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    excel_path: str
    excel_exists: bool
