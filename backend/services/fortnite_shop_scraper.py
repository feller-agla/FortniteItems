import requests
import json
from datetime import datetime
from typing import Dict, Any, Optional, List


class FortniteShopScraper:
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialise le scraper de la boutique Fortnite
        api_key: Optionnel pour FortniteAPI.io (recommandé pour plus de requêtes)
        """
        self.base_url = "https://fortnite-api.com/v2/shop/"
        self.api_key = api_key
        
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
        for entry in entries:
            parsed = self.parse_entry(entry, "Shop")
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
    
    def parse_entry(self, entry: Dict[str, Any], section: str) -> List[Dict[str, Any]]:
        """
        Parse une entrée de la boutique
        """
        items = []
        
        final_price = entry.get('finalPrice', 0)
        regular_price = entry.get('regularPrice', 0)
        
        # Les items Battle Royale sont dans 'brItems'
        br_items = entry.get('brItems', [])
        for br_item in br_items:
            item_data = {
                'section': section,
                'name': br_item.get('name', 'N/A'),
                'description': br_item.get('description', ''),
                'type': br_item.get('type', {}).get('displayValue', 'N/A'),
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
            item_data = {
                'section': section,
                'name': car_item.get('name', 'N/A'),
                'description': car_item.get('description', ''),
                'type': car_item.get('type', {}).get('displayValue', 'N/A'),
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

