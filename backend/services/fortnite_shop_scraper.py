import requests
import json
import re
import time
from datetime import datetime
from typing import Dict, Any, Optional, List
from urllib.parse import quote_plus

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False
    print("⚠️ BeautifulSoup4 non installé - parsing HTML basique uniquement")


class FortniteShopScraper:
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialise le scraper de la boutique Fortnite
        api_key: Optionnel pour FortniteAPI.io (recommandé pour plus de requêtes)
        """
        self.base_url = "https://fortnite-api.com/v2/shop/"
        self.cosmetics_url = "https://fortnite-api.com/v2/cosmetics/br/"
        self.api_key = api_key
        self.price_cache = {}  # Cache des prix recherchés
        
    def get_shop(self, language: str = "fr") -> Optional[Dict[str, Any]]:
        """
        Récupère les données de la boutique actuelle
        language: Code langue (fr, en, es, etc.)
        """
        try:
            headers = {}
            if self.api_key:
                headers['Authorization'] = self.api_key
            
            params = {'language': language}
            
            response = requests.get(self.base_url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if data['status'] == 200:
                return self.parse_shop_data(data['data'])
            else:
                print(f"Erreur API: {data.get('error', 'Erreur inconnue')}")
                return None
                
        except requests.exceptions.RequestException as e:
            print(f"Erreur de connexion: {e}")
            return None
    
    def parse_shop_data(self, shop_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse et structure les données de la boutique
        """
        items = []
        
        # Parcours des entrées de la boutique (structure API v2)
        entries = shop_data.get('entries', [])
        car_count = 0
        
        # Première passe : parser toutes les entries et créer un index des prix par item ID
        # On garde le prix le plus fréquent pour chaque item (au cas où il apparaît dans plusieurs entries)
        item_price_index = {}  # {item_id: price}
        item_price_counts = {}  # {item_id: {price: count}}
        
        for entry in entries:
            br_items = entry.get('brItems', [])
            final_price = entry.get('finalPrice', 0)
            regular_price = entry.get('regularPrice', 0)
            # Si c'est une entry avec un seul item, indexer son prix
            if len(br_items) == 1 and final_price > 0:
                item_id = br_items[0].get('id', '')
                if item_id:
                    # Compter les occurrences de chaque prix pour cet item
                    if item_id not in item_price_counts:
                        item_price_counts[item_id] = {}
                    if final_price not in item_price_counts[item_id]:
                        item_price_counts[item_id][final_price] = 0
                    item_price_counts[item_id][final_price] += 1
        
        # Pour chaque item, prendre le prix le plus fréquent
        for item_id, price_counts in item_price_counts.items():
            most_common_price = max(price_counts.items(), key=lambda x: x[1])[0]
            item_price_index[item_id] = most_common_price
        
        # Deuxième passe : parser les entries et utiliser l'index pour les prix des items de pack
        for entry in entries:
            parsed = self.parse_entry(entry, "Shop", item_price_index)
            items.extend(parsed)
            # Compter les items de voiture
            car_count += sum(1 for item in parsed if item.get('vehicleId'))
        
        print(f"📊 Total items parsés: {len(items)} (dont {car_count} items de voiture)")
        
        return {
            'date': shop_data.get('date', datetime.now().isoformat()),
            'total_items': len(items),
            'items': items,
            'vbuckIcon': shop_data.get('vbuckIcon', ''),
            'raw_data': shop_data  # Garder les données brutes pour compatibilité
        }
    
    def parse_entry(self, entry: Dict[str, Any], section: str, item_price_index: Dict[str, int] = None) -> List[Dict[str, Any]]:
        """
        Parse une entrée de la boutique
        """
        items = []
        
        final_price = entry.get('finalPrice', 0)
        regular_price = entry.get('regularPrice', 0)
        
        # Récupérer tous les items de l'entrée
        br_items = entry.get('brItems', [])
        
        # Si l'entrée a un bundle object, c'est TOUJOURS un pack (même avec une tenue + items)
        # On doit le créer comme pack pour qu'il apparaisse correctement
        bundle = entry.get('bundle')
        if bundle and len(br_items) > 1:
            # C'est un pack avec un nom de bundle, créer directement le pack
            bundle_name = bundle.get('name', 'Pack Fortnite')
            bundle_image = bundle.get('image', '')
            
            # Récupérer l'image du bundle depuis newDisplayAsset si disponible
            new_display_asset = entry.get('newDisplayAsset', {})
            render_images = new_display_asset.get('renderImages', [])
            if render_images and not bundle_image:
                bundle_image = render_images[0].get('image', '')
            
            # Si pas d'image, utiliser la première image des items
            if not bundle_image and br_items:
                bundle_image = br_items[0].get('images', {}).get('featured') or br_items[0].get('images', {}).get('icon', '')
            
            # Préparer les items du pack pour la structure
            pack_items = []
            for br_item in br_items:
                pack_items.append({
                    'id': br_item.get('id', ''),
                    'name': br_item.get('name', 'N/A'),
                    'type': br_item.get('type', {}).get('displayValue', 'N/A') if isinstance(br_item.get('type'), dict) else 'N/A',
                    'rarity': br_item.get('rarity', {}).get('displayValue', 'N/A') if isinstance(br_item.get('rarity'), dict) else 'N/A',
                    'description': br_item.get('description', ''),
                    'images': br_item.get('images', {})
                })
            
            # Créer l'item pack
            pack_item = {
                'section': section,
                'name': bundle_name,
                'description': f'Pack contenant {len(pack_items)} objet(s)',
                'type': 'Pack',
                'rarity': 'Pack',
                'vbucks': final_price,
                'regular_price': regular_price,
                'id': entry.get('offerId', f'pack-{bundle_name.replace(" ", "-").lower()}'),
                'giftable': entry.get('giftable', False),
                'refundable': entry.get('refundable', False),
                'inDate': entry.get('inDate', ''),
                'outDate': entry.get('outDate', ''),
                'images': {
                    'icon': bundle_image,
                    'featured': bundle_image,
                    'small_icon': bundle_image
                },
                'layout': entry.get('layout', {}),
                'entry': entry,
                'is_bundle': True,
                'bundle_items': pack_items,
                'banner': entry.get('banner', {})
            }
            items.append(pack_item)
            return items  # Retourner seulement le pack
        
        # Vérifier si c'est une tenue avec un accessoire de dos (ou autre item secondaire)
        # Dans ce cas, on affiche seulement la tenue dans la liste, mais on garde les autres items pour la page détails
        if len(br_items) > 1:
            # Identifier le type de chaque item
            item_types = []
            for br_item in br_items:
                item_type = br_item.get('type', {})
                if isinstance(item_type, dict):
                    type_value = item_type.get('value', '').lower()
                    type_display = item_type.get('displayValue', '')
                else:
                    type_value = str(item_type).lower()
                    type_display = str(item_type)
                item_types.append((type_value, type_display))
            
            # Vérifier si c'est une tenue avec un accessoire de dos ou autre item secondaire
            has_outfit = any('outfit' in t[0] or 'character' in t[0] for t in item_types)
            has_backpack = any('backpack' in t[0] for t in item_types)
            has_secondary = has_backpack or any(t[0] in ['pickaxe', 'glider', 'emote', 'wrap', 'music'] for t in item_types)
            
            # Si c'est une tenue avec un accessoire/secondaire, afficher seulement la tenue
            if has_outfit and has_secondary and len(br_items) == 2:
                # Trouver la tenue (item principal)
                main_item = None
                secondary_items = []
                for i, br_item in enumerate(br_items):
                    item_type = br_items[i].get('type', {})
                    type_value = item_type.get('value', '').lower() if isinstance(item_type, dict) else str(item_type).lower()
                    if 'outfit' in type_value or 'character' in type_value:
                        main_item = br_item
                    else:
                        secondary_items.append(br_item)
                
                if main_item:
                    # Créer seulement l'item principal (tenue) mais garder les items secondaires dans les données
                    item_name = main_item.get('name') or main_item.get('title') or 'Objet Fortnite'
                    item_type_obj = main_item.get('type', {})
                    if isinstance(item_type_obj, dict):
                        type_display = item_type_obj.get('displayValue', '')
                    else:
                        type_display = str(item_type_obj) if item_type_obj else ''
                    
                    if not type_display or type_display == 'N/A' or type_display.strip() == '':
                        type_display = 'Autres'
                    
                    # Préparer les items secondaires pour la page détails
                    related_items = []
                    for sec_item in secondary_items:
                        related_items.append({
                            'id': sec_item.get('id', ''),
                            'name': sec_item.get('name', 'N/A'),
                            'type': sec_item.get('type', {}).get('displayValue', 'N/A') if isinstance(sec_item.get('type'), dict) else 'N/A',
                            'rarity': sec_item.get('rarity', {}).get('displayValue', 'N/A') if isinstance(sec_item.get('rarity'), dict) else 'N/A',
                            'description': sec_item.get('description', ''),
                            'images': sec_item.get('images', {})
                        })
                    
                    main_item_data = {
                        'section': section,
                        'name': item_name,
                        'description': main_item.get('description', ''),
                        'type': type_display,
                        'rarity': main_item.get('rarity', {}).get('displayValue', 'N/A') if isinstance(main_item.get('rarity'), dict) else 'N/A',
                        'vbucks': final_price,
                        'regular_price': regular_price,
                        'id': main_item.get('id', ''),
                        'giftable': entry.get('giftable', False),
                        'refundable': entry.get('refundable', False),
                        'inDate': entry.get('inDate', ''),
                        'outDate': entry.get('outDate', ''),
                        'images': {
                            'icon': main_item.get('images', {}).get('icon'),
                            'featured': main_item.get('images', {}).get('featured'),
                            'small_icon': main_item.get('images', {}).get('smallIcon')
                        },
                        'layout': entry.get('layout', {}),
                        'entry': entry,
                        'has_related_items': True,
                        'related_items': related_items  # Items secondaires pour la page détails
                    }
                    items.append(main_item_data)
                    return items
        
        # Si l'entrée contient plusieurs items (pas une tenue + accessoire), créer un pack
        if len(br_items) > 1:
            # Vérifier si c'est un pack avec un nom (bundle)
            bundle = entry.get('bundle')
            if bundle:
                bundle_name = bundle.get('name', 'Pack Fortnite')
                bundle_image = bundle.get('image', '')
            else:
                # Pas de nom de bundle, créer le nom en concaténant les noms des items
                item_names = []
                for br_item in br_items:
                    item_name = br_item.get('name') or br_item.get('title') or 'Item'
                    if item_name and item_name not in item_names:
                        item_names.append(item_name)
                bundle_name = ' + '.join(item_names[:5])  # Limiter à 5 noms max
                if len(item_names) > 5:
                    bundle_name += f' + {len(item_names) - 5} autre(s)'
                bundle_image = ''
            
            # Récupérer l'image du bundle depuis newDisplayAsset si disponible
            new_display_asset = entry.get('newDisplayAsset', {})
            render_images = new_display_asset.get('renderImages', [])
            if render_images and not bundle_image:
                bundle_image = render_images[0].get('image', '')
            
            # Si pas d'image, utiliser la première image des items
            if not bundle_image and br_items:
                bundle_image = br_items[0].get('images', {}).get('featured') or br_items[0].get('images', {}).get('icon', '')
            
            # Préparer les items du pack pour la structure
            pack_items = []
            for br_item in br_items:
                pack_items.append({
                    'id': br_item.get('id', ''),
                    'name': br_item.get('name', 'N/A'),
                    'type': br_item.get('type', {}).get('displayValue', 'N/A'),
                    'rarity': br_item.get('rarity', {}).get('displayValue', 'N/A'),
                    'description': br_item.get('description', ''),
                    'images': br_item.get('images', {})
                })
            
            # Créer l'item pack
            pack_item = {
                'section': section,
                'name': bundle_name,
                'description': f'Pack contenant {len(pack_items)} objet(s)',
                'type': 'Pack',
                'rarity': 'Pack',
                'vbucks': final_price,
                'regular_price': regular_price,
                'id': entry.get('offerId', f'pack-{bundle_name.replace(" ", "-").lower()}'),
                'giftable': entry.get('giftable', False),
                'refundable': entry.get('refundable', False),
                'inDate': entry.get('inDate', ''),
                'outDate': entry.get('outDate', ''),
                'images': {
                    'icon': bundle_image,
                    'featured': bundle_image,
                    'small_icon': bundle_image
                },
                'layout': entry.get('layout', {}),
                'entry': entry,
                'is_bundle': True,
                'bundle_items': pack_items,
                'banner': entry.get('banner', {})
            }
            items.append(pack_item)
            
            # NE PAS ajouter les items individuels du pack comme items séparés
            # Ils seront accessibles uniquement via "Voir les détails" du pack
            # Les items du pack sont déjà dans bundle_items et seront affichés sur la page détails
            
            return items  # Retourner seulement le pack (les items sont dans bundle_items)
        
        # Sinon, traiter les items individuellement (un seul item dans l'entrée)
        # Les items Battle Royale sont dans 'brItems'
        if br_items:
            for br_item in br_items:
                # Utiliser name en priorité, puis title, jamais devName
                item_name = br_item.get('name') or br_item.get('title') or 'Objet Fortnite'
                
                # Gérer le type - si manquant ou invalide, mettre "Autres"
                item_type = br_item.get('type', {})
                if isinstance(item_type, dict):
                    type_display = item_type.get('displayValue', '')
                else:
                    type_display = str(item_type) if item_type else ''
                
                # Si le type est vide, invalide ou "N/A", mettre "Autres"
                if not type_display or type_display == 'N/A' or type_display.strip() == '':
                    type_display = 'Autres'
                
                item_data = {
                    'section': section,
                    'name': item_name,
                    'description': br_item.get('description', ''),
                    'type': type_display,
                    'rarity': br_item.get('rarity', {}).get('displayValue', 'N/A'),
                    'vbucks': final_price,
                    'regular_price': regular_price,
                    'id': br_item.get('id', ''),
                    'giftable': entry.get('giftable', False),
                    'refundable': entry.get('refundable', False),
                    'inDate': entry.get('inDate', ''),
                    'outDate': entry.get('outDate', ''),
                    'images': {
                        'icon': br_item.get('images', {}).get('icon'),
                        'featured': br_item.get('images', {}).get('featured'),
                        'small_icon': br_item.get('images', {}).get('smallIcon')
                    },
                    'layout': entry.get('layout', {}),
                    'entry': entry  # Garder l'entrée complète pour compatibilité
                }
                items.append(item_data)
        
        # Les items de voiture sont dans 'cars'
        car_items = entry.get('cars', [])
        if car_items:
            print(f"🚗 {len(car_items)} item(s) de voiture trouvé(s) dans l'entrée")
        for car_item in car_items:
            # Pour les voitures, utiliser les images large/small au lieu de icon/featured
            car_images = car_item.get('images', {})
            
            # Utiliser name en priorité, jamais devName
            car_name = car_item.get('name') or 'Véhicule Fortnite'
            
            # Gérer le type - si manquant ou invalide, mettre "Autres"
            car_type = car_item.get('type', {})
            if isinstance(car_type, dict):
                type_display = car_type.get('displayValue', '')
            else:
                type_display = str(car_type) if car_type else ''
            
            # Si le type est vide, invalide ou "N/A", mettre "Autres"
            if not type_display or type_display == 'N/A' or type_display.strip() == '':
                type_display = 'Autres'
            
            item_data = {
                'section': section,
                'name': car_name,
                'description': car_item.get('description', ''),
                'type': type_display,
                'rarity': car_item.get('rarity', {}).get('displayValue', 'N/A'),
                'vbucks': final_price,
                'regular_price': regular_price,
                'id': car_item.get('id', '') or car_item.get('vehicleId', ''),
                'giftable': entry.get('giftable', False),
                'refundable': entry.get('refundable', False),
                'inDate': entry.get('inDate', ''),
                'outDate': entry.get('outDate', ''),
                'images': {
                    'icon': car_images.get('small') or car_images.get('large'),
                    'featured': car_images.get('large') or car_images.get('small'),
                    'small_icon': car_images.get('small')
                },
                'layout': entry.get('layout', {}),
                'entry': entry,  # Garder l'entrée complète pour compatibilité
                'vehicleId': car_item.get('vehicleId', '')  # ID spécifique aux véhicules
            }
            items.append(item_data)
        
        return items
    
    def display_shop(self, shop_data: Optional[Dict[str, Any]]) -> None:
        """
        Affiche les items de la boutique de manière lisible
        """
        if not shop_data:
            print("Aucune donnée disponible")
            return
        
        print(f"\n{'='*60}")
        print(f"BOUTIQUE FORTNITE - {shop_data['date']}")
        print(f"Total d'items: {shop_data['total_items']}")
        print(f"{'='*60}\n")
        
        current_section = None
        for item in shop_data['items']:
            if item['section'] != current_section:
                current_section = item['section']
                print(f"\n--- {current_section.upper()} ---\n")
            
            print(f"🎮 {item['name']}")
            print(f"   Type: {item['type']} | Rareté: {item['rarity']}")
            print(f"   Prix: {item['vbucks']} V-Bucks")
            if item['vbucks'] != item['regular_price']:
                print(f"   Prix normal: {item['regular_price']} V-Bucks")
            print(f"   ID: {item['id']}")
            print()
    
    def save_to_json(self, shop_data: Optional[Dict[str, Any]], filename: str = "fortnite_shop.json") -> None:
        """
        Sauvegarde les données dans un fichier JSON
        """
        if not shop_data:
            print("Aucune donnée à sauvegarder")
            return
            
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(shop_data, f, indent=2, ensure_ascii=False)
            print(f"✅ Données sauvegardées dans {filename}")
        except Exception as e:
            print(f"❌ Erreur lors de la sauvegarde: {e}")
    
    def search_item_price_online(self, item_name: str, item_id: str, br_item: Dict[str, Any]) -> int:
        """
        Cherche le prix d'un item en ligne via recherche web réelle
        """
        # Vérifier le cache d'abord
        cache_key = f"{item_id}_{item_name}"
        if cache_key in self.price_cache:
            return self.price_cache[cache_key]
        
        # Essayer plusieurs sources web (avec délais pour éviter les blocages)
        price = None
        
        # 1. Essayer fortnite.gg (site populaire pour les prix Fortnite)
        price = self._search_fortnite_gg(item_name, item_id)
        if price:
            self.price_cache[cache_key] = price
            return price
        
        time.sleep(0.5)  # Délai entre les requêtes
        
        # 2. Essayer fnbr.co (autre site de référence)
        price = self._search_fnbr_co(item_name, item_id)
        if price:
            self.price_cache[cache_key] = price
            return price
        
        time.sleep(0.5)  # Délai entre les requêtes
        
        # 3. Essayer une recherche Google (en dernier car peut être bloqué)
        price = self._search_google_price(item_name)
        if price:
            self.price_cache[cache_key] = price
            return price
        
        # Si aucune recherche n'a fonctionné, utiliser l'estimation basée sur la rareté
        rarity_value = br_item.get('rarity', {}).get('value', '').lower()
        rarity_prices = {
            'common': 500,
            'uncommon': 800,
            'rare': 1200,
            'epic': 1500,
            'legendary': 2000,
            'mythic': 2500
        }
        
        item_type_value = br_item.get('type', {}).get('value', '').lower() if isinstance(br_item.get('type'), dict) else ''
        base_price = rarity_prices.get(rarity_value, 1000)
        
        type_multipliers = {
            'outfit': 1.0,
            'backpack': 0.8,
            'pickaxe': 0.6,
            'glider': 0.7,
            'emote': 0.5,
            'wrap': 0.3,
            'music': 0.4,
        }
        
        multiplier = type_multipliers.get(item_type_value, 1.0)
        estimated_price = int(base_price * multiplier)
        
        self.price_cache[cache_key] = estimated_price
        return estimated_price
    
    def _search_fortnite_gg(self, item_name: str, item_id: str) -> Optional[int]:
        """Cherche le prix sur fortnite.gg"""
        try:
            # Construire l'URL de recherche
            search_name = item_name.lower().replace(' ', '-')
            url = f"https://fortnite.gg/items/{search_name}"
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=5, allow_redirects=True)
            if response.status_code == 200:
                content = response.text
                
                # Utiliser BeautifulSoup si disponible pour un meilleur parsing
                if HAS_BS4:
                    soup = BeautifulSoup(content, 'html.parser')
                    # Chercher dans les éléments de texte
                    text_content = soup.get_text().lower()
                else:
                    text_content = content.lower()
                
                # Patterns communs: "vbucks", "v-bucks", prix suivis de "vb" ou "v-bucks"
                patterns = [
                    r'(\d+)\s*v-?bucks?',
                    r'(\d+)\s*vb',
                    r'price[:\s]+(\d+)',
                    r'cost[:\s]+(\d+)',
                    r'(\d+)\s*v-?b',
                ]
                
                for pattern in patterns:
                    matches = re.findall(pattern, text_content)
                    if matches:
                        # Prendre le premier prix trouvé qui semble raisonnable (entre 200 et 5000)
                        for match in matches:
                            price = int(match)
                            if 200 <= price <= 5000:
                                return price
        except Exception as e:
            print(f"Erreur recherche fortnite.gg pour {item_name}: {e}")
        
        return None
    
    def _search_fnbr_co(self, item_name: str, item_id: str) -> Optional[int]:
        """Cherche le prix sur fnbr.co"""
        try:
            # fnbr.co utilise souvent l'ID de l'item
            if item_id:
                # Nettoyer l'ID pour l'URL
                clean_id = item_id.lower().replace('_', '-')
                url = f"https://fnbr.co/{clean_id}"
            else:
                search_name = item_name.lower().replace(' ', '-')
                url = f"https://fnbr.co/search?q={quote_plus(item_name)}"
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=5, allow_redirects=True)
            if response.status_code == 200:
                content = response.text
                
                # Utiliser BeautifulSoup si disponible
                if HAS_BS4:
                    soup = BeautifulSoup(content, 'html.parser')
                    text_content = soup.get_text().lower()
                else:
                    text_content = content.lower()
                
                # Chercher les patterns de prix
                patterns = [
                    r'(\d+)\s*v-?bucks?',
                    r'(\d+)\s*vb',
                    r'price[:\s]+(\d+)',
                    r'(\d+)\s*v-?b',
                ]
                
                for pattern in patterns:
                    matches = re.findall(pattern, text_content)
                    if matches:
                        for match in matches:
                            price = int(match)
                            if 200 <= price <= 5000:
                                return price
        except Exception as e:
            print(f"Erreur recherche fnbr.co pour {item_name}: {e}")
        
        return None
    
    def _search_google_price(self, item_name: str) -> Optional[int]:
        """Cherche le prix via Google"""
        try:
            # Recherche Google pour "item_name fortnite price vbucks"
            query = f"{item_name} fortnite price vbucks"
            url = f"https://www.google.com/search?q={quote_plus(query)}"
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=5)
            if response.status_code == 200:
                content = response.text
                # Chercher les patterns de prix dans les résultats Google
                patterns = [
                    r'(\d+)\s*v-?bucks?',
                    r'(\d+)\s*vb',
                    r'(\d+)\s*v-?b',
                ]
                
                for pattern in patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    if matches:
                        # Prendre le prix le plus fréquent ou le premier raisonnable
                        for match in matches:
                            price = int(match)
                            if 200 <= price <= 5000:
                                return price
        except Exception as e:
            print(f"Erreur recherche Google pour {item_name}: {e}")
        
        return None
    
    def calculate_selling_price(self, vbucks: int, margin: float = 0.50) -> float:
        """
        Calcule ton prix de vente basé sur les V-Bucks
        vbucks: Nombre de V-Bucks
        margin: Marge bénéficiaire (0.50 = 50%)
        """
        cost_per_vbuck = 0.00357  # Basé sur 13500 V-Bucks pour 48.26€
        cost = vbucks * cost_per_vbuck
        selling_price = cost * (1 + margin)
        return round(selling_price, 2)
    
    def get_items_with_prices(self, shop_data: Optional[Dict[str, Any]], margin: float = 0.50) -> Optional[List[Dict[str, Any]]]:
        """
        Retourne les items avec tes prix de vente calculés
        """
        if not shop_data:
            return None
        
        items_with_prices = []
        for item in shop_data['items']:
            item_copy = item.copy()
            item_copy['your_cost'] = round(item['vbucks'] * 0.00357, 2)
            item_copy['selling_price'] = self.calculate_selling_price(item['vbucks'], margin)
            item_copy['profit'] = round(item_copy['selling_price'] - item_copy['your_cost'], 2)
            items_with_prices.append(item_copy)
        
        return items_with_prices


# EXEMPLE D'UTILISATION
if __name__ == "__main__":
    import os
    # Initialise le scraper (ajoute ta clé API si tu en as une)
    api_key = os.getenv("FORTNITE_API_KEY")
    scraper = FortniteShopScraper(api_key=api_key)
    
    # Récupère la boutique actuelle
    print("🔄 Récupération de la boutique en cours...")
    shop = scraper.get_shop(language="fr")
    
    if shop:
        # Affiche la boutique
        scraper.display_shop(shop)
        
        # Sauvegarde dans un fichier JSON
        scraper.save_to_json(shop)
        
        # Calcule tes prix de vente
        print(f"\n{'='*60}")
        print("TES PRIX DE VENTE (Marge 50%)")
        print(f"{'='*60}\n")
        
        items_with_prices = scraper.get_items_with_prices(shop, margin=0.50)
        if items_with_prices:
            for item in items_with_prices[:10]:  # Afficher seulement les 10 premiers
                print(f"🎮 {item['name']}")
                print(f"   V-Bucks: {item['vbucks']}")
                print(f"   Ton coût: {item['your_cost']}€")
                print(f"   Prix vente: {item['selling_price']}€")
                print(f"   Profit: {item['profit']}€")
                print()

