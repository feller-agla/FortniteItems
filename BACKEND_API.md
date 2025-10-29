# 🔧 Backend FortniteItems - API Lygos

## 📋 Vue d'ensemble

Backend Flask qui génère des sessions de paiement dynamiques via l'API Lygos.
Plus besoin de créer des liens manuellement pour chaque produit !

---

## 🚀 Installation

### 1. Installer les dépendances

```bash
cd /home/FeLLeRGLITCH_x/FortniteItems
pip3 install -r requirements.txt
```

### 2. Démarrer le backend

```bash
./start-backend.sh
```

Ou manuellement :
```bash
python3 lygos.py
```

Le serveur démarre sur `http://localhost:5000`

---

## 🌐 Endpoints API

### POST `/api/create-payment`
Créer une session de paiement Lygos

**Body JSON** :
```json
{
  "amount": 9000,
  "items": [
    {
      "id": "2",
      "name": "2800 V-Bucks",
      "price": 9000,
      "quantity": 1
    }
  ],
  "customer": {
    "fortniteName": "PlayerXYZ",
    "epicEmail": "player@example.com",
    "platform": "pc"
  }
}
```

**Réponse Succès** :
```json
{
  "success": true,
  "payment_link": "https://pay.lygosapp.com/xxxx",
  "order_id": "uuid-xxxxx"
}
```

**Réponse Erreur** :
```json
{
  "success": false,
  "error": "Message d'erreur"
}
```

---

### POST `/api/webhook/lygos`
Webhook pour recevoir les notifications de paiement

**Body JSON (envoyé par Lygos)** :
```json
{
  "order_id": "uuid",
  "status": "successful",
  "amount": 9000,
  "reference": "LYGOS_REF_XXX"
}
```

**Réponse** :
```json
{
  "success": true
}
```

---

### GET `/api/order/<order_id>`
Récupérer les détails d'une commande

**Exemple** :
```bash
curl http://localhost:5000/api/order/uuid-xxxxx
```

**Réponse** :
```json
{
  "order_id": "uuid",
  "amount": 9000,
  "status": "successful",
  "created_at": "2025-10-29T10:30:00",
  "customer_data": {...}
}
```

---

### GET `/api/orders`
Liste toutes les commandes (admin)

**Exemple** :
```bash
curl http://localhost:5000/api/orders
```

---

### GET `/health`
Health check de l'API

**Réponse** :
```json
{
  "status": "ok",
  "service": "FortniteItems Backend API",
  "timestamp": "2025-10-29T10:30:00"
}
```

---

## 🔄 Flux de Paiement Complet

```
1. Client clique "Payer Maintenant" sur le site
   ↓
2. Frontend envoie requête POST /api/create-payment
   ↓
3. Backend appelle l'API Lygos pour générer un lien
   ↓
4. Backend retourne le lien au frontend
   ↓
5. Frontend redirige le client vers Lygos
   ↓
6. Client effectue le paiement sur Lygos
   ↓
7. Si succès → Lygos redirige vers success.html
   Si échec → Lygos redirige vers payment-failed.html
   ↓
8. Lygos envoie webhook au backend (/api/webhook/lygos)
   ↓
9. Backend met à jour le statut de la commande
   ↓
10. Backend peut déclencher la livraison automatique
```

---

## 🔧 Configuration

### Variables dans `lygos.py`

```python
LYGOS_API_KEY = "lygosapp-9651642a-25f7-4e06-98b9-3617433e335c"  # Votre clé API
SHOP_NAME = "FortniteItems"  # Nom de votre boutique
BASE_URL = "http://localhost:8000"  # Votre domaine (en production: https://...)
```

### URLs de Redirection

- **Success** : `http://localhost:8000/success.html`
- **Failure** : `http://localhost:8000/payment-failed.html`

En production, remplacez par votre domaine réel :
```python
BASE_URL = "https://fortniteitems.com"
```

---

## 🌐 Configuration Lygos Dashboard

### 1. Configurer le Webhook

Allez dans votre dashboard Lygos et configurez l'URL de webhook :

**URL** : `https://votredomaine.com/api/webhook/lygos`

⚠️ En local, Lygos ne pourra pas envoyer les webhooks. Pour tester :
- Utilisez [ngrok](https://ngrok.com) pour exposer votre localhost
- Ou déployez sur un serveur avec domaine public

### 2. Tester avec ngrok (Local)

```bash
# Dans un nouveau terminal
ngrok http 5000

# Utilisez l'URL ngrok dans la config Lygos
# Ex: https://xxxx.ngrok.io/api/webhook/lygos
```

---

## 🧪 Tests

### Test Manuel avec curl

```bash
# Test création de paiement
curl -X POST http://localhost:5000/api/create-payment \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 9000,
    "items": [{"id":"2","name":"2800 V-Bucks","price":9000,"quantity":1}],
    "customer": {"fortniteName":"Test","epicEmail":"test@test.com","platform":"pc"}
  }'

# Test webhook (simuler Lygos)
curl -X POST http://localhost:5000/api/webhook/lygos \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "uuid-from-previous-call",
    "status": "successful",
    "amount": 9000
  }'

# Test health check
curl http://localhost:5000/health
```

### Test Frontend

1. Démarrez le backend : `./start-backend.sh`
2. Démarrez le frontend : `python3 -m http.server 8000`
3. Ouvrez `http://localhost:8000`
4. Ajoutez un produit au panier
5. Passez à la commande
6. Vérifiez que la redirection vers Lygos fonctionne

---

## 📊 Avantages de l'API vs Liens Statiques

| Feature | Liens Statiques | API Dynamique |
|---------|----------------|---------------|
| Montants variables | ❌ | ✅ |
| Plusieurs articles | ❌ | ✅ |
| Order ID custom | ❌ | ✅ |
| Webhooks fiables | ⚠️ | ✅ |
| Données client | ❌ | ✅ |
| Scalabilité | ❌ | ✅ |

---

## 🔒 Sécurité

### TODO en Production

1. **Valider les webhooks** :
   ```python
   # Vérifier la signature Lygos
   def verify_lygos_signature(request):
       signature = request.headers.get('X-Lygos-Signature')
       # Vérifier avec votre secret
   ```

2. **Utiliser HTTPS** :
   - Obligatoire pour les webhooks
   - Certificat SSL (Let's Encrypt gratuit)

3. **Base de données réelle** :
   - Remplacer `orders_db = {}` par PostgreSQL/MongoDB
   - Persister les commandes

4. **Variables d'environnement** :
   ```python
   import os
   LYGOS_API_KEY = os.getenv('LYGOS_API_KEY')
   ```

5. **Rate Limiting** :
   - Limiter les requêtes par IP
   - Prévenir les abus

---

## 🚀 Déploiement Production

### Option 1 : Heroku

```bash
# Créer Procfile
echo "web: python lygos.py" > Procfile

# Déployer
heroku create fortniteitems-backend
git push heroku main
```

### Option 2 : VPS (Ubuntu)

```bash
# Installer dépendances
sudo apt update
sudo apt install python3-pip nginx

# Installer app
cd /var/www/fortniteitems
pip3 install -r requirements.txt

# Configurer service systemd
sudo nano /etc/systemd/system/fortniteitems.service

# Configurer nginx en reverse proxy
sudo nano /etc/nginx/sites-available/fortniteitems
```

### Option 3 : Railway / Render

- Push le code sur GitHub
- Connecter Railway/Render à votre repo
- Deploy automatique

---

## 📝 TODO List

- [ ] Implémenter base de données (PostgreSQL)
- [ ] Ajouter authentification admin
- [ ] Dashboard admin pour voir les commandes
- [ ] Système d'emails automatiques
- [ ] Livraison automatique des V-Bucks
- [ ] Logs et monitoring
- [ ] Tests automatisés (pytest)
- [ ] Documentation API (Swagger)

---

## 🐛 Troubleshooting

### Erreur: Module not found

```bash
pip3 install -r requirements.txt
```

### Erreur: CORS

Vérifiez que `flask-cors` est installé et que le frontend tourne sur le bon port.

### Erreur: Connection refused

Vérifiez que le backend est bien démarré sur le port 5000.

### Webhook ne fonctionne pas en local

Normal ! Lygos ne peut pas atteindre localhost. Utilisez ngrok.

---

## 📞 Support

- API Lygos : https://docs.lygosapp.com
- Flask Docs : https://flask.palletsprojects.com
- Questions : Ouvrez une issue sur GitHub

---

**Dernière mise à jour** : 29 Octobre 2025
