"""
Centralised logging setup for FinansAsistan.

Import and call configure_logging() once at application startup (main.py).
Every other module then just does:

    import logging
    logger = logging.getLogger(__name__)
"""

import logging
import sys


def configure_logging(level: str = "INFO") -> None:
    """Wire up a single StreamHandler with a structured format."""
    fmt = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(fmt)

    root = logging.getLogger()
    # Avoid double-adding handlers if called more than once (e.g. in tests)
    if not root.handlers:
        root.addHandler(handler)
    root.setLevel(getattr(logging, level.upper(), logging.INFO))

    # Quieten noisy third-party loggers
    for noisy in ("uvicorn.access", "httpx", "httpcore"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
