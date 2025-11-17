import json
import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import requests
from requests.adapters import HTTPAdapter, Retry


logger = logging.getLogger(__name__)


class FortniteAPIError(RuntimeError):
    """Erreur remontée lors de l'appel à Fortnite API."""


class FortniteAPIClient:
    """Client léger pour https://fortnite-api.com"""

    BASE_URL = "https://fortnite-api.com/v2"

    def __init__(
        self,
        api_key: str,
        cache_path: Optional[str] = None,
        cache_ttl_seconds: int = 900,
    ) -> None:
        if not api_key:
            raise ValueError("FORTNITE_API_KEY manquante")

        self.api_key = api_key
        self.cache_ttl = timedelta(seconds=cache_ttl_seconds)
        default_cache_path = os.path.join(
            os.path.dirname(__file__), "..", "data", "shop_cache.json"
        )
        self.cache_path = cache_path or os.path.abspath(default_cache_path)

        # Session HTTP avec retry
        self.session = requests.Session()
        retries = Retry(
            total=3,
            backoff_factor=0.5,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=("GET", "POST"),
        )
        adapter = HTTPAdapter(max_retries=retries)
        self.session.mount("https://", adapter)
        self.session.mount("http://", adapter)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def get_shop(self, force_refresh: bool = False) -> Dict[str, Any]:
        """Retourne les données shop (cache -> API)."""
        if not force_refresh:
            cached = self._load_cache()
            if cached and not self._is_cache_expired(cached.get("last_updated")):
                return cached

        data = self._fetch_shop_from_api()
        self._save_cache(data)
        return data

    def refresh_shop(self) -> Dict[str, Any]:
        """Force un refresh (ignorer le cache)."""
        data = self._fetch_shop_from_api()
        self._save_cache(data)
        return data

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _fetch_shop_from_api(self) -> Dict[str, Any]:
        url = f"{self.BASE_URL}/shop"
        logger.info("Fetching Fortnite shop from %s", url)

        headers = {"Authorization": self.api_key}
        resp = self.session.get(url, headers=headers, timeout=10)

        if resp.status_code != 200:
            raise FortniteAPIError(
                f"Fortnite API error {resp.status_code}: {resp.text[:200]}"
            )

        payload = resp.json()
        payload["last_updated"] = datetime.now(timezone.utc).isoformat()
        return payload

    def _load_cache(self) -> Optional[Dict[str, Any]]:
        if not os.path.exists(self.cache_path):
            return None

        try:
            with open(self.cache_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except json.JSONDecodeError:
            logger.warning("Cache shop corrompu, il sera écrasé")
            return None

    def _save_cache(self, data: Dict[str, Any]) -> None:
        os.makedirs(os.path.dirname(self.cache_path), exist_ok=True)
        with open(self.cache_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        logger.info("Fortnite shop cache mis à jour (%s)", self.cache_path)

    def _is_cache_expired(self, last_updated_iso: Optional[str]) -> bool:
        if not last_updated_iso:
            return True
        try:
            last = datetime.fromisoformat(last_updated_iso)
        except ValueError:
            return True
        return datetime.now(timezone.utc) - last >= self.cache_ttl


__all__ = ["FortniteAPIClient", "FortniteAPIError"]
