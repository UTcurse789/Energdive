"""
PDF Text Extraction Service.

Responsible for reading a PDF file from a local path and
extracting its text using PyMuPDF (fitz).
"""

import asyncio
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import fitz  # PyMuPDF

from utils.logger import get_logger

logger = get_logger(__name__)


@dataclass
class PDFMetadata:
    """Metadata extracted alongside text content."""
    page_count: int = 0
    file_size_bytes: int = 0
    char_count: int = 0
    is_scanned: bool = False


class PDFService:
    """Service to handle PDF processing and text extraction."""

    @staticmethod
    def extract_text_from_pdf(pdf_path: str) -> str:
        """
        Read text from all pages of the given PDF file.

        Args:
            pdf_path: Local path to the PDF file.

        Returns:
            Extracted text content as a single string.
        """
        path = Path(pdf_path).resolve()
        logger.info("Opening PDF: %s", path)

        if not path.exists():
            raise FileNotFoundError(path)

        text_content = []

        try:
            with fitz.open(path) as doc:
                for page in doc:
                    page_text = page.get_text()
                    if page_text:
                        text_content.append(page_text)
        except Exception as e:
            logger.error("Failed to extract text from %s: %s", path, e)
            raise e

        full_text = "\n".join(text_content)
        logger.info("Extracted %d characters from %s", len(full_text), path)
        return full_text

    @staticmethod
    async def extract_text_async(pdf_path: str) -> str:
        """Async wrapper — runs PDF extraction in a thread to avoid blocking the event loop."""
        return await asyncio.to_thread(PDFService.extract_text_from_pdf, pdf_path)

    @staticmethod
    def extract_with_metadata(pdf_path: str) -> tuple[str, PDFMetadata]:
        """
        Extract text and metadata from a PDF file.

        Returns:
            Tuple of (extracted_text, metadata).
        """
        path = Path(pdf_path).resolve()
        logger.info("Opening PDF with metadata extraction: %s", path)

        if not path.exists():
            raise FileNotFoundError(path)

        meta = PDFMetadata()
        meta.file_size_bytes = os.path.getsize(path)
        text_content = []
        pages_with_text = 0

        try:
            with fitz.open(path) as doc:
                meta.page_count = len(doc)
                for page in doc:
                    page_text = page.get_text()
                    if page_text and page_text.strip():
                        text_content.append(page_text)
                        pages_with_text += 1
        except Exception as e:
            logger.error("Failed to extract text from %s: %s", path, e)
            raise e

        full_text = "\n".join(text_content)
        meta.char_count = len(full_text)

        # If less than 10% of pages have text, likely scanned
        if meta.page_count > 0 and pages_with_text / meta.page_count < 0.1:
            meta.is_scanned = True
            logger.warning(
                "PDF appears to be scanned/image-only: %s (%d/%d pages with text)",
                path, pages_with_text, meta.page_count,
            )

        logger.info(
            "Extracted %d chars from %d pages (%d KB) — %s",
            meta.char_count, meta.page_count,
            meta.file_size_bytes // 1024, path,
        )
        return full_text, meta

    @staticmethod
    async def extract_with_metadata_async(pdf_path: str) -> tuple[str, PDFMetadata]:
        """Async wrapper for extract_with_metadata."""
        return await asyncio.to_thread(PDFService.extract_with_metadata, pdf_path)
