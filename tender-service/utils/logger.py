"""
Structured logging for the Tender Intelligence Platform.

Usage:
    from utils.logger import get_logger
    logger = get_logger(__name__)
    logger.info("Fetching tenders...")
"""

import logging
import os
import sys
from logging.handlers import RotatingFileHandler


LOG_DIR = os.path.join(os.path.dirname(__file__), "..", "logs")
LOG_FILE = os.path.join(LOG_DIR, "tender_platform.log")
MAX_BYTES = 5 * 1024 * 1024  # 5 MB
BACKUP_COUNT = 3

_initialized = False


def _setup_root_logger() -> None:
    """Configure root logger once with both console and file handlers."""
    global _initialized
    if _initialized:
        return

    os.makedirs(LOG_DIR, exist_ok=True)

    root = logging.getLogger()
    root.setLevel(logging.DEBUG)

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Console handler
    console = logging.StreamHandler(sys.stdout)
    console.setLevel(logging.INFO)
    console.setFormatter(formatter)
    root.addHandler(console)

    # Rotating file handler
    file_handler = RotatingFileHandler(
        LOG_FILE, maxBytes=MAX_BYTES, backupCount=BACKUP_COUNT, encoding="utf-8",
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    root.addHandler(file_handler)

    _initialized = True


def get_logger(name: str) -> logging.Logger:
    """Create a named logger with consistent formatting."""
    _setup_root_logger()
    return logging.getLogger(name)
