"""
Backend API pour FortniteItems - Intégration Lygos Payment Gateway
Génère des sessions de paiement dynamiques pour chaque commande
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import uuid
import json
import os
from datetime import datetime

app = Flask(__name__)

# Configuration CORS - Permettre les requêtes depuis votre frontend
ALLOWED_ORIGINS = [
    "https://fortniteitems.netlify.app",
    "http://localhost:8000",
    "http://127.0.0.1:8000"
]
CORS(app, origins=ALLOWED_ORIGINS)

# Configuration Lygos - Utiliser variables d'environnement en production
LYGOS_API_KEY = os.getenv("LYGOS_API_KEY", "lygosapp-9651642a-25f7-4e06-98b9-3617433e335c")
LYGOS_API_URL = "https://api.lygosapp.com/v1/gateway"
SHOP_NAME = "FortniteItems"

# URLs de base - Utiliser variable d'environnement en production
BASE_URL = os.getenv("BASE_URL", "https://fortniteitems.netlify.app")
SUCCESS_URL = f"{BASE_URL}/success.html"
FAILURE_URL = f"{BASE_URL}/payment-failed.html"

# Base de données simple en mémoire (à remplacer par une vraie DB en production)
orders_db = {}


def create_lygos_payment(amount, order_data):
    """
    Crée une session de paiement Lygos et retourne le lien de paiement
    
    Args:
        amount: Montant en FCFA
        order_data: Dict contenant les infos de commande (items, client, etc.)
    
    Returns:
        dict: {
            'success': bool,
            'payment_link': str,
            'order_id': str,
            'error': str (si échec)
        }
    """
    order_id = str(uuid.uuid4())
    
    # Construire le message personnalisé
    items_summary = ", ".join([item['name'] for item in order_data.get('items', [])])
    message = f"Commande FortniteItems - {items_summary} | Support: +229 65 62 36 91"
    
    payload = {
        "amount": int(amount),
        "shop_name": SHOP_NAME,
        "message": message,
        "success_url": SUCCESS_URL,
        "failure_url": FAILURE_URL,
        "order_id": order_id
    }
    
    headers = {
        "api-key": LYGOS_API_KEY,
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(LYGOS_API_URL, json=payload, headers=headers, timeout=10)
        response_data = response.json()
        
        if response.status_code == 200 and response_data.get("link"):
            # Sauvegarder la commande dans la "base de données"
            orders_db[order_id] = {
                "order_id": order_id,
                "amount": amount,
                "status": "pending",
                "created_at": datetime.now().isoformat(),
                "customer_data": order_data,
                "lygos_link": response_data.get("link")
            }
            
            return {
                "success": True,
                "payment_link": response_data.get("link"),
                "order_id": order_id
            }
        else:
            return {
                "success": False,
                "error": response_data.get("message", "Erreur lors de la création du paiement")
            }
            
    except requests.exceptions.RequestException as e:
        return {
            "success": False,
            "error": f"Erreur de connexion à Lygos: {str(e)}"
        }


@app.route('/api/create-payment', methods=['POST'])
def create_payment():
    """
    Endpoint pour créer une session de paiement
    
    Body JSON attendu:
    {
        "amount": 9000,
        "items": [
            {"id": "2", "name": "2800 V-Bucks", "price": 9000, "quantity": 1}
        ],
        "customer": {
            "fortniteName": "PlayerXYZ",
            "epicEmail": "player@example.com",
            "platform": "pc"
        }
    }
    """
    try:
        data = request.get_json()
        
        # Validation
        if not data.get('amount') or not data.get('items'):
            return jsonify({
                "success": False,
                "error": "Montant et articles requis"
            }), 400
        
        amount = data['amount']
        order_data = {
            "items": data['items'],
            "customer": data.get('customer', {}),
            "timestamp": datetime.now().isoformat()
        }
        
        # Créer le paiement Lygos
        result = create_lygos_payment(amount, order_data)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Erreur serveur: {str(e)}"
        }), 500


@app.route('/api/webhook/lygos', methods=['POST'])
def lygos_webhook():
    """
    Webhook pour recevoir les notifications de paiement de Lygos
    
    Body JSON reçu de Lygos:
    {
        "order_id": "uuid",
        "status": "successful" | "failed",
        "amount": 9000,
        "reference": "LYGOS_REF_XXX",
        ...
    }
    """
    try:
        data = request.get_json()
        
        order_id = data.get('order_id')
        status = data.get('status')
        
        if not order_id or not status:
            return jsonify({"error": "Invalid webhook data"}), 400
        
        # Mettre à jour la commande
        if order_id in orders_db:
            orders_db[order_id]['status'] = status
            orders_db[order_id]['updated_at'] = datetime.now().isoformat()
            orders_db[order_id]['lygos_response'] = data
            
            # TODO: Si status == "successful", livrer les V-Bucks automatiquement
            if status == "successful":
                # Logique de livraison ici
                print(f"✅ Paiement réussi pour commande {order_id}")
                # deliver_vbucks(orders_db[order_id]['customer_data'])
        
        return jsonify({"success": True}), 200
        
    except Exception as e:
        print(f"Erreur webhook: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/order/<order_id>', methods=['GET'])
def get_order(order_id):
    """
    Récupérer les détails d'une commande
    """
    if order_id in orders_db:
        return jsonify(orders_db[order_id]), 200
    else:
        return jsonify({"error": "Commande non trouvée"}), 404


@app.route('/api/orders', methods=['GET'])
def get_all_orders():
    """
    Récupérer toutes les commandes (pour admin)
    """
    return jsonify(list(orders_db.values())), 200


@app.route('/health', methods=['GET'])
def health_check():
    """
    Vérifier que l'API est en ligne
    """
    return jsonify({
        "status": "ok",
        "service": "FortniteItems Backend API",
        "timestamp": datetime.now().isoformat()
    }), 200


if __name__ == '__main__':
    print("🚀 FortniteItems Backend API démarré")
    print(f"📍 URLs de redirection:")
    print(f"   - Success: {SUCCESS_URL}")
    print(f"   - Failure: {FAILURE_URL}")
    print(f"🔑 Lygos API Key: {LYGOS_API_KEY[:20]}...")
    print(f"🌐 Serveur en écoute sur http://0.0.0.0:5000")
    
    app.run(host='0.0.0.0', port=5000, debug=True)