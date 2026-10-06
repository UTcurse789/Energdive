"""
Centralized configuration for the Tender Intelligence Platform.

All hardcoded values, URLs, timeouts, and behavioral flags
are defined here. Secrets go in .env (not here).
"""

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")


# --- CPP Portal ---
BASE_URL = "https://eprocure.gov.in"
LISTING_URL = f"{BASE_URL}/epublish/app"

# --- Browser ---
HEADLESS = os.getenv("HEADLESS", "True").lower() in ("true", "1", "yes")
PAGE_TIMEOUT_MS = 60_000
NAVIGATION_TIMEOUT_MS = 45_000
NAVIGATION_WAIT_UNTIL = "domcontentloaded"

# --- Scraping ---
DETAIL_PAGE_DELAY_MS = 2_000  # polite delay between detail page visits
NAVIGATION_RETRIES = 2
NAVIGATION_RETRY_DELAY_MS = 1_500
PDF_REQUEST_TIMEOUT_MS = 45_000

# --- Storage ---
PDF_DOWNLOAD_DIR = "data/pdfs"
EXCEL_WORKBOOK_PATH = "storage/tenders.xlsx"

# --- OpenAI Intelligence ---
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5-nano")
OPENAI_RESPONSES_URL = os.getenv(
    "OPENAI_RESPONSES_URL",
    "https://api.openai.com/v1/responses",
)
OPENAI_TIMEOUT_SECONDS = int(os.getenv("OPENAI_TIMEOUT_SECONDS", "90"))
OPENAI_MAX_OUTPUT_TOKENS = int(os.getenv("OPENAI_MAX_OUTPUT_TOKENS", "4096"))
AI_MAX_PDF_CHARS = int(os.getenv("AI_MAX_PDF_CHARS", "50000"))
OPENAI_MAX_RETRIES = int(os.getenv("OPENAI_MAX_RETRIES", "3"))
OPENAI_RETRY_BASE_DELAY = float(os.getenv("OPENAI_RETRY_BASE_DELAY", "2.0"))

# --- API Server ---
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))

# --- Scraper Concurrency ---
MAX_CONCURRENT_DETAILS = int(os.getenv("MAX_CONCURRENT_DETAILS", "3"))
MAX_PAGES = int(os.getenv("MAX_PAGES", "10"))
