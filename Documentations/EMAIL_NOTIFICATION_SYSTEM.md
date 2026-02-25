# 📧 Système de Notification Email Automatique

## Vue d'ensemble

Ce système envoie automatiquement un email détaillé à **aglaalberic@gmail.com** à chaque fois qu'un client termine un paiement avec succès sur FortniteItems.

---

## 🔄 Flux de Fonctionnement

```
1. Client remplit le formulaire de commande
   ↓
2. Redirection vers Lygos Payment
   ↓
3. Client effectue le paiement
   ↓
4. Lygos envoie webhook au backend → status: "successful"
   ↓
5. Backend reçoit webhook
   ↓
6. Backend envoie email automatique avec tous les détails
   ↓
7. Email reçu sur aglaalberic@gmail.com
```

---

## ✅ Ce Qui Est Inclus dans l'Email

### 📦 Articles Commandés
- Nom du produit
- Quantité
- Prix unitaire
- Prix total
- **Montant total en FCFA**

### 👤 Informations Client

#### Pour les V-Bucks:
- Nom complet
- Email de contact
- Plateforme (Xbox, PS, PC, Switch, Mobile)

#### Pour Fortnite club:
- Nom complet
- Email de contact
- **Pseudo Epic Games**
- **Email de connexion Epic**
- **Mot de passe Epic**
- **Numéro WhatsApp**

### 💳 Informations de Paiement
- Statut: ✅ Payé
- Date de commande
- Order ID unique

---

## 🚀 Configuration

### 1. Configuration Gmail

**Voir le guide complet**: [GUIDE_EMAIL_CONFIG.md](./GUIDE_EMAIL_CONFIG.md)

**Résumé rapide**:
1. Activez la validation en 2 étapes Gmail
2. Générez un mot de passe d'application: https://myaccount.google.com/apppasswords
3. Ajoutez les variables d'environnement

### 2. Variables d'Environnement

#### Fichier `.env` (local)
```bash
SMTP_EMAIL=aglaalberic@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-application-16-caracteres
```

#### Render.com (production)
1. Dashboard → Service → Environment
2. Ajoutez:
   - `SMTP_EMAIL` = `aglaalberic@gmail.com`
   - `SMTP_PASSWORD` = `[mot de passe d'application]`

### 3. Test de Configuration

```bash
# Installer les dépendances si nécessaire
pip install python-dotenv

# Configurer .env avec vos credentials

# Lancer le test
python3 test_email.py
```

Vous devriez voir:
```
✅ EMAIL ENVOYÉ AVEC SUCCÈS !
📬 Vérifiez votre boîte email: aglaalberic@gmail.com
```

---

## 📁 Fichiers Modifiés

### Backend (`lygos.py`)
- **Ajouté**: Import `smtplib`, `email.mime`
- **Ajouté**: Variables `SMTP_EMAIL`, `SMTP_PASSWORD`, `ADMIN_EMAIL`
- **Ajouté**: Fonction `send_order_email(order_details)` - Génère et envoie l'email HTML
- **Modifié**: Route `/api/webhook/lygos` - Appelle `send_order_email()` quand `status='successful'`

### Frontend (`checkout.js`)
- **Retiré**: Appel à `/api/submit-order` lors de la création du lien de paiement
- **Conservé**: Sauvegarde des détails dans `localStorage` pour envoi ultérieur

### Frontend (`success.html`)
- **Ajouté**: Appel à `/api/submit-order` lors du chargement de la page
- **Modifié**: Affichage dynamique des infos client (V-Bucks vs club)
- **Ajouté**: Logs de débogage pour suivre l'envoi

### Configuration
- **Modifié**: `.env.example` - Ajout des variables SMTP
- **Créé**: `GUIDE_EMAIL_CONFIG.md` - Guide complet de configuration
- **Créé**: `test_email.py` - Script de test email
- **Créé**: `EMAIL_NOTIFICATION_SYSTEM.md` - Cette documentation

---

## 🧪 Tests

### Test 1: Configuration Email
```bash
python3 test_email.py
```

### Test 2: Webhook Simulé
```bash
# Créez d'abord une commande test via l'interface

# Simulez le webhook Lygos
curl -X POST http://localhost:5000/api/webhook/lygos \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "test-order-id",
    "status": "successful",
    "amount": 9000
  }'
```

### Test 3: Commande Complète (Sandbox)
1. Frontend: http://localhost:8000
2. Ajoutez un produit au panier
3. Remplissez le formulaire
4. **N'utilisez PAS de vraies données de paiement**
5. Une fois sur success.html, vérifiez les logs backend
6. Vérifiez votre email

---

## 🔍 Débogage

### Vérifier les Logs

```bash
# Backend local
python3 lygos.py

# Recherchez ces messages:
✅ Email envoyé avec succès pour la commande [order_id]
📧 Email de confirmation envoyé à aglaalberic@gmail.com
```

### Problèmes Courants

#### Email non reçu
- ✅ Vérifiez le dossier **Spam**
- ✅ Vérifiez les logs backend pour voir si envoyé
- ✅ Testez avec `test_email.py`

#### Erreur d'authentification
```
SMTPAuthenticationError: Username and Password not accepted
```
**Solution**: Utilisez un mot de passe d'application, pas votre mot de passe Gmail normal

#### Variables d'environnement non chargées
```bash
# Vérifiez le fichier .env
cat .env | grep SMTP

# Devrait afficher:
SMTP_EMAIL=aglaalberic@gmail.com
SMTP_PASSWORD=votremotdepasse
```

---

## 📊 Monitoring Production

### Sur Render.com

1. **Logs**: Dashboard → Service → Logs
2. **Recherchez**: 
   - `✅ Email envoyé avec succès`
   - `❌ Erreur lors de l'envoi`
3. **Alertes**: Configurez des alertes pour les erreurs email

### Statistiques Gmail

- Gmail limite: **500 emails/jour** (largement suffisant)
- Vérifiez l'historique dans Gmail > Paramètres > Filtres

---

## 🔐 Sécurité

### ✅ Bonnes Pratiques Appliquées

1. **Mots de passe d'application**: Utilisés au lieu du mot de passe Gmail principal
2. **Variables d'environnement**: Credentials jamais dans le code
3. **`.gitignore`**: `.env` n'est jamais commité
4. **HTTPS/TLS**: Communication SMTP chiffrée (port 587 avec STARTTLS)

### 🚨 En Cas de Compromission

1. Allez sur: https://myaccount.google.com/apppasswords
2. Supprimez le mot de passe "FortniteItems Backend"
3. Générez-en un nouveau
4. Mettez à jour les variables d'environnement

---

## 📈 Améliorations Futures (Optionnel)

- [ ] Base de données persistante (MongoDB/PostgreSQL) au lieu de `orders_db` en mémoire
- [ ] Panel admin pour voir l'historique des commandes
- [ ] Notifications SMS via Twilio en plus de l'email
- [ ] Email de confirmation au client en plus de l'admin
- [ ] Templates email personnalisables
- [ ] Système de retry si l'envoi échoue

---

## 📞 Support

**Email**: aglaalberic@gmail.com  
**WhatsApp**: +229 65 62 36 91

**Documentation**:
- Configuration: [GUIDE_EMAIL_CONFIG.md](./GUIDE_EMAIL_CONFIG.md)
- Commandes: [GUIDE_COMMANDES.md](./GUIDE_COMMANDES.md)
- README principal: [README.md](./README.md)

---

**Version**: 1.0  
**Date**: 2024  
**Statut**: ✅ Opérationnel
