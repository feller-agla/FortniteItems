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
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

from services.fortnite_api import FortniteAPIClient, FortniteAPIError

# Charger les variables d'environnement depuis .env
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("✅ Fichier .env chargé")
except ImportError:
    print("⚠️  python-dotenv non installé - Variables depuis environnement système uniquement")
except Exception as e:
    print(f"⚠️  Erreur chargement .env: {e}")

app = Flask(__name__)

# Configuration CORS - Permettre les requêtes depuis votre frontend
ALLOWED_ORIGINS = [
    "https://fortniteitems.netlify.app",
    "https://fortniteitems.shop",
    "https://www.fortniteitems.shop",
    "http://fortniteitems.shop",
    "http://www.fortniteitems.shop",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]
CORS(app, origins=ALLOWED_ORIGINS)

# Configuration Email
ADMIN_EMAIL = "contact.fortniteitems@gmail.com"
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
# ⚠️ Utilisez un mot de passe d'application Gmail (pas votre mot de passe normal)
# Créez-le sur : https://myaccount.google.com/apppasswords
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "votre-email@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "votre-mot-de-passe-app")

# Configuration Lygos - Utiliser variables d'environnement en production
LYGOS_API_KEY = os.getenv("LYGOS_API_KEY", "lygosapp-9651642a-25f7-4e06-98b9-3617433e335c")
LYGOS_API_URL = "https://api.lygosapp.com/v1/gateway"
SHOP_NAME = "FortniteItems"

# Fortnite API
FORTNITE_API_KEY = os.getenv("FORTNITE_API_KEY")
FORTNITE_SHOP_TTL = int(os.getenv("FORTNITE_SHOP_TTL", "900"))

# URLs de base - Utiliser variable d'environnement en production
BASE_URL = os.getenv("BASE_URL", "https://fortniteitems.netlify.app")
SUCCESS_URL = f"{BASE_URL}/success.html"
FAILURE_URL = f"{BASE_URL}/payment-failed.html"

# Base de données simple en mémoire (à remplacer par une vraie DB en production)
orders_db = {}

# Fortnite client
fortnite_client = None
if FORTNITE_API_KEY:
    try:
        fortnite_client = FortniteAPIClient(
            api_key=FORTNITE_API_KEY,
            cache_ttl_seconds=FORTNITE_SHOP_TTL,
        )
    except Exception as e:
        print(f"❌ Impossible d'initialiser FortniteAPIClient: {e}")
else:
    print("⚠️  FORTNITE_API_KEY non définie - endpoint /api/shop désactivé")


def send_order_email(order_details):
    """
    Envoie un email avec les détails de la commande à l'administrateur
    
    Args:
        order_details: Dict contenant toutes les infos de commande
    """
    try:
        # Préparer le contenu de l'email
        subject = f"Nouvelle Commande FortniteItems - {order_details['order_id']}"
        
        # Extraire les données client
        customer = order_details.get('customer_data', {})
        items = order_details.get('items', [])
        
        # Construire le corps HTML de l'email
        html_content = f"""
        <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; }}
                    .content {{ padding: 20px; }}
                    .section {{ margin-bottom: 20px; background: #f9f9f9; padding: 15px; border-radius: 5px; }}
                    .section h3 {{ color: #4CAF50; margin-top: 0; }}
                    table {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
                    th, td {{ padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }}
                    th {{ background-color: #4CAF50; color: white; }}
                    .total {{ font-size: 18px; font-weight: bold; color: #4CAF50; }}
                    .footer {{ background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; color: #666; }}
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🎮 Nouvelle Commande FortniteItems</h1>
                    <p>Commande ID: {order_details['order_id']}</p>
                </div>
                
                <div class="content">
                    <div class="section">
                        <h3>📦 Articles Commandés</h3>
                        <table>
                            <tr>
                                <th>Produit</th>
                                <th>Quantité</th>
                                <th>Prix Unitaire</th>
                                <th>Total</th>
                            </tr>
        """
        
        # Ajouter les articles
        for item in items:
            html_content += f"""
                            <tr>
                                <td>{item.get('name', 'N/A')}</td>
                                <td>{item.get('quantity', 1)}</td>
                                <td>{item.get('price', 0)} FCFA</td>
                                <td>{item.get('price', 0) * item.get('quantity', 1)} FCFA</td>
                            </tr>
            """
        
        html_content += f"""
                        </table>
                        <p class="total">Montant Total: {order_details.get('amount', 0)} FCFA</p>
                    </div>
                    
                    <div class="section">
                        <h3>👤 Informations Client</h3>
                        <p><strong>Nom complet:</strong> {customer.get('fullName', 'Non fourni')}</p>
                        <p><strong>Email de contact:</strong> {customer.get('contactEmail', 'Non fourni')}</p>
        """
        
        # Informations spécifiques au type de produit
        if customer.get('platform'):
            html_content += f"<p><strong>Plateforme:</strong> {customer.get('platform')}</p>"
        
        if customer.get('epicUsername'):
            html_content += f"""
                        <p><strong>🎮 Pseudo Epic Games:</strong> {customer.get('epicUsername')}</p>
                        <p><strong>📧 Email de connexion Epic:</strong> {customer.get('epicLoginEmail')}</p>
                        <p><strong> WhatsApp:</strong> {customer.get('whatsappNumber')}</p>
            """
        
        html_content += f"""
                    </div>
                    
                    <div class="section">
                        <h3>💳 Informations de Paiement</h3>
                        <p><strong>Statut:</strong> <span style="color: green;">✅ Payé</span></p>
                        <p><strong>Date de commande:</strong> {order_details.get('created_at', datetime.now().isoformat())}</p>
                        <p><strong>Order ID:</strong> {order_details['order_id']}</p>
                    </div>
                </div>
                
                <div class="footer">
                    <p>Email automatique - FortniteItems.com</p>
                    <p>Support WhatsApp: +229 65 62 36 91</p>
                </div>
            </body>
        </html>
        """
        
        # Créer le message email
        msg = MIMEMultipart('alternative')
        msg['From'] = SMTP_EMAIL
        msg['To'] = ADMIN_EMAIL
        msg['Subject'] = subject
        
        # Ajouter le contenu HTML
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        # Envoyer l'email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)
        
        print(f"✅ Email envoyé avec succès pour la commande {order_details['order_id']}")
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de l'envoi de l'email: {str(e)}")
        return False


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
            
            # ✅ Envoyer l'email si le paiement est réussi
            if status == "successful":
                print(f"✅ Paiement réussi pour commande {order_id}")
                
                # Envoyer l'email avec les détails complets
                email_sent = send_order_email(orders_db[order_id])
                
                if email_sent:
                    print(f"📧 Email de confirmation envoyé à {ADMIN_EMAIL}")
                else:
                    print(f"⚠️ Échec de l'envoi de l'email pour commande {order_id}")
        
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


@app.route('/api/shop', methods=['GET'])
def get_fortnite_shop():
    """Retourner la boutique Fortnite (cache + option refresh)."""
    if fortnite_client is None:
        # Retourner 200 avec success: false pour éviter les erreurs dans les logs
        # Le frontend gère déjà ce cas avec try/catch
        return jsonify({
            "success": False,
            "error": "FORTNITE_API_KEY non configurée - endpoint désactivé",
            "message": "Pour activer cet endpoint, configurez FORTNITE_API_KEY dans .env"
        }), 200

    force_refresh = request.args.get('refresh', '0') == '1'

    try:
        payload = fortnite_client.get_shop(force_refresh=force_refresh)
        # Retourner exactement le format que le scraper retourne
        return jsonify(payload), 200
    except FortniteAPIError as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 502
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Erreur serveur: {str(e)}"
        }), 500


@app.route('/', methods=['GET'])
def index():
    """
    Page d'accueil de l'API
    """
    return jsonify({
        "service": "FortniteItems Backend API",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "create_payment": "/api/create-payment [POST]",
            "webhook": "/api/webhook/lygos [POST]",
            "order": "/api/orders/<order_id> [GET]",
            "all_orders": "/api/orders [GET]"
        }
    }), 200


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


@app.route('/api/submit-order', methods=['POST'])
def submit_order():
    """
    Enregistrer les détails d'une commande après paiement réussi
    Vous recevrez ces informations pour traiter la commande
    """
    try:
        data = request.get_json()
        
        order_id = data.get('order_id')
        customer = data.get('customer', {})
        items = data.get('items', [])
        amount = data.get('amount')
        
        if not order_id:
            return jsonify({'success': False, 'error': 'order_id manquant'}), 400
        
        # Sauvegarder la commande complète
        order_details = {
            'order_id': order_id,
            'timestamp': datetime.now().isoformat(),
            'amount': amount,
            'items': items,
            'customer': customer,
            'status': 'payment_pending'
        }
        
        orders_db[order_id] = order_details
        
        # LOG : Afficher dans la console du serveur
        print("\n" + "="*60)
        print("🎉 NOUVELLE COMMANDE REÇUE")
        print("="*60)
        print(f"📦 Order ID: {order_id}")
        print(f"💰 Montant: {amount} FCFA")
        print(f"\n👤 INFORMATIONS CLIENT:")
        print(f"   Nom: {customer.get('fullName', 'N/A')}")
        print(f"   Email: {customer.get('contactEmail', 'N/A')}")
        print(f"   Type: {customer.get('productType', 'N/A').upper()}")
        
        if customer.get('productType') == 'crew':
            print(f"\n🎮 FORTNITE CREW:")
            print(f"   Pseudo Epic: {customer.get('epicUsername', 'N/A')}")
            print(f"   Email Epic: {customer.get('epicLoginEmail', 'N/A')}")
            print(f"   Mot de passe: {customer.get('epicPassword', 'N/A')}")
            print(f"   WhatsApp: {customer.get('whatsappNumber', 'N/A')}")
        else:
            print(f"\n💎 V-BUCKS:")
            print(f"   Plateforme: {customer.get('platform', 'N/A')}")
        
        print(f"\n📋 ARTICLES:")
        for item in items:
            print(f"   - {item.get('name')} x{item.get('quantity')} = {item.get('price')} FCFA")
        
        print("="*60 + "\n")
        
        # TODO: Envoyer une notification (email, webhook, Telegram, etc.)
        # send_notification_email(order_details)
        # send_telegram_message(order_details)
        
        return jsonify({
            'success': True,
            'message': 'Commande enregistrée avec succès',
            'order_id': order_id
        }), 200
        
    except Exception as e:
        print(f"❌ Erreur lors de l'enregistrement de la commande: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    # Utiliser le port de la variable d'environnement (Render) ou 5000 par défaut (local)
    port = int(os.getenv('PORT', 5000))
    
    print("🚀 FortniteItems Backend API démarré")
    print(f"📍 URLs de redirection:")
    print(f"   - Success: {SUCCESS_URL}")
    print(f"   - Failure: {FAILURE_URL}")
    print(f"🔑 Lygos API Key: {LYGOS_API_KEY[:20]}...")
    
    # Vérifier la configuration email
    if SMTP_EMAIL and SMTP_PASSWORD and SMTP_EMAIL != "votre-email@gmail.com":
        print(f"✅ Configuration Email: {SMTP_EMAIL}")
        print(f"📧 Les notifications seront envoyées à: {ADMIN_EMAIL}")
    else:
        print("⚠️  Configuration Email incomplète - Emails non activés")
        print("   Configurez SMTP_EMAIL et SMTP_PASSWORD dans .env")
        print("   Voir GUIDE_EMAIL_CONFIG.md pour les instructions")
    
    print(f"🌐 Serveur en écoute sur http://0.0.0.0:{port}")
    
    # En production (Render), debug=False
    debug_mode = os.getenv('FLASK_ENV', 'production') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug_mode)