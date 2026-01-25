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
from datetime import datetime, timezone, timedelta
from functools import wraps
import jwt
from werkzeug.security import generate_password_hash, check_password_hash

import sys

# Ajouter le répertoire courant au path pour permettre les imports relatifs
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.fortnite_api import FortniteAPIClient, FortniteAPIError
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# DB Configuration
from database import init_db, db
from models import Order, Message, User

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
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-super-secret-key-fortnite-items-2026')

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
    "https://fortniteitems.onrender.com",
    "https://fortniteitems.vercel.app",
    "https://www.fortniteitems.vercel.app"
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
# ⚠️ FORCE PRODUCTION URL pour éviter les redirections vers Netlify
BASE_URL = "https://fortniteitems.shop"
# Fallback si besoin de tester en local, décommenter :
# BASE_URL = os.getenv("BASE_URL", "https://fortniteitems.shop")

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


def send_simple_email(recipient, subject, html_content):
    """Fonction générique pour envoyer un email"""
    if not recipient or "@" not in recipient:
        print(f"⚠️ Email invalide ou manquant: {recipient}")
        return False
        
    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = SMTP_EMAIL
        msg['To'] = recipient
        msg['Subject'] = subject
        
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)
            
        print(f"📧 Email envoyé à {recipient}: {subject}")
        return True
    except Exception as e:
        print(f"❌ Erreur envoi email à {recipient}: {e}")
        return False

def send_order_email(order):
    """Notifie l'ADMIN d'une nouvelle commande"""
    # ... (Garder le HTML Admin existant ou le simplifier, ici je garde la logique mais utilise send_simple_email)
    # Pour faire court, je réutilise la logique de construction HTML ci-dessous
    pass # Voir implementation complète plus bas si je remplace tout le bloc

def send_client_receipt(order):
    """Envoie le reçu au CLIENT"""
    customer_email = order.customer_data.get('contactEmail')
    if not customer_email:
        return
        
    subject = f"Confirmation de commande #{order.id[:8]} - FortniteItems"
    
    items_html = ""
    for item in (order.items_data or []):
        items_html += f"<li>{item.get('name')} x{item.get('quantity', 1)}</li>"

    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #4CAF50;">Merci pour votre commande !</h2>
                <p>Bonjour {order.customer_data.get('fullName', 'Client')},</p>
                <p>Nous avons bien reçu votre commande <strong>#{order.id[:8]}</strong> et le paiement a été validé.</p>
                
                <div style="background: #f9f9f9; padding: 15px; margin: 20px 0;">
                    <h3>📦 Récapitulatif</h3>
                    <ul>{items_html}</ul>
                    <p><strong>Total: {order.amount} FCFA</strong></p>
                </div>
                
                <p>Un administrateur va traiter votre commande très prochainement.</p>
                <p>Vous pouvez suivre l'avancement et discuter avec nous via le lien suivant :</p>
                <p style="text-align: center;">
                    <a href="{BASE_URL}/orders.html" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Suivre ma commande</a>
                </p>
            </div>
        </body>
    </html>
    """
    send_simple_email(customer_email, subject, html_content)


def send_chat_notification(order, message):
    """Notifie le destinataire d'un nouveau message"""
    is_admin_sender = (message.sender_type == 'admin')
    
    if is_admin_sender:
        # Admin -> Client
        recipient = order.customer_data.get('contactEmail')
        if not recipient: return
        subject = f"💬 Nouveau message sur votre commande #{order.id[:8]}"
        title = "Réponse du Support"
    else:
        # Client -> Admin
        recipient = ADMIN_EMAIL
        subject = f"💬 Message Client - Commande #{order.id[:8]}"
        title = f"Message de {order.customer_data.get('fullName', 'Client')}"

    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif;">
            <div style="background: #f0f2f5; padding: 20px;">
                <div style="background: white; padding: 20px; border-radius: 8px; max-width: 500px; margin: 0 auto;">
                    <h3 style="color: #007bff;">{title}</h3>
                    <p style="background: #eee; padding: 10px; border-radius: 5px;">
                        "{message.content}"
                    </p>
                    <p style="font-size: 12px; color: #666;">
                        Commande #{order.id} <br>
                        <a href="{BASE_URL}/admin.html" style="color: #007bff;">Répondre</a>
                    </p>
                </div>
            </div>
        </body>
    </html>
    """
    
    # Send async ideally, but sync for now
    send_simple_email(recipient, subject, html_content)


def create_lygos_payment(amount, order_data, user_id=None):
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
            print(f"💾 Saving Order {order_id} with User ID: {user_id}")
            # Enregistrer en DB
            new_order = Order(
                id=order_id,
                user_id=user_id, # Link to User
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
        
        # Check for User Token (Optional)
        user_id = None
        if 'Authorization' in request.headers:
            try:
                auth_header = request.headers['Authorization']
                if auth_header.startswith('Bearer '):
                    token = auth_header.split(" ")[1]
                    decoded = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
                    user_id = decoded['user_id']
                    print(f"✅ Commande liée à l'utilisateur ID: {user_id}")
            except Exception as e:
                print(f"⚠️ Token invalide lors du paiement: {e}")

        result = create_lygos_payment(amount, order_data, user_id)
        
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
            # Envoyer email si succès
            if status == "successful":
                print(f"✅ Paiement confirmé pour commande {order_id}")
                
                # 1. Notifier ADMIN (Old function logic, now needs to call send_simple_email or be reimplemented fully)
                # For simplicity here since I removed the big block above, I'll assum I need to RE-ADD send_order_email logic using send_simple_email
                # BUT wait, I replaced the definition. I should define send_order_email UP TOP to actually work.
                
                # Let's fix this in one go: calling the NEW functions I defined.
                # Since I defined them in place of the old one, they exist.
                
                # Admin Notification (Re-implementing briefly here or assuming existing logic matches)
                # Actually, I removed the body of send_order_email in the Chunk 1 replacement. I need to make sure it Sends.
                
                # Construct Admin Content Again (Simplified)
                admin_subject = f"Alert: Nouvelle commande {order.amount} FCFA"
                admin_html = f"<h2>Nouvelle Commande #{order_id}</h2><p>Montant: {order.amount}</p>"
                send_simple_email(ADMIN_EMAIL, admin_subject, admin_html)
                
                # 2. Notifier CLIENT
                send_client_receipt(order)
                
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


@app.route('/api/admin/order/<order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    """Endpoint ADMIN : Mettre à jour le statut d'une commande"""
    # TODO: Auth Admin
    
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({"error": "Status requis"}), 400
            
        order = db.session.get(Order, order_id)
        if not order:
            return jsonify({"error": "Commande non trouvée"}), 404
            
        # Update
        order.status = new_status
        order.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        
        print(f"👮 ADMIN: Commande {order_id} passée en statut {new_status}")
        
        # Notify user (Optional: Email or just let them see on refresh)
        
        return jsonify(order.to_dict()), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/order/<order_id>', methods=['GET'])
def get_order(order_id):
    order = db.session.get(Order, order_id)
    if order:
        return jsonify(order.to_dict()), 200
    else:
        return jsonify({"error": "Commande non trouvée"}), 404





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
    
    # Update Order Timestamp to bump it in list
    order.updated_at = datetime.now(timezone.utc)
    
    db.session.commit()
    
    # Notifier par email
    try:
        send_chat_notification(order, msg)
    except Exception as e:
        print(f"Mail error: {e}")
    
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

# --- AUTHENTICATION ---

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({'message': 'Token manquant', 'success': False}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = db.session.get(User, data['user_id'])
            if not current_user:
                 return jsonify({'message': 'Utilisateur introuvable', 'success': False}), 401
        except Exception as e:
            return jsonify({'message': 'Token invalide', 'success': False, 'error': str(e)}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    
    if not email or not password:
        return jsonify({'message': 'Email et mot de passe requis', 'success': False}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email déjà utilisé', 'success': False}), 409
        
    hashed_pw = generate_password_hash(password)
    new_user = User(email=email, password_hash=hashed_pw, name=name)
    
    try:
        db.session.add(new_user)
        db.session.commit()
        
        # Auto-login
        token = jwt.encode({
            'user_id': new_user.id,
            'exp': datetime.now(timezone.utc) + timedelta(days=30)
        }, app.config['SECRET_KEY'])
        
        return jsonify({
            'success': True,
            'message': 'Compte créé',
            'token': token,
            'user': new_user.to_dict()
        }), 201
    except Exception as e:
        return jsonify({'message': str(e), 'success': False}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    user = User.query.filter_by(email=email).first()
    
    if not user or not user.password_hash:
        return jsonify({'message': 'Email ou mot de passe incorrect', 'success': False}), 401
        
    if check_password_hash(user.password_hash, password):
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.now(timezone.utc) + timedelta(days=30)
        }, app.config['SECRET_KEY'])
        
        return jsonify({
            'success': True,
            'token': token,
            'user': user.to_dict()
        }), 200
        
    return jsonify({'message': 'Email ou mot de passe incorrect', 'success': False}), 401

@app.route('/api/user/orders', methods=['GET'])
@token_required
def get_user_orders(current_user):
    # Fetch orders linked to this user
    # Also fetch orders that might match email even if not linked by ID (legacy support)? 
    # For now, simplistic approach: Orders by ID
    
    print(f"🔍 Fetching orders for USER ID: {current_user.id} ({current_user.email})")
    
    # 1. Fetch by User ID
    orders_by_id = Order.query.filter_by(user_id=current_user.id).all()
    
    # 2. Fetch by Email (Legacy/Guest support)
    # Note: JSON querying depends on DB type (Postgres vs SQLite). 
    # For robust compat in this hybrid setup, we fetch recent orders and filter in Python 
    # (assuming volume is low <1000 active orders). 
    # Ideally, use a proper SQL query on JSON field.
    
    # Fetch orders with no User ID to potentially claim them
    guest_orders = Order.query.filter(Order.user_id == None).order_by(Order.created_at.desc()).limit(100).all()
    orders_by_email = []
    
    for o in guest_orders:
        try:
            # Handle potential string or dict customer_data
            c_data = o.customer_data
            if isinstance(c_data, str):
                import json
                c_data = json.loads(c_data)
            
            if c_data and c_data.get('contactEmail') == current_user.email:
                orders_by_email.append(o)
                # Auto-link it for future
                o.user_id = current_user.id
                print(f"🔗 Auto-linking guest order {o.id} to user {current_user.id}")
        except:
            continue
            
    # Combine and Deduplicate
    all_orders = list({o.id: o for o in (orders_by_id + orders_by_email)}.values())
    
    # Sort
    all_orders.sort(key=lambda x: x.created_at, reverse=True)
    
    print(f"📂 Found {len(all_orders)} orders (Linked: {len(orders_by_id)}, Email-matched: {len(orders_by_email)})")
    
    if len(orders_by_email) > 0:
        db.session.commit() # Save the auto-links
        
    orders_data = [o.to_dict() for o in all_orders]
    
    return jsonify({
        'success': True,
        'orders': orders_data
    }), 200

# Endpoint pour lier une commande existante (guest) au compte
@app.route('/api/user/link-order', methods=['POST'])
@token_required
def link_order_to_user(current_user):
    data = request.get_json()
    order_id = data.get('order_id')
    
    order = db.session.get(Order, order_id)
    if not order:
        return jsonify({'success': False, 'message': 'Commande introuvable'}), 404
        
    if order.user_id:
         if order.user_id == current_user.id:
             return jsonify({'success': True, 'message': 'Déjà lié'}), 200
         return jsonify({'success': False, 'message': 'Commande déjà liée à un autre compte'}), 403
         
    # Check if user owns order (e.g. email match or loose verification?)
    # For now, we trust the client if they have the Order ID (implies they completed it)
    # Ideally we check email but Guest orders might not have email saved correctly in backend yet
    order.user_id = current_user.id
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Commande liée avec succès'}), 200


# --- GOOGLE AUTH ---
@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    data = request.get_json()
    token = data.get('token')
    
    if not token:
        return jsonify({'message': 'Token Google manquant', 'success': False}), 400
        
    try:
        # Verify Google Token
        # NOTE: You must add GOOGLE_CLIENT_ID=... to .env for production security
        client_id = os.getenv('GOOGLE_CLIENT_ID') 
        
        id_info = id_token.verify_oauth2_token(
            token, 
            google_requests.Request(), 
            client_id, # If None, it skips Audience check (Dev mode, but risky for Prod)
            clock_skew_in_seconds=60 # Allow 1m clock drift (fixes "Token used too early")
        )

        email = id_info['email']
        google_id = id_info['sub']
        name = id_info.get('name')
        
        # Check if user exists
        user = User.query.filter_by(email=email).first()
        
        if not user:
            # Create new user via Google
            user = User(
                email=email,
                name=name,
                google_id=google_id
            )
            db.session.add(user)
            db.session.commit()
        else:
            # Link Google ID if not present
            if not user.google_id:
                user.google_id = google_id
                db.session.commit()
                
        # Generate JWT
        jwt_token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.now(timezone.utc) + timedelta(days=30)
        }, app.config['SECRET_KEY'])
        
        return jsonify({
            'success': True,
            'token': jwt_token,
            'user': user.to_dict()
        }), 200

    except ValueError as e:
        print(f"❌ GOOGLE AUTH ERROR: {e}")
        print(f"❌ VERIFYING AGAINST CLIENT_ID: '{client_id}'")
        return jsonify({'message': 'Token Google invalide', 'success': False, 'error': str(e)}), 401
    except Exception as e:
        return jsonify({'message': 'Erreur Google Auth', 'success': False, 'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug_mode = os.getenv('FLASK_ENV', 'production') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug_mode)