"""
Tender Intelligence Platform entry point.

Dual-mode CLI:
    python app.py scrape   → Run the CPPP scraper + AI analysis pipeline
    python app.py serve    → Start the FastAPI server for ENERGDive integration

Default (no args): runs the scrape pipeline.
"""

import argparse
import asyncio
import sys
from typing import Optional

from config import settings
from models.tender import Tender
from scrapers.cppp_scraper import CPPPScraper
from services.ai_service import (
    AIConfigurationError,
    AIResponseValidationError,
    AIService,
    AIServiceError,
)
from services.excel_service import ExcelService
from utils.logger import get_logger

logger = get_logger("app")


# ---------------------------------------------------------------------------
# Scrape pipeline
# ---------------------------------------------------------------------------

async def run_scrape() -> None:
    """Full scrape → persist → AI analysis pipeline."""

    storage = ExcelService(settings.EXCEL_WORKBOOK_PATH)
    await storage.initialize()
    ai_service = _create_ai_service()

    async def should_process_tender(tender: Tender) -> bool:
        if not await storage.tender_exists(tender.reference):
            return True

        if not await storage.ai_analysis_completed(tender.reference):
            logger.info("Retrying pending AI analysis: %s", tender.reference)
            return True

        return False

    scraper = CPPPScraper()
    tenders = await scraper.fetch(should_process=should_process_tender)

    saved_count = 0
    skipped_count = 0
    ai_completed_count = 0
    ai_failed_count = 0

    total = len(tenders)
    for idx, tender in enumerate(tenders, 1):
        print()
        print(f"{'-' * 90}")
        print(f"  Processing [{idx}/{total}]: {tender.reference}")
        print(f"{'-' * 90}")

        if await storage.append_tender(tender):
            saved_count += 1
        else:
            skipped_count += 1
            logger.info("Tender already stored. Updating pending AI: %s", tender.reference)

        await _update_document_status(storage, tender)
        _print_tender(tender)

        ai_completed = await _analyze_and_store_tender(
            tender=tender,
            ai_service=ai_service,
            storage=storage,
        )
        if ai_completed:
            ai_completed_count += 1
        else:
            ai_failed_count += 1

    _print_summary(total, saved_count, skipped_count, ai_completed_count, ai_failed_count)


# ---------------------------------------------------------------------------
# API server
# ---------------------------------------------------------------------------

def run_server() -> None:
    """Start the FastAPI server for ENERGDive integration."""
    try:
        import uvicorn
    except ImportError:
        logger.error("uvicorn is not installed. Run: pip install uvicorn[standard]")
        sys.exit(1)

    logger.info(
        "Starting Tender Intelligence API on %s:%d",
        settings.API_HOST,
        settings.API_PORT,
    )
    print()
    print("=" * 60)
    print("  Tender Intelligence API")
    print(f"  http://{settings.API_HOST}:{settings.API_PORT}")
    print()
    print("  Endpoints:")
    print(f"    GET  /health")
    print(f"    GET  /api/v1/tenders")
    print(f"    GET  /api/v1/tenders/energy")
    print(f"    GET  /api/v1/tenders/{{reference}}")
    print(f"    GET  /api/v1/stats")
    print(f"    GET  /api/v1/export/excel")
    print(f"    POST /api/v1/scrape")
    print("=" * 60)
    print()

    uvicorn.run(
        "api.server:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=False,
        log_level="info",
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _create_ai_service() -> Optional[AIService]:
    try:
        return AIService()
    except AIConfigurationError as exc:
        logger.error("AI configuration failed: %s", exc)
        return None


async def _update_document_status(storage: ExcelService, tender: Tender) -> None:
    try:
        await storage.update_processing_status(
            tender.reference,
            {
                "downloaded": bool(tender.pdf_local_path),
                "pdf_parsed": bool(tender.extracted_text),
            },
        )
    except Exception as exc:
        logger.exception("Excel Update Failed for %s: %s", tender.reference, exc)


async def _analyze_and_store_tender(
    tender: Tender,
    ai_service: Optional[AIService],
    storage: ExcelService,
) -> bool:
    if ai_service is None:
        logger.error("AI Failed for %s: AI service is not configured.", tender.reference)
        return False

    try:
        if not tender.extracted_text:
            logger.warning(
                "No PDF text for %s. Using metadata only for AI analysis.",
                tender.reference,
            )
        logger.info("Analyzing Tender: %s", tender.reference)
        analysis = await ai_service.analyze(tender)
        logger.info("AI Analysis Completed: %s", tender.reference)
    except AIResponseValidationError as exc:
        logger.error("JSON Validation Failed for %s: %s", tender.reference, exc)
        return False
    except AIServiceError as exc:
        logger.error("AI Failed for %s: %s", tender.reference, exc)
        return False
    except Exception as exc:
        logger.exception("AI Failed for %s: %s", tender.reference, exc)
        return False

    try:
        await storage.update_ai_analysis(tender.reference, analysis.to_excel_fields())
        await storage.update_processing_status(
            tender.reference,
            {"ai_completed": True},
        )
        logger.info("Excel Updated with AI analysis: %s", tender.reference)
    except Exception as exc:
        logger.exception("Excel Update Failed for %s: %s", tender.reference, exc)
        return False

    return True


def _print_summary(
    total: int,
    saved: int,
    skipped: int,
    ai_ok: int,
    ai_fail: int,
) -> None:
    print()
    print("=" * 60)
    print("  SCRAPE PIPELINE SUMMARY")
    print("=" * 60)
    print(f"  Tenders processed  : {total}")
    print(f"  New tenders saved  : {saved}")
    print(f"  Duplicates skipped : {skipped}")
    print(f"  AI analysis done   : {ai_ok}")
    print(f"  AI analysis failed : {ai_fail}")
    print("=" * 60)
    print()
    logger.info(
        "Pipeline complete. Saved=%d, skipped=%d, ai_completed=%d, ai_failed=%d",
        saved, skipped, ai_ok, ai_fail,
    )


def _print_tender(tender: Tender) -> None:
    print()
    print(f"  Title           : {tender.title}")
    print(f"  Reference       : {tender.reference}")
    print(f"  Closing Date    : {tender.closing_date}")
    print(f"  Opening Date    : {tender.opening_date}")
    print(f"  Detail URL      : {tender.detail_url}")

    print(f"  Organisation    : {_display_value(tender.organisation)}")
    print(f"  Department      : {_display_value(tender.department)}")
    print(f"  Tender Number   : {_display_value(tender.tender_number)}")
    print(f"  Tender Category : {_display_value(tender.tender_category)}")
    print(f"  Tender Type     : {_display_value(tender.tender_type)}")
    print(f"  Published Date  : {_display_value(tender.published_date)}")
    print(f"  Tender Value    : {_display_value(tender.tender_value)}")
    print(f"  EMD             : {_display_value(tender.emd)}")
    print(f"  Tender Fee      : {_display_value(tender.tender_fee)}")
    print(f"  Description     : {_display_value(tender.description)}")
    print(f"  Location        : {_display_value(tender.location)}")
    print(f"  PDF URL         : {_display_value(tender.pdf_url)}")
    print(f"  Documents       : {_display_value(tender.supporting_documents)}")
    print(f"  PDF Local Path  : {_display_value(tender.pdf_local_path)}")
    print(f"  Extracted Text  : {_text_preview(tender)}")
    print(f"  Portal Source   : {tender.portal_source}")

    print()


def _display_value(value) -> str:
    return str(value) if value else "N/A"


def _text_preview(tender: Tender) -> str:
    if not tender.extracted_text:
        return "N/A"

    preview = tender.extracted_text[:150].replace("\n", " ")
    return f"{preview}... ({len(tender.extracted_text)} chars)"


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Tender Intelligence Platform",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python app.py scrape    Run the CPPP scraper + AI pipeline
    python app.py serve     Start the FastAPI server for ENERGDive
    python app.py           Same as 'scrape' (default)
        """,
    )
    parser.add_argument(
        "mode",
        nargs="?",
        default="scrape",
        choices=["scrape", "serve"],
        help="Run mode: 'scrape' (default) or 'serve'",
    )

    args = parser.parse_args()

    if args.mode == "serve":
        run_server()
    else:
        asyncio.run(run_scrape())


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.warning("Interrupted by user. Exiting cleanly.")
