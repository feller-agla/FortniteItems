import json
import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import requests
from requests.adapters import HTTPAdapter, Retry

from .fortnite_shop_scraper import FortniteShopScraper

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

        # Initialiser le scraper
        self.scraper = FortniteShopScraper(api_key=api_key)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def get_shop(self, force_refresh: bool = False) -> Dict[str, Any]:
        """Retourne les données shop (cache -> API) avec fallback si l'API est KO."""
        cached = self._load_cache()

        if not force_refresh and cached and not self._is_cache_expired(cached.get("last_updated")):
            return cached

        try:
            data = self._fetch_shop_from_api()
            self._save_cache(data)
            return data
        except Exception as exc:
            if cached:
                logger.warning(
                    "Fortnite API indisponible (%s). Retour des données cache malgré expiration.",
                    exc,
                )
                return cached
            raise

    def refresh_shop(self) -> Dict[str, Any]:
        """Force un refresh (ignorer le cache)."""
        data = self._fetch_shop_from_api()
        self._save_cache(data)
        return data

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _fetch_shop_from_api(self) -> Dict[str, Any]:
        """
        Récupère et parse les données de la boutique Fortnite en temps réel.
        Utilise le scraper fortnite_shop_scraper.py
        Retourne exactement le format que le scraper retourne
        """
        logger.info("Fetching Fortnite shop using FortniteShopScraper")
        
        # Utiliser le scraper pour récupérer les données
        shop_data = self.scraper.get_shop(language="fr")
        
        if not shop_data:
            raise FortniteAPIError("Impossible de récupérer les données de la boutique")
        
        # Retourner exactement ce que le scraper retourne, en ajoutant juste last_updated
        # Le scraper retourne déjà le format exact de fortnite_shop.json
        shop_data['last_updated'] = datetime.now(timezone.utc).isoformat()
        
        return shop_data

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
