"""
Abstract base class for all portal scrapers.

Every government portal scraper must implement:
    - fetch()         → scrape listing + details, return complete Tender objects
    - parse()         → parse listing HTML into partial Tender objects
    - parse_detail()  → parse a single detail page HTML and enrich a Tender
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Awaitable, Callable, List, Optional

from models.tender import Tender

TenderFilter = Callable[[Tender], Awaitable[bool]]


@dataclass
class ScrapeRunMetadata:
    """Statistics from a single scrape run."""
    portal: str = ""
    started_at: Optional[str] = None
    finished_at: Optional[str] = None
    pages_processed: int = 0
    tenders_found: int = 0
    tenders_processed: int = 0
    tenders_skipped: int = 0
    detail_errors: int = 0
    pdf_downloads: int = 0
    pdf_captcha_blocks: int = 0
    duration_seconds: float = 0.0

    def start(self) -> None:
        self.started_at = datetime.now(timezone.utc).isoformat()

    def finish(self) -> None:
        self.finished_at = datetime.now(timezone.utc).isoformat()
        if self.started_at:
            start = datetime.fromisoformat(self.started_at)
            end = datetime.fromisoformat(self.finished_at)
            self.duration_seconds = round((end - start).total_seconds(), 2)

    def summary(self) -> str:
        return (
            f"Scrape complete: {self.portal} | "
            f"Pages: {self.pages_processed} | "
            f"Found: {self.tenders_found} | "
            f"Processed: {self.tenders_processed} | "
            f"Skipped: {self.tenders_skipped} | "
            f"Errors: {self.detail_errors} | "
            f"PDFs: {self.pdf_downloads} | "
            f"Captcha: {self.pdf_captcha_blocks} | "
            f"Duration: {self.duration_seconds}s"
        )


class BaseScraper(ABC):

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable scraper name."""

    @property
    @abstractmethod
    def portal_url(self) -> str:
        """Base URL of the portal being scraped."""

    @abstractmethod
    async def fetch(
        self,
        should_process: Optional[TenderFilter] = None,
    ) -> List[Tender]:
        """Scrape the portal and return fully populated Tender objects."""
        pass

    @abstractmethod
    async def parse(self, html: str) -> List[Tender]:
        """Parse listing page HTML into partial Tender objects."""
        pass

    @abstractmethod
    async def parse_detail(self, html: str, tender: Tender) -> Tender:
        """Parse a detail page HTML and enrich an existing Tender object."""
        pass
