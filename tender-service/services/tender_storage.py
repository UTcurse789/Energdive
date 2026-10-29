"""
Storage contract for tender persistence.

Business code should depend on this interface, not on Excel directly. A future
SQLite or PostgreSQL implementation should be able to implement the same
methods without changing the scraper or application flow.
"""

from abc import ABC, abstractmethod
from typing import Any, Mapping

from models.tender import Tender


class TenderStorage(ABC):
    """Abstract persistence boundary for tender data."""

    @abstractmethod
    async def initialize(self) -> None:
        """Prepare the storage backend for reads and writes."""

    @abstractmethod
    async def tender_exists(self, reference: str) -> bool:
        """Return True when a tender reference is already stored."""

    @abstractmethod
    async def ai_analysis_completed(self, reference: str) -> bool:
        """Return True when AI processing is already complete for a tender."""

    @abstractmethod
    async def append_tender(self, tender: Tender) -> bool:
        """
        Store a new tender.

        Returns:
            True if the tender was stored, False if it already existed.
        """

    @abstractmethod
    async def update_ai_analysis(
        self,
        reference: str,
        analysis: Mapping[str, Any],
    ) -> None:
        """Create or update the AI analysis row for a tender."""

    @abstractmethod
    async def update_processing_status(
        self,
        reference: str,
        status: Mapping[str, Any],
    ) -> None:
        """Create or update processing status fields for a tender."""
