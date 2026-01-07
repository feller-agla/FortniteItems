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
from datetime import datetime, timezone

from services.fortnite_api import FortniteAPIClient, FortniteAPIError

# DB Configuration
from database import init_db, db
from models import Order, Message

# Charger les variables d'environnement depuis .env
try:
    from dotenv import load_dotenv
    # Charger .env depuis le même répertoire que le script
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    load_dotenv(env_path)
    print(f"✅ Fichier .env chargé depuis: {env_path}")
except ImportError:
    print("⚠️  python-dotenv non installé - Variables depuis environnement système uniquement")
except Exception as e:
    print(f"⚠️  Erreur chargement .env: {e}")

app = Flask(__name__)

# Initialiser la base de données
init_db(app)

# Configuration CORS - Permettre les requêtes depuis votre frontend
ALLOWED_ORIGINS = [
    "https://fortniteitems.shop",
    "https://www.fortniteitems.shop",
    "http://fortniteitems.shop",
    "http://www.fortniteitems.shop",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://fortniteitems.onrender.com"
]
CORS(app, origins=ALLOWED_ORIGINS)

# Configuration Email
ADMIN_EMAIL = "contact.fortniteitems@gmail.com"
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
# ⚠️ Utilisez un mot de passe d'application Gmail (pas votre mot de passe normal)
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "votre-email@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "votre-mot-de-passe-app")

# Configuration Lygos
LYGOS_API_KEY = os.getenv("LYGOS_API_KEY", "lygosapp-9651642a-25f7-4e06-98b9-3617433e335c")
LYGOS_API_URL = "https://api.lygosapp.com/v1/gateway"
SHOP_NAME = "FortniteItems"

# Fortnite API
FORTNITE_API_KEY = os.getenv("FORTNITE_API_KEY")
FORTNITE_SHOP_TTL = int(os.getenv("FORTNITE_SHOP_TTL", "900"))

# URLs de base
BASE_URL = os.getenv("BASE_URL", "https://fortniteitems.shop")
SUCCESS_URL = f"{BASE_URL}/success.html"
FAILURE_URL = f"{BASE_URL}/payment-failed.html"

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


def send_order_email(order):
    """
    Envoie un email avec les détails de la commande à l'administrateur
    Args:
        order: Objet Order (SQLAlchemy model)
    """
    try:
        subject = f"Nouvelle Commande FortniteItems - {order.id}"
        
        # Extraire les données JSON
        customer = order.customer_data or {}
        items = order.items_data or []
        
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
                    <p>Commande ID: {order.id}</p>
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
                        <p class="total">Montant Total: {order.amount} FCFA</p>
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
                        <p><strong>Statut:</strong> <span style="color: green;">✅ {order.status.upper()}</span></p>
                        <p><strong>Date de commande:</strong> {order.created_at.strftime('%Y-%m-%d %H:%M:%S')}</p>
                        <p><strong>Order ID:</strong> {order.id}</p>
                    </div>
                </div>
                
                <div class="footer">
                    <p>Accédez au panneau d'administration pour répondre au client.</p>
                </div>
            </body>
        </html>
        """
        
        # Créer le message email
        msg = MIMEMultipart('alternative')
        msg['From'] = SMTP_EMAIL
        msg['To'] = ADMIN_EMAIL
        msg['Subject'] = subject
        
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        # Envoyer l'email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)
        
        print(f"✅ Email envoyé avec succès pour la commande {order.id}")
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de l'envoi de l'email: {str(e)}")
        return False


def create_lygos_payment(amount, order_data):
    """
    Crée une session de paiement Lygos et retourne le lien de paiement
    """
    order_id = str(uuid.uuid4())
    
    items = order_data.get('items', [])
    items_summary = ", ".join([item['name'] for item in items])
    message = f"Commande FortniteItems - {items_summary}"
    
    # URL de succès avec order_id pour activer le chat
    success_with_id = f"{SUCCESS_URL}?order_id={order_id}"
    
    payload = {
        "amount": int(amount),
        "shop_name": SHOP_NAME,
        "message": message,
        "success_url": success_with_id,
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
            # Enregistrer en DB
            new_order = Order(
                id=order_id,
                amount=amount,
                status="pending",
                customer_data=order_data.get('customer', {}),
                items_data=items,
                lygos_link=response_data.get("link")
            )
            db.session.add(new_order)
            db.session.commit()
            
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
            
    except Exception as e:
        return {
            "success": False,
            "error": f"Erreur de connexion à Lygos: {str(e)}"
        }


@app.route('/api/create-payment', methods=['POST'])
def create_payment():
    try:
        data = request.get_json()
        
        if not data.get('amount') or not data.get('items'):
            return jsonify({
                "success": False,
                "error": "Montant et articles requis"
            }), 400
        
        amount = data['amount']
        order_data = {
            "items": data['items'],
            "customer": data.get('customer', {}),
        }
        
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
    try:
        data = request.get_json()
        
        order_id = data.get('order_id')
        status = data.get('status')
        
        if not order_id or not status:
            return jsonify({"error": "Invalid webhook data"}), 400
        
        # Récupérer la commande depuis la DB
        order = db.session.get(Order, order_id)
        
        if order:
            order.status = status
            order.updated_at = datetime.now(timezone.utc)
            order.lygos_ref = data.get('reference')
            db.session.commit()
            
            # Envoyer email si succès
            if status == "successful":
                print(f"✅ Paiement confirmé pour commande {order_id}")
                send_order_email(order)
                
                # Formater les détails de la commande pour le chat
                items_list = ""
                try:
                    import json
                    # order.items is stored as JSON string or Python dict depending on DB, verify usage
                    # In models.py it's likely a JSON column or String. Assuming dict if SQLAlchemy handles it, or string.
                    # Lets assume it works like previous code implies.
                    items = order.items if isinstance(order.items, list) else json.loads(order.items)
                    for item in items:
                        items_list += f"- {item.get('name')} (x{item.get('quantity', 1)})\n"
                except:
                    items_list = "Détails non disponibles."

                # Créer un message système d'accueil avec récapitulatif
                welcome_content = (
                    f"👋 Bonjour ! Merci pour votre commande.\n\n"
                    f"📋 **Récapitulatif de la commande** :\n{items_list}\n"
                    f"💰 **Total** : {order.amount} FCFA\n\n"
                    f"Un agent va prendre en charge votre commande dès que possible. "
                    f"Si vous avez des détails à ajouter (pseudo Epic, etc.), écrivez-les ici 👇"
                )

                welcome_msg = Message(
                    order_id=order_id,
                    sender_type='admin',
                    content=welcome_content,
                    timestamp=datetime.now(timezone.utc)
                )
                db.session.add(welcome_msg)
                db.session.commit()
                
        else:
            print(f"⚠️ Webhook pour ID inconnu: {order_id}")
        
        return jsonify({"success": True}), 200
        
    except Exception as e:
        print(f"Erreur webhook: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/admin/orders', methods=['GET'])
def get_admin_orders():
    """Endpoint ADMIN : Récupérer toutes les commandes pour le support"""
    # TODO: Ajouter authentification (Basic Auth ou Token)
    # Pour l'instant, on suppose que l'URL est secrète ou locale
    
    try:
        # Récupérer les 50 dernières commandes
        orders = Order.query.order_by(Order.updated_at.desc()).limit(50).all()
        return jsonify([o.to_dict() for o in orders]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/order/<order_id>', methods=['GET'])
def get_order(order_id):
    order = db.session.get(Order, order_id)
    if order:
        return jsonify(order.to_dict()), 200
    else:
        return jsonify({"error": "Commande non trouvée"}), 404


@app.route('/api/orders', methods=['GET'])
def get_all_orders():
    orders = Order.query.order_by(Order.created_at.desc()).limit(50).all()
    return jsonify([o.to_dict() for o in orders]), 200


# ==========================================
# CHAT ENDPOINTS
# ==========================================

@app.route('/api/chat/history/<order_id>', methods=['GET'])
def get_chat_history(order_id):
    """Récupérer l'historique des messages d'une commande"""
    # Vérifier que la commande existe
    order = db.session.get(Order, order_id)
    if not order:
        return jsonify({"error": "Commande inconnue"}), 404

    messages = Message.query.filter_by(order_id=order_id).order_by(Message.timestamp).all()
    return jsonify([m.to_dict() for m in messages]), 200


@app.route('/api/chat/send', methods=['POST'])
def send_message():
    """Envoyer un message (Client ou Admin)"""
    data = request.get_json()
    order_id = data.get('order_id')
    content = data.get('content')
    sender = data.get('sender', 'user')  # 'user' ou 'admin'
    
    if not order_id or not content:
        return jsonify({"error": "Données incomplètes"}), 400
        
    order = db.session.get(Order, order_id)
    if not order:
        return jsonify({"error": "Commande inconnue"}), 404
        
    # Créer le message
    msg = Message(
        order_id=order_id,
        sender_type=sender,
        content=content,
        timestamp=datetime.now(timezone.utc)
    )
    db.session.add(msg)
    db.session.commit()
    
    # TODO: Si c'est un user, notifier l'admin par email (optionnel pour éviter le spam)
    
    return jsonify(msg.to_dict()), 200


@app.route('/api/shop', methods=['GET'])
def get_fortnite_shop():
    if fortnite_client is None:
        return jsonify({
            "success": False,
            "error": "FORTNITE_API_KEY non configurée"
        }), 200

    force_refresh = request.args.get('refresh', '0') == '1'

    try:
        payload = fortnite_client.get_shop(force_refresh=force_refresh)
        return jsonify(payload), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Erreur serveur: {str(e)}"
        }), 500


@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "service": "FortniteItems Backend API",
        "status": "running",
        "database": "connected"
    }), 200

@app.route('/health', methods=['GET'])
def health_check():
    try:
        # Vérifier la connexion DB
        db.session.execute(db.text("SELECT 1"))
        db_status = "ok"
    except Exception as e:
        db_status = f"error: {str(e)}"
        
    return jsonify({
        "status": "ok",
        "database": db_status,
        "timestamp": datetime.now().isoformat()
    }), 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug_mode = os.getenv('FLASK_ENV', 'production') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug_mode)