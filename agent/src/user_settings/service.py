"""Per-user settings persistence service."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Callable, Dict, Mapping, Optional

from src.auth.users import openid_from_payload, user_key_from_payload
from src.infra.mongo import MongoUnavailableError, get_collection

SettingsValues = Dict[str, str]


class UserSettingsError(RuntimeError):
    """Raised when user settings cannot be read or written."""


class UserSettingsService:
    """Read and write runtime settings for either a logged-in user or local dev."""

    def __init__(
        self,
        *,
        default_values_loader: Callable[[], SettingsValues],
        local_values_writer: Callable[[SettingsValues], None],
    ) -> None:
        self._default_values_loader = default_values_loader
        self._local_values_writer = local_values_writer
        self._collection = None

    def read_values(self, user: Optional[Mapping[str, Any]]) -> SettingsValues:
        """Return settings with user-specific values overlaying defaults."""
        values = dict(self._default_values_loader())
        user_key = user_key_from_payload(user)
        if not user_key:
            return values

        doc = self._user_settings_collection().find_one({"_id": user_key}) or {}
        settings = doc.get("settings") if isinstance(doc.get("settings"), dict) else {}
        for key, value in settings.items():
            if isinstance(key, str) and isinstance(value, str):
                values[key] = value
        return values

    def write_values(self, user: Optional[Mapping[str, Any]], updates: SettingsValues) -> None:
        """Persist settings updates for a logged-in user, or local .env in dev."""
        user_key = user_key_from_payload(user)
        if not user_key:
            self._local_values_writer(updates)
            return

        openid = openid_from_payload(user) or ""
        now = datetime.now().isoformat()
        set_values = {f"settings.{key}": value for key, value in updates.items()}
        self._user_settings_collection().update_one(
            {"_id": user_key},
            {
                "$set": {
                    **set_values,
                    "user_key": user_key,
                    "openid": openid,
                    "updated_at": now,
                },
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
        )

    def _user_settings_collection(self) -> Any:
        if self._collection is not None:
            return self._collection
        try:
            collection = get_collection("user_settings")
            collection.create_index("openid", unique=True)
        except MongoUnavailableError as exc:
            raise UserSettingsError(str(exc)) from exc
        self._collection = collection
        return collection
