import requests
import json
from datetime import datetime

class FortniteShopScraper:
    def __init__(self, api_key=None):
        """
        Initialise le scraper de la boutique Fortnite
        api_key: Optionnel pour FortniteAPI.io (recommandé pour plus de requêtes)
        """
        self.base_url = "https://fortnite-api.com/v2/shop/"
        self.api_key = api_key
        
    def get_shop(self, language="fr"):
        """
        Récupère les données de la boutique actuelle
        language: Code langue (fr, en, es, etc.)
        """
        try:
            headers = {}
            if self.api_key:
                headers['Authorization'] = self.api_key
            
            params = {'language': language}
            
            response = requests.get(self.base_url, headers=headers, params=params)
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
    
    def parse_shop_data(self, shop_data):
        """
        Parse et structure les données de la boutique
        """
        items = []
        
        # Parcours des entrées de la boutique (structure API v2)
        entries = shop_data.get('entries', [])
        for entry in entries:
            items.extend(self.parse_entry(entry, "Shop"))
        
        return {
            'date': shop_data.get('date', datetime.now().isoformat()),
            'total_items': len(items),
            'items': items
        }
    
    def parse_entry(self, entry, section):
        """
        Parse une entrée de la boutique
        """
        items = []
        
        # Les items sont dans 'brItems' (Battle Royale items)
        br_items = entry.get('brItems', [])
        if not br_items:
            return items
        
        final_price = entry.get('finalPrice', 0)
        regular_price = entry.get('regularPrice', 0)
        
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
                }
            }
            items.append(item_data)
        
        return items
    
    def display_shop(self, shop_data):
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
    
    def save_to_json(self, shop_data, filename="fortnite_shop.json"):
        """
        Sauvegarde les données dans un fichier JSON
        """
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(shop_data, f, indent=2, ensure_ascii=False)
            print(f"✅ Données sauvegardées dans {filename}")
        except Exception as e:
            print(f"❌ Erreur lors de la sauvegarde: {e}")
    
    def calculate_selling_price(self, vbucks, margin=0.50):
        """
        Calcule ton prix de vente basé sur les V-Bucks
        vbucks: Nombre de V-Bucks
        margin: Marge bénéficiaire (0.50 = 50%)
        """
        cost_per_vbuck = 0.00357  # Basé sur 13500 V-Bucks pour 48.26€
        cost = vbucks * cost_per_vbuck
        selling_price = cost * (1 + margin)
        return round(selling_price, 2)
    
    def get_items_with_prices(self, shop_data, margin=0.50):
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
    # Initialise le scraper (ajoute ta clé API si tu en as une)
    scraper = FortniteShopScraper()
    
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
        for item in items_with_prices:
            print(f"🎮 {item['name']}")
            print(f"   V-Bucks: {item['vbucks']}")
            print(f"   Ton coût: {item['your_cost']}€")
            print(f"   Prix vente: {item['selling_price']}€")
            print(f"   Profit: {item['profit']}€")
            print()
