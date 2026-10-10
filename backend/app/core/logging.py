"""Simple logging setup for the backend."""

import logging

LOG_FORMAT = "%(asctime)s | %(levelname)s | %(name)s | %(message)s"


def setup_logging() -> None:
    """Print INFO and higher messages to the console."""

    logging.basicConfig(level=logging.INFO, format=LOG_FORMAT)


def get_logger(name: str) -> logging.Logger:
    """Logger with a pilltally prefix, e.g. pilltally.main."""

    return logging.getLogger(f"pilltally.{name}")
