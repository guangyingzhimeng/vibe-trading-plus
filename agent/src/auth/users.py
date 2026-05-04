"""User identity helpers shared by API and services."""

from __future__ import annotations

import hashlib
from typing import Any, Mapping, Optional


def openid_from_payload(payload: Optional[Mapping[str, Any]]) -> Optional[str]:
    """Extract a non-empty DreamAuth openid from a verified token payload."""
    openid = str((payload or {}).get("sub") or "").strip()
    return openid or None


def user_key_from_payload(payload: Optional[Mapping[str, Any]]) -> Optional[str]:
    """Return a stable filesystem/database-safe user partition key."""
    openid = openid_from_payload(payload)
    if not openid:
        return None
    return hashlib.sha256(openid.encode("utf-8")).hexdigest()[:24]
