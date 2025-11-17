#!/usr/bin/env python3
"""Script CLI pour rafraîchir la boutique Fortnite et mettre à jour le cache."""

import os
import sys
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

from services.fortnite_api import FortniteAPIClient


def load_env() -> None:
    if load_dotenv is None:
        return

    env_path = Path(__file__).with_name('.env')
    if env_path.exists():
        load_dotenv(env_path)
    else:
        load_dotenv()


def main() -> int:
    load_env()

    api_key = os.getenv('FORTNITE_API_KEY')
    if not api_key:
        print('❌ Variable FORTNITE_API_KEY manquante. Configurez-la dans .env.')
        return 1

    ttl = int(os.getenv('FORTNITE_SHOP_TTL', '900'))
    client = FortniteAPIClient(api_key=api_key, cache_ttl_seconds=ttl)

    try:
        data = client.refresh_shop()
        last_updated = data.get('last_updated')
        print(f"✅ Boutique mise à jour avec succès (last_updated={last_updated})")
        return 0
    except Exception as exc:  # pylint: disable=broad-except
        print(f"❌ Erreur lors de la récupération de la boutique: {exc}")
        return 2


if __name__ == '__main__':
    sys.exit(main())
