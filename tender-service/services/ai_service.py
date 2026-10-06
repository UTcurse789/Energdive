"""
AI intelligence service for tender analysis.

The scraper produces facts. This service interprets those facts into a strict
editorial intelligence JSON shape without coupling OpenAI-specific code to the
scraping pipeline.
"""

from __future__ import annotations

import asyncio
import json
from typing import Any, Optional

import httpx
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from config import settings
from models.tender import Tender
from utils.logger import get_logger

logger = get_logger(__name__)


ENERGY_SECTORS = [
    "Solar",
    "Wind",
    "Hydrogen",
    "Battery",
    "Thermal",
    "Transmission",
    "Distribution",
    "Power",
    "Grid",
    "Hydro",
    "Oil",
    "Gas",
    "Coal",
    "Nuclear",
    "EV",
    "Smart Grid",
    "Energy Storage",
]


class AIServiceError(RuntimeError):
    """Base error raised by the AI intelligence layer."""


class AIConfigurationError(AIServiceError):
    """Raised when required AI configuration is missing."""


class AIResponseValidationError(AIServiceError):
    """Raised when the model response fails strict validation."""


class TenderAIAnalysis(BaseModel):
    """Validated structured intelligence generated for one tender."""

    model_config = ConfigDict(extra="forbid")

    is_energy_related: bool
    energy_sector: Optional[str]
    headline: Optional[str]
    summary: Optional[str]
    seo_title: Optional[str]
    meta_description: Optional[str]
    slug: Optional[str]
    keywords: Optional[list[str]]
    tags: Optional[list[str]]
    importance_score: Optional[int] = Field(..., ge=1, le=10)
    publish_recommendation: Optional[str]
    why_it_matters: Optional[str]
    industry_impact: Optional[str]
    companies_interested: Optional[list[str]]
    eligibility: Optional[str]
    required_documents: Optional[str]
    important_dates: Optional[str]
    risk_level: Optional[str]

    def to_excel_fields(self) -> dict[str, Any]:
        """Map validated intelligence fields to the AI Analysis sheet."""
        return {
            "is_energy_related": self.is_energy_related,
            "energy_sector": self.energy_sector,
            "headline": self.headline,
            "summary": self.summary,
            "seo_title": self.seo_title,
            "meta_description": self.meta_description,
            "slug": self.slug,
            "keywords": self.keywords,
            "tags": self.tags,
            "importance_score": self.importance_score,
            "publish_recommendation": self.publish_recommendation,
            "why_it_matters": self.why_it_matters,
            "industry_impact": self.industry_impact,
            "companies_interested": self.companies_interested,
            "eligibility": self.eligibility,
            "required_documents": self.required_documents,
            "important_dates": self.important_dates,
            "risk_level": self.risk_level,
        }


class AIService:
    """Analyze complete Tender objects with OpenAI and return validated JSON."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        timeout_seconds: Optional[int] = None,
        max_pdf_chars: Optional[int] = None,
    ) -> None:
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model or settings.OPENAI_MODEL
        self.timeout_seconds = timeout_seconds or settings.OPENAI_TIMEOUT_SECONDS
        self.max_pdf_chars = max_pdf_chars or settings.AI_MAX_PDF_CHARS
        self.responses_url = settings.OPENAI_RESPONSES_URL

        if not self.api_key:
            raise AIConfigurationError("OPENAI_API_KEY is not configured.")

    async def analyze(self, tender: Tender) -> TenderAIAnalysis:
        """
        Analyze a complete tender and return structured intelligence.

        Uses httpx for true async HTTP without blocking the event loop.
        Retries with exponential backoff on transient failures.
        """
        payload = self._build_payload(tender)
        response_json = await self._call_openai(payload)
        output_text = self._extract_output_text(response_json)
        return self._validate_output(output_text)

    def _build_payload(self, tender: Tender) -> dict[str, Any]:
        return {
            "model": self.model,
            "input": [
                {
                    "role": "system",
                    "content": self._system_prompt(),
                },
                {
                    "role": "user",
                    "content": self._user_prompt(tender),
                },
            ],
            "text": {
                "format": {
                    "type": "json_schema",
                    "name": "tender_intelligence_analysis",
                    "schema": self._response_schema(),
                    "strict": True,
                }
            },
            "max_output_tokens": settings.OPENAI_MAX_OUTPUT_TOKENS,
        }

    async def _call_openai(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Call OpenAI with async httpx and exponential backoff retry."""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        max_retries = settings.OPENAI_MAX_RETRIES
        base_delay = settings.OPENAI_RETRY_BASE_DELAY
        last_error: Exception | None = None

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            for attempt in range(1, max_retries + 1):
                try:
                    response = await client.post(
                        self.responses_url,
                        headers=headers,
                        json=payload,
                    )

                    if response.status_code >= 500:
                        last_error = AIServiceError(
                            f"OpenAI server error {response.status_code}: {response.text[:300]}"
                        )
                        logger.warning(
                            "OpenAI returned %d (attempt %d/%d)",
                            response.status_code, attempt, max_retries,
                        )
                    elif response.status_code == 429:
                        last_error = AIServiceError("OpenAI rate limit exceeded.")
                        logger.warning(
                            "Rate limited by OpenAI (attempt %d/%d)",
                            attempt, max_retries,
                        )
                    elif response.status_code >= 400:
                        raise AIServiceError(
                            f"OpenAI request failed with status {response.status_code}: "
                            f"{response.text[:500]}"
                        )
                    else:
                        # Success — log token usage if available
                        try:
                            data = response.json()
                            usage = data.get("usage", {})
                            if usage:
                                output_tokens = usage.get("output_tokens", 0)
                                logger.info(
                                    "OpenAI tokens — input: %s, output: %s, total: %s",
                                    usage.get("input_tokens", "?"),
                                    output_tokens,
                                    usage.get("total_tokens", "?"),
                                )
                                # Detect truncated output
                                if isinstance(output_tokens, int) and output_tokens >= settings.OPENAI_MAX_OUTPUT_TOKENS - 10:
                                    logger.warning(
                                        "Output likely truncated: %d tokens used of %d max. "
                                        "Increase OPENAI_MAX_OUTPUT_TOKENS in settings.",
                                        output_tokens,
                                        settings.OPENAI_MAX_OUTPUT_TOKENS,
                                    )

                            # Check response-level status for incomplete
                            status = data.get("status")
                            if status and status != "completed":
                                logger.warning("OpenAI response status: %s", status)

                            return data
                        except ValueError as exc:
                            raise AIServiceError("OpenAI returned a non-JSON response.") from exc

                except httpx.TimeoutException as exc:
                    last_error = AIServiceError(f"OpenAI request timed out: {exc}")
                    logger.warning(
                        "OpenAI request timed out (attempt %d/%d)",
                        attempt, max_retries,
                    )
                except httpx.RequestError as exc:
                    last_error = AIServiceError(f"OpenAI request failed: {exc}")
                    logger.warning(
                        "OpenAI request error (attempt %d/%d): %s",
                        attempt, max_retries, exc,
                    )
                except AIServiceError:
                    raise

                if attempt < max_retries:
                    delay = base_delay * (2 ** (attempt - 1))
                    logger.info("Retrying OpenAI in %.1fs...", delay)
                    await asyncio.sleep(delay)

        raise last_error or AIServiceError("OpenAI request failed after all retries.")

    @staticmethod
    def _extract_output_text(response_json: dict[str, Any]) -> str:
        logger.debug("OpenAI response keys: %s", list(response_json.keys()))

        # Path 1: top-level convenience field
        direct_text = response_json.get("output_text")
        if isinstance(direct_text, str) and direct_text.strip():
            return direct_text

        # Path 2: nested output[].content[].text
        text_parts: list[str] = []
        for output_item in response_json.get("output", []):
            for content_item in output_item.get("content", []):
                content_type = content_item.get("type", "")
                if content_type in ("output_text", "text"):
                    text = content_item.get("text")
                    if isinstance(text, str):
                        text_parts.append(text)

            # Path 3: message-level text field
            if not text_parts:
                msg_text = output_item.get("text")
                if isinstance(msg_text, str) and msg_text.strip():
                    text_parts.append(msg_text)

        # Path 4: choices array (Chat Completions format fallback)
        if not text_parts:
            for choice in response_json.get("choices", []):
                message = choice.get("message", {})
                content = message.get("content")
                if isinstance(content, str) and content.strip():
                    text_parts.append(content)

        output_text = "".join(text_parts).strip()
        if not output_text:
            # Log structure to help debug
            logger.error(
                "Could not extract output text. Response keys: %s, "
                "output items: %d, status: %s",
                list(response_json.keys()),
                len(response_json.get("output", [])),
                response_json.get("status", "unknown"),
            )
            raise AIResponseValidationError(
                "OpenAI response did not include output text. "
                "This may be caused by output truncation — try increasing OPENAI_MAX_OUTPUT_TOKENS."
            )

        return output_text

    @staticmethod
    def _validate_output(output_text: str) -> TenderAIAnalysis:
        try:
            payload = json.loads(output_text)
        except json.JSONDecodeError as exc:
            raise AIResponseValidationError("AI output was not valid JSON.") from exc

        try:
            analysis = TenderAIAnalysis.model_validate(payload)
        except ValidationError as exc:
            raise AIResponseValidationError("AI output did not match schema.") from exc

        if analysis.energy_sector and analysis.energy_sector not in ENERGY_SECTORS:
            raise AIResponseValidationError(
                f"Unsupported energy sector returned: {analysis.energy_sector}"
            )

        if not analysis.is_energy_related and analysis.energy_sector is not None:
            raise AIResponseValidationError(
                "energy_sector must be null when is_energy_related is false."
            )

        return analysis

    @staticmethod
    def _system_prompt() -> str:
        sectors = ", ".join(ENERGY_SECTORS)
        return (
            "You are an AI editor for ENERGDive's government tender intelligence "
            "platform. Analyze tenders only from the supplied metadata and PDF text. "
            "Do not use outside knowledge. Do not invent companies, eligibility, "
            "dates, risks, or impact. If a fact is not available in the provided "
            "material, return null for that field. Always return exactly the JSON "
            "schema requested by the API.\n\n"
            "First classify whether the tender belongs to the energy industry. "
            f"Supported energy sectors are: {sectors}. If the tender is not energy "
            "related, set is_energy_related to false, energy_sector to null, and "
            "avoid creating publish-ready editorial claims. Keep all unavailable "
            "fields null."
        )

    def _user_prompt(self, tender: Tender) -> str:
        metadata = {
            "title": tender.title,
            "reference": tender.reference,
            "closing_date": tender.closing_date,
            "opening_date": tender.opening_date,
            "detail_url": tender.detail_url,
            "organisation": tender.organisation,
            "department": tender.department,
            "tender_number": tender.tender_number,
            "tender_category": tender.tender_category,
            "tender_type": tender.tender_type,
            "published_date": tender.published_date,
            "tender_value": tender.tender_value,
            "emd": tender.emd,
            "tender_fee": tender.tender_fee,
            "description": tender.description,
            "location": tender.location,
            "pdf_url": tender.pdf_url,
            "supporting_documents": tender.supporting_documents,
            "pdf_local_path": tender.pdf_local_path,
        }

        pdf_text = tender.extracted_text or ""
        truncated_pdf_text = pdf_text[: self.max_pdf_chars]
        was_truncated = len(pdf_text) > self.max_pdf_chars

        return (
            "Analyze this tender for ENERGDive editorial processing.\n\n"
            "Rules:\n"
            "- Return structured JSON only.\n"
            "- Use null for unavailable facts.\n"
            "- Do not infer eligibility, required documents, interested companies, "
            "or dates unless they appear in metadata or PDF text.\n"
            "- keywords and tags must be arrays of short strings or null.\n"
            "- importance_score must be an integer from 1 to 10, or null if there "
            "is not enough information.\n"
            "- risk_level must be Low, Medium, High, or null.\n"
            "- slug must be lowercase, URL-safe, and based only on the headline.\n\n"
            f"Tender metadata JSON:\n{json.dumps(metadata, ensure_ascii=False, indent=2)}\n\n"
            f"PDF text truncated: {was_truncated}\n"
            f"PDF text character limit used: {self.max_pdf_chars}\n\n"
            f"Extracted PDF text:\n{truncated_pdf_text}"
        )

    @staticmethod
    def _response_schema() -> dict[str, Any]:
        nullable_string = {"anyOf": [{"type": "string"}, {"type": "null"}]}
        nullable_string_array = {
            "anyOf": [
                {"type": "array", "items": {"type": "string"}},
                {"type": "null"},
            ]
        }

        return {
            "type": "object",
            "properties": {
                "is_energy_related": {"type": "boolean"},
                "energy_sector": {
                    "anyOf": [
                        {"type": "string", "enum": ENERGY_SECTORS},
                        {"type": "null"},
                    ]
                },
                "headline": nullable_string,
                "summary": nullable_string,
                "seo_title": nullable_string,
                "meta_description": nullable_string,
                "slug": nullable_string,
                "keywords": nullable_string_array,
                "tags": nullable_string_array,
                "importance_score": {
                    "anyOf": [
                        {"type": "integer"},
                        {"type": "null"},
                    ]
                },
                "publish_recommendation": nullable_string,
                "why_it_matters": nullable_string,
                "industry_impact": nullable_string,
                "companies_interested": nullable_string_array,
                "eligibility": nullable_string,
                "required_documents": nullable_string,
                "important_dates": nullable_string,
                "risk_level": {
                    "anyOf": [
                        {"type": "string", "enum": ["Low", "Medium", "High"]},
                        {"type": "null"},
                    ]
                },
            },
            "required": [
                "is_energy_related",
                "energy_sector",
                "headline",
                "summary",
                "seo_title",
                "meta_description",
                "slug",
                "keywords",
                "tags",
                "importance_score",
                "publish_recommendation",
                "why_it_matters",
                "industry_impact",
                "companies_interested",
                "eligibility",
                "required_documents",
                "important_dates",
                "risk_level",
            ],
            "additionalProperties": False,
        }
