"""MongoDB client factory.

This module owns Mongo connection construction so application and service code
do not need to know about PyMongo lifecycle details.
"""

from __future__ import annotations

import os
from typing import Any

_client: Any = None


class MongoUnavailableError(RuntimeError):
    """Raised when MongoDB cannot be used."""


def mongo_uri() -> str:
    """Return the configured MongoDB URI."""
    return os.getenv(
        "MONGO_URI",
        "mongodb://trading:vibe-trading@mongo:27017/vibe_trading?authSource=admin",
    )


def mongo_db_name() -> str:
    """Return the configured database name."""
    return os.getenv("MONGO_DB", "vibe_trading")


def get_mongo_client() -> Any:
    """Return a process-wide MongoClient, creating it on first use."""
    global _client
    try:
        from pymongo import MongoClient
        from pymongo.errors import PyMongoError
    except ImportError as exc:
        raise MongoUnavailableError("pymongo is not installed") from exc

    try:
        if _client is None:
            _client = MongoClient(mongo_uri(), serverSelectionTimeoutMS=1200)
            _client.admin.command("ping")
        return _client
    except PyMongoError as exc:
        raise MongoUnavailableError(f"MongoDB unavailable: {exc}") from exc


def get_mongo_database() -> Any:
    """Return the configured Mongo database."""
    return get_mongo_client()[mongo_db_name()]


def get_collection(name: str) -> Any:
    """Return a collection from the configured Mongo database."""
    return get_mongo_database()[name]
