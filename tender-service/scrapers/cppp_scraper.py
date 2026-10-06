"""
CPP Portal (eprocure.gov.in) scraper.

Handles the session-based navigation required by the Tapestry framework.
The browser session (cookies) must be maintained from listing → detail pages.

Detail page structure (discovered via debug HTML):
    - Labels: <td class="td_caption">
    - Values: <td class="td_field">
    - Sections: Basic Details, Payment Instruments, Covers, Tender Fee,
                EMD Fee, Work Item Details, Critical Dates, Tender Documents,
                Tender Inviting Authority
    - Document links: <a id="docDownoad"> for NIT PDFs
"""

import asyncio
import os
from datetime import datetime, timezone
from typing import Any, List, Optional

from playwright.async_api import (
    Error as PlaywrightError,
    TimeoutError as PlaywrightTimeoutError,
    async_playwright,
    Page,
)
from selectolax.parser import HTMLParser, Node

from scrapers.base_scraper import BaseScraper, ScrapeRunMetadata, TenderFilter
from models.tender import Tender
from config import settings
from utils.logger import get_logger

logger = get_logger(__name__)

# Directory to save debug HTML (only first run, for selector development)
DEBUG_HTML_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "debug_html")


class CPPPScraper(BaseScraper):
    """Scraper for the Central Public Procurement Portal."""

    @property
    def name(self) -> str:
        return "CPPP (eprocure.gov.in)"

    @property
    def portal_url(self) -> str:
        return settings.BASE_URL

    async def fetch(
        self,
        should_process: Optional[TenderFilter] = None,
    ) -> List[Tender]:
        """
        Full scraping pipeline with pagination:
        1. Open listing page (establishes session cookies)
        2. Parse listing into partial Tender objects
        3. Navigate pagination to collect tenders from all pages
        4. For each tender, navigate to its detail URL (same browser context)
        5. Parse detail page and enrich the Tender object
        """

        meta = ScrapeRunMetadata(portal=self.name)
        meta.start()

        async with async_playwright() as p:

            browser = await p.chromium.launch(
                headless=settings.HEADLESS,
            )

            try:
                page = await browser.new_page()
                page.set_default_timeout(settings.PAGE_TIMEOUT_MS)
                page.set_default_navigation_timeout(settings.NAVIGATION_TIMEOUT_MS)

                # --- Step 1: Fetch listing page (establishes session) ---
                logger.info("Navigating to CPP Portal listing page...")

                await self._goto_with_retry(
                    page,
                    settings.LISTING_URL,
                    "CPP Portal listing page",
                )

                # --- Step 2: Collect tenders across pages ---
                all_tenders: List[Tender] = []
                current_page = 1
                max_pages = settings.MAX_PAGES

                while current_page <= max_pages:
                    listing_html = await page.content()
                    page_tenders = await self.parse(listing_html)

                    if not page_tenders:
                        logger.info("No tenders found on page %d. Stopping pagination.", current_page)
                        break

                    all_tenders.extend(page_tenders)
                    meta.pages_processed += 1

                    logger.info(
                        "Page %d: found %d tenders (total so far: %d)",
                        current_page,
                        len(page_tenders),
                        len(all_tenders),
                    )

                    # Try to navigate to next page
                    has_next = await self._goto_next_page(page, current_page)
                    if not has_next:
                        logger.info("No more pages available after page %d.", current_page)
                        break

                    current_page += 1
                    await asyncio.sleep(settings.DETAIL_PAGE_DELAY_MS / 1000)

                meta.tenders_found = len(all_tenders)
                logger.info("Total tenders found across %d pages: %d", meta.pages_processed, len(all_tenders))

                processed_tenders: List[Tender] = []

                # --- Step 3: Visit each detail page via goto (same session) ---
                for index, tender in enumerate(all_tenders):

                    if should_process is not None:
                        should_continue = await should_process(tender)
                        if not should_continue:
                            logger.info(
                                "Skipping duplicate tender before detail processing: %s",
                                tender.reference,
                            )
                            meta.tenders_skipped += 1
                            continue

                    logger.info(
                        "[%d/%d] Fetching details: %s",
                        index + 1,
                        len(all_tenders),
                        tender.title[:80],
                    )

                    try:
                        await self._fetch_detail(page, tender, index, meta)
                        tender.scraped_at = datetime.now(timezone.utc).isoformat()
                    except asyncio.CancelledError:
                        raise
                    except (PlaywrightTimeoutError, PlaywrightError) as e:
                        logger.error(
                            "Failed to fetch details for '%s': %s",
                            tender.reference,
                            str(e),
                        )
                        meta.detail_errors += 1
                    except Exception as e:
                        logger.exception(
                            "Unexpected error while fetching details for '%s': %s",
                            tender.reference,
                            str(e),
                        )
                        meta.detail_errors += 1

                    # Polite delay between requests
                    await asyncio.sleep(settings.DETAIL_PAGE_DELAY_MS / 1000)
                    processed_tenders.append(tender)
                    meta.tenders_processed += 1

                meta.finish()
                logger.info(meta.summary())

                return processed_tenders
            finally:
                try:
                    await browser.close()
                except PlaywrightError as exc:
                    logger.warning("Browser was already closed during cleanup: %s", exc)

    async def _goto_next_page(self, page: Page, current_page: int) -> bool:
        """
        Navigate to the next page of active tenders.

        The CPPP portal (Tapestry framework) renders pagination links near
        the #activeTenders table. After clicking, we verify the table is
        still present to confirm we landed on a valid listing page.
        """
        try:
            # Strategy 1: Look for pagination links near the tenders table
            # CPPP typically uses page number links like [1] [2] [3] ...
            next_page_num = current_page + 1

            # Look for a link with exactly the next page number text
            # Scope to links near the table to avoid clicking random numbers
            pagination_selectors = [
                f"a:has-text('{next_page_num}')",
                "a:has-text('Next')",
                "a:has-text('next')",
                "a:has-text('»')",
                "a:has-text('>>')",
            ]

            for selector in pagination_selectors:
                links = await page.query_selector_all(selector)
                for link in links:
                    # Check the link text is short (pagination links are just numbers or "Next")
                    text = await link.text_content()
                    if text and len(text.strip()) > 10:
                        continue

                    # Check visibility
                    if not await link.is_visible():
                        continue

                    logger.info("Clicking pagination link: '%s'", text.strip() if text else selector)
                    await link.click()
                    await page.wait_for_load_state(settings.NAVIGATION_WAIT_UNTIL)
                    await asyncio.sleep(2)  # Let Tapestry framework settle

                    # Verify we landed on a listing page with the tenders table
                    table = await page.query_selector("#activeTenders")
                    if table:
                        return True

                    # Wrong page — go back to listing
                    logger.warning(
                        "Pagination click landed on wrong page. Returning to listing."
                    )
                    await self._goto_with_retry(
                        page, settings.LISTING_URL, "CPP Portal listing page (recovery)"
                    )
                    return False

            return False

        except (PlaywrightTimeoutError, PlaywrightError) as e:
            logger.warning("Pagination navigation failed: %s", str(e))
            return False

    async def _fetch_detail(
        self, page: Page, tender: Tender, index: int, meta: ScrapeRunMetadata
    ) -> None:
        """
        Navigate to a tender's detail page using page.goto().

        The session is maintained via browser cookies, so direct
        navigation to the detail URL works within the same context.
        """

        await self._goto_with_retry(
            page,
            tender.detail_url,
            f"detail page for {tender.reference}",
        )

        detail_html = await page.content()

        # Save first detail page HTML for debugging selectors
        if index == 0:
            self._save_debug_html(detail_html, "detail_page_sample.html")

        await self.parse_detail(detail_html, tender)

        # --- Download NIT PDF ---
        if tender.pdf_url:
            logger.info("Initiating PDF download for: %s", tender.reference)
            try:
                # Use Playwright's request context to fetch the URL using active session cookies
                response = await page.request.get(
                    tender.pdf_url,
                    timeout=settings.PDF_REQUEST_TIMEOUT_MS,
                )
                if response.status == 200:
                    pdf_bytes = await response.body()
                    content_type = response.headers.get("content-type", "")

                    if not self._is_pdf_response(pdf_bytes):
                        if self._is_captcha_response(pdf_bytes):
                            logger.warning(
                                "PDF download for %s requires captcha. "
                                "Skipping PDF extraction.",
                                tender.reference,
                            )
                            meta.pdf_captcha_blocks += 1
                        else:
                            logger.warning(
                                "Downloaded document for %s is not a PDF "
                                "(content-type=%s). Skipping PDF extraction.",
                                tender.reference,
                                content_type or "unknown",
                            )
                        return

                    # Sanitize reference to use as filename
                    sanitized_ref = "".join(
                        c for c in tender.reference if c.isalnum() or c in ("-", "_")
                    ).strip()
                    if not sanitized_ref:
                        sanitized_ref = f"tender_{index}"

                    # Ensure download dir exists
                    os.makedirs(settings.PDF_DOWNLOAD_DIR, exist_ok=True)
                    pdf_path = os.path.join(
                        settings.PDF_DOWNLOAD_DIR, f"{sanitized_ref}.pdf"
                    )

                    with open(pdf_path, "wb") as f:
                        f.write(pdf_bytes)

                    tender.pdf_local_path = pdf_path
                    meta.pdf_downloads += 1
                    logger.info("Successfully downloaded PDF to %s", pdf_path)

                    # Extract text
                    try:
                        from services.pdf_service import PDFService
                        tender.extracted_text = await PDFService.extract_text_async(pdf_path)
                    except Exception as e:
                        logger.error(
                            "Failed to extract text from PDF for %s: %s",
                            tender.reference,
                            str(e),
                        )
                else:
                    logger.error(
                        "Failed to fetch PDF for %s. Status: %d",
                        tender.reference,
                        response.status,
                    )
            except Exception as e:
                logger.error(
                    "Failed to download PDF for %s: %s",
                    tender.reference,
                    str(e),
                )
        else:
            logger.warning("No downloadable PDF link found for: %s", tender.reference)

    @staticmethod
    def _is_pdf_response(content: bytes) -> bool:
        """Return True when the downloaded body is a real PDF file."""
        return content.lstrip().startswith(b"%PDF")

    @staticmethod
    def _is_captcha_response(content: bytes) -> bool:
        """Detect CPPP document-download captcha pages returned as HTML."""
        lowered = content[:4096].lower()
        return b"docdowncaptcha" in lowered or b"please fill the captcha" in lowered

    async def _goto_with_retry(self, page: Page, url: str, label: str) -> None:
        """Navigate with exponential backoff retries."""

        last_error: Exception | None = None

        for attempt in range(1, settings.NAVIGATION_RETRIES + 1):
            try:
                await page.goto(
                    url,
                    wait_until=settings.NAVIGATION_WAIT_UNTIL,
                    timeout=settings.NAVIGATION_TIMEOUT_MS,
                )
                return
            except asyncio.CancelledError:
                raise
            except PlaywrightTimeoutError as e:
                last_error = e
                logger.warning(
                    "Timed out loading %s after %d ms (attempt %d/%d).",
                    label,
                    settings.NAVIGATION_TIMEOUT_MS,
                    attempt,
                    settings.NAVIGATION_RETRIES,
                )
            except PlaywrightError as e:
                last_error = e
                logger.warning(
                    "Could not load %s (attempt %d/%d): %s",
                    label,
                    attempt,
                    settings.NAVIGATION_RETRIES,
                    str(e),
                )

            if attempt < settings.NAVIGATION_RETRIES:
                # Exponential backoff: 1.5s, 3s, 6s, ...
                delay = settings.NAVIGATION_RETRY_DELAY_MS / 1000 * (2 ** (attempt - 1))
                logger.info("Retrying in %.1fs...", delay)
                await asyncio.sleep(delay)

        raise last_error or PlaywrightError(f"Could not load {label}")

    def _save_debug_html(self, html: str, filename: str) -> None:
        """Save HTML to disk for debugging selector development."""
        try:
            os.makedirs(DEBUG_HTML_DIR, exist_ok=True)
            filepath = os.path.join(DEBUG_HTML_DIR, filename)
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(html)
            logger.debug("Saved debug HTML to: %s", filepath)
        except Exception as e:
            logger.warning("Could not save debug HTML: %s", str(e))

    async def parse(self, html: str) -> List[Tender]:
        """Parse the listing page HTML into partial Tender objects."""

        tree = HTMLParser(html)
        table = tree.css_first("#activeTenders")

        if table is None:
            logger.error("activeTenders table not found on listing page.")
            return []

        tenders: List[Tender] = []
        rows = table.css("tr")

        for row in rows:
            cols = row.css("td")

            if len(cols) < 4:
                continue

            title_cell = cols[0]
            link = title_cell.css_first("a")

            detail_url = ""
            if link:
                href = link.attributes.get("href", "")
                detail_url = f"{settings.BASE_URL}{href}"

            tender = Tender(
                title=title_cell.text(strip=True),
                reference=cols[1].text(strip=True),
                closing_date=cols[2].text(strip=True),
                opening_date=cols[3].text(strip=True),
                detail_url=detail_url,
                portal_source="CPPP",
            )

            tenders.append(tender)

        return tenders

    async def parse_detail(self, html: str, tender: Tender) -> Tender:
        """
        Parse a tender detail page and enrich the Tender object.

        The CPP portal detail page uses:
            - <td class="td_caption"> for labels
            - <td class="td_field">  for values
        Labels like "Tender Value in ₹" contain currency symbols,
        so we use 'contains' matching, not exact matching.
        """

        tree = HTMLParser(html)

        # Scope extraction to the main content area only
        content_area = tree.css_first("td.page_content")
        if content_area is None:
            logger.warning(
                "Could not find 'td.page_content' on detail page for '%s'.",
                tender.reference,
            )
            return tender

        # --- Basic Details ---
        tender.tender_id = self._extract_field(content_area, "Tender ID")
        tender.organisation = self._extract_field(content_area, "Organisation Chain")
        tender.tender_number = self._extract_field(
            content_area, "Tender Reference Number"
        )
        tender.tender_category = self._extract_field(content_area, "Tender Category")
        tender.tender_type = self._extract_field(content_area, "Tender Type")
        tender.form_of_contract = self._extract_field(content_area, "Form Of Contract")
        tender.withdrawal_allowed = self._extract_field(content_area, "Withdrawal Allowed")
        tender.no_of_covers = self._extract_field(content_area, "No. of Covers")
        tender.payment_mode = self._extract_field(content_area, "Payment Mode")

        # Department: parsed from organisation chain
        if tender.organisation:
            parts = tender.organisation.split("||")
            if len(parts) >= 2:
                tender.department = parts[-1].strip()

        # --- Work Item Details ---
        tender.description = self._extract_field(content_area, "Work Description")
        if not tender.description:
            # Fallback: use "Title" from Work Item section
            tender.description = self._extract_field(content_area, "Title")
        tender.location = self._extract_field(content_area, "Location")
        tender.pincode = self._extract_field(content_area, "Pincode")
        tender.product_category = self._extract_field(content_area, "Product Category")
        tender.sub_category = self._extract_field(content_area, "Sub category")
        tender.contract_type = self._extract_field(content_area, "Contract Type")
        tender.bid_validity_days = self._extract_field(content_area, "Bid Validity")
        tender.period_of_work_days = self._extract_field(content_area, "Period Of Work")
        tender.pre_qualification = self._extract_field(content_area, "Pre Qualification")

        # --- Financial fields ---
        tender.tender_value = self._extract_field(content_area, "Tender Value")
        tender.emd = self._extract_field(content_area, "EMD Amount")
        tender.emd_exemption = self._extract_field(content_area, "EMD Exemption")
        tender.emd_fee_type = self._extract_field(content_area, "EMD Fee Type")
        tender.tender_fee = self._extract_field(content_area, "Tender Fee in")
        tender.fee_payable_to = self._extract_field(content_area, "Fee Payable To")
        tender.fee_payable_at = self._extract_field(content_area, "Fee Payable At")

        # --- Critical Dates (Chronological Flow) ---
        tender.published_date = self._extract_field(content_area, "Published Date") or tender.published_date
        tender.doc_download_start_date = self._extract_field(content_area, "Document Download / Sale Start Date")
        tender.doc_download_end_date = self._extract_field(content_area, "Document Download / Sale End Date")
        tender.clarification_start_date = self._extract_field(content_area, "Clarification Start Date")
        tender.clarification_end_date = self._extract_field(content_area, "Clarification End Date")
        tender.bid_submission_start_date = self._extract_field(content_area, "Bid Submission Start Date")
        tender.bid_submission_end_date = self._extract_field(content_area, "Bid Submission End Date")
        tender.pre_bid_meeting_date = self._extract_field(content_area, "Pre Bid Meeting Date")
        tender.pre_bid_meeting_place = self._extract_field(content_area, "Pre Bid Meeting Place")
        tender.bid_opening_place = self._extract_field(content_area, "Bid Opening Place")

        # --- Tender Inviting Authority ---
        tender.inviting_authority_name = self._extract_authority_field(content_area, "Name")
        tender.inviting_authority_address = self._extract_authority_field(content_area, "Address")

        # --- Documents & Tables ---
        tender.pdf_url = self._extract_document_url(content_area)
        tender.supporting_documents = self._extract_all_document_urls(content_area)
        tender.documents_metadata = self._extract_documents_table(content_area)

        logger.debug(
            "Parsed detail for '%s': org=%s, value=%s, fee=%s, emd=%s, docs=%d",
            tender.reference,
            (tender.organisation or "N/A")[:50],
            tender.tender_value or "N/A",
            tender.tender_fee or "N/A",
            tender.emd or "N/A",
            len(tender.documents_metadata),
        )

        return tender

    def _extract_field(self, node: Node, label: str) -> Optional[str]:
        """
        Find a <td class="td_caption"> containing the label text,
        then return the text of the next sibling <td class="td_field">.

        Uses 'contains' matching because labels often include extra
        characters (e.g., "Tender Value in ₹", "EMD Amount in ₹").
        """

        caption_cells = node.css("td.td_caption")

        for cell in caption_cells:
            cell_text = cell.text(strip=True)

            if cell_text and label.lower() in cell_text.lower():
                # Find the next sibling td with class td_field
                sibling = cell.next
                while sibling is not None:
                    if sibling.tag == "td":
                        css_class = sibling.attributes.get("class", "")
                        if "td_field" in css_class:
                            value = sibling.text(strip=True)
                            if value:
                                return value
                            break
                    sibling = sibling.next

        return None

    def _extract_document_url(self, node: Node) -> Optional[str]:
        """
        Extract the primary NIT document PDF URL.

        The CPP portal uses <a id="docDownoad"> for NIT document links.
        The link text typically contains the PDF filename.
        """

        # Primary: look for the docDownoad link
        doc_link = node.css_first("a#docDownoad")
        if doc_link:
            href = doc_link.attributes.get("href", "")
            if href:
                return (
                    href
                    if href.startswith("http")
                    else f"{settings.BASE_URL}{href}"
                )

        # Fallback: any link with .pdf in text
        for link in node.css("a"):
            link_text = link.text(strip=True)
            if link_text and ".pdf" in link_text.lower():
                href = link.attributes.get("href", "")
                if href:
                    return (
                        href
                        if href.startswith("http")
                        else f"{settings.BASE_URL}{href}"
                    )

        return None

    def _extract_all_document_urls(self, node: Node) -> list[str]:
        """
        Extract all document URLs from the detail page.

        Includes NIT documents, work item documents, and zip downloads.
        """

        documents: list[str] = []

        for link in node.css("a"):
            href = link.attributes.get("href", "")
            link_text = link.text(strip=True)
            link_id = link.attributes.get("id", "")

            if not href:
                continue

            is_document = (
                link_id == "docDownoad"
                or (link_text and ".pdf" in link_text.lower())
                or "zip" in link_text.lower()
                or "download" in link_text.lower()
            )

            if is_document:
                url = (
                    href
                    if href.startswith("http")
                    else f"{settings.BASE_URL}{href}"
                )
                if url not in documents:
                    documents.append(url)

        return documents

    def _extract_authority_field(self, node: Node, label: str) -> Optional[str]:
        """Extract Name or Address from Tender Inviting Authority section."""
        for table in node.css("table"):
            table_text = table.text()
            if "Tender Inviting Authority" in table_text or "Inviting Authority" in table_text:
                val = self._extract_field(table, label)
                if val:
                    return val
        return self._extract_field(node, label)

    def _extract_documents_table(self, node: Node) -> list[dict[str, Any]]:
        """Extract structured document records with Name, Description, Size KB, and Download Link."""
        docs: list[dict[str, Any]] = []
        for table in node.css("table"):
            table_text = table.text()
            if "Document Name" in table_text or "NIT Document" in table_text or "Work Item Documents" in table_text:
                rows = table.css("tr")
                for r in rows:
                    cells = r.css("td")
                    if len(cells) >= 3:
                        name_cell = cells[1] if len(cells) >= 4 else cells[0]
                        link = r.css_first("a")
                        doc_name = name_cell.text(strip=True) if name_cell else ""
                        if not doc_name or "Document Name" in doc_name or "S.No" in doc_name:
                            continue
                        
                        desc_cell = cells[2] if len(cells) >= 4 else cells[1]
                        size_cell = cells[3] if len(cells) >= 4 else (cells[2] if len(cells) >= 3 else None)
                        
                        download_url = None
                        if link:
                            href = link.attributes.get("href", "")
                            if href:
                                download_url = href if href.startswith("http") else f"{settings.BASE_URL}{href}"
                        
                        docs.append({
                            "name": doc_name,
                            "description": desc_cell.text(strip=True) if desc_cell else "",
                            "size_kb": size_cell.text(strip=True) if size_cell else "",
                            "download_url": download_url,
                        })
        return docs
