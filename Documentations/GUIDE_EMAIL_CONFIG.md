# 📧 Configuration Email Gmail pour les Notifications de Commande

## Objectif
Recevoir automatiquement par email les détails de chaque commande payée sur **aglaalberic@gmail.com**.

---

## ⚡ Configuration Rapide (5 minutes)

### Étape 1: Activer la validation en 2 étapes Gmail

1. Allez sur: https://myaccount.google.com/security
2. Cliquez sur "Validation en deux étapes"
3. Suivez les instructions pour l'activer (numéro de téléphone requis)
4. ✅ Une fois activée, vous pourrez créer des mots de passe d'application

### Étape 2: Générer un Mot de Passe d'Application

1. Allez sur: https://myaccount.google.com/apppasswords
2. Connectez-vous si demandé
3. Dans "Sélectionner une application", choisissez **"Autre (nom personnalisé)"**
4. Nommez-la: **"FortniteItems Backend"**
5. Cliquez sur **"Générer"**
6. ⚠️ **IMPORTANT**: Copiez le mot de passe de 16 caractères généré (ex: `abcd efgh ijkl mnop`)
7. Gardez cette fenêtre ouverte, vous en aurez besoin

### Étape 3: Configurer le Backend

#### En local (développement):

Créez un fichier `.env` à la racine du projet:

```bash
# Copiez .env.example vers .env
cp .env.example .env
```

Puis éditez `.env` et ajoutez:

```bash
SMTP_EMAIL=aglaalberic@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop  # ← Remplacez par votre mot de passe d'application
```

#### En production (Render.com):

1. Allez sur votre dashboard Render: https://dashboard.render.com/
2. Cliquez sur votre service backend "fortniteitems"
3. Allez dans l'onglet **"Environment"**
4. Ajoutez ces 2 variables:
   - `SMTP_EMAIL` = `aglaalberic@gmail.com`
   - `SMTP_PASSWORD` = `[votre mot de passe d'application]`
5. Cliquez sur **"Save Changes"**
6. Le service redémarrera automatiquement

---

## 🔍 Tester la Configuration

### Test 1: Backend Local

```bash
# Démarrez le backend
cd /home/FeLLeRGLITCH_x/FortniteItems
python3 lygos.py
```

Vous devriez voir:
```
✅ Configuration Email OK: aglaalberic@gmail.com
🚀 Backend Lygos running on http://localhost:5000
```

### Test 2: Commande Complète

1. Ouvrez votre site: http://localhost:8000
2. Ajoutez un produit au panier
3. Cliquez sur "Commander"
4. Remplissez le formulaire
5. ⚠️ **NE PAYEZ PAS RÉELLEMENT** en test
6. Simulez un webhook de succès:

```bash
curl -X POST http://localhost:5000/api/webhook/lygos \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "test-order-123",
    "status": "successful",
    "amount": 9000
  }'
```

7. Vérifiez votre boîte email **aglaalberic@gmail.com**
8. Vous devriez recevoir un email avec les détails de commande

---

## 📧 Format de l'Email Reçu

Chaque email contiendra:

### En-tête
- 🎮 **Sujet**: "Nouvelle Commande FortniteItems - [order_id]"
- **De**: Votre email configuré
- **À**: aglaalberic@gmail.com

### Contenu HTML
1. **📦 Articles Commandés**
   - Tableau avec nom, quantité, prix unitaire, total
   - Montant total en FCFA

2. **👤 Informations Client**
   - Nom complet
   - Email de contact
   
   **Pour V-Bucks**:
   - Plateforme (Xbox, PS, PC, etc.)
   
   **Pour Fortnite Crew**:
   - Pseudo Epic Games
   - Email de connexion Epic
   - Mot de passe Epic
   - Numéro WhatsApp

3. **💳 Informations de Paiement**
   - Statut: ✅ Payé
   - Date de commande
   - Order ID

---

## 🛡️ Sécurité

### ✅ Bonnes Pratiques

1. **NE JAMAIS commiter le fichier `.env`** (déjà dans .gitignore)
2. **Utilisez TOUJOURS un mot de passe d'application** (pas votre mot de passe Gmail)
3. **Gardez vos credentials secrets** - ne les partagez jamais
4. Si compromis, révoquez le mot de passe d'application et générez-en un nouveau

### 🔐 Révocation

Pour révoquer un mot de passe d'application:
1. https://myaccount.google.com/apppasswords
2. Trouvez "FortniteItems Backend"
3. Cliquez sur "Supprimer"
4. Générez-en un nouveau si nécessaire

---

## 🔧 Dépannage

### Erreur: "Username and Password not accepted"

**Causes possibles**:
1. Vous utilisez votre mot de passe Gmail normal (❌) au lieu du mot de passe d'application
2. La validation en 2 étapes n'est pas activée
3. Le mot de passe contient des espaces (supprimez-les)

**Solution**:
```bash
# Vérifiez votre .env
cat .env | grep SMTP

# Le mot de passe doit être de 16 caractères sans espaces
SMTP_PASSWORD=abcdefghijklmnop  # ✅ BON
SMTP_PASSWORD=abcd efgh ijkl mnop  # ❌ MAUVAIS (espaces)
```

### Erreur: "SMTPAuthenticationError"

Vérifiez que:
1. ✅ La validation en 2 étapes est active
2. ✅ Le mot de passe d'application est correct
3. ✅ L'email est bien aglaalberic@gmail.com

### Aucun Email Reçu

1. **Vérifiez les logs backend**:
   ```bash
   # Cherchez ces messages
   ✅ Email envoyé avec succès pour la commande [order_id]
   ```

2. **Vérifiez les spams** de aglaalberic@gmail.com

3. **Testez manuellement le webhook**:
   ```bash
   # Créez d'abord une commande test dans orders_db
   # Puis simulez le paiement réussi
   curl -X POST https://fortniteitems.onrender.com/api/webhook/lygos \
     -H "Content-Type: application/json" \
     -d '{"order_id": "votre-order-id", "status": "successful"}'
   ```

### Email Envoyé Mais Pas Reçu

- **Vérifiez les dossiers**: Inbox, Spam, Promotion, Social
- **Ajoutez à la liste blanche**: Marquez les emails de SMTP_EMAIL comme "Non spam"
- **Quota Gmail**: Gmail limite à ~500 emails/jour (largement suffisant)

---

## 📊 Monitoring

### Logs Importants

Recherchez ces messages dans les logs:

```bash
# Configuration email au démarrage
✅ Configuration Email OK: aglaalberic@gmail.com

# Lors d'un paiement réussi
✅ Paiement réussi pour commande [order_id]
📧 Email de confirmation envoyé à aglaalberic@gmail.com

# En cas d'erreur
❌ Erreur lors de l'envoi de l'email: [détails]
```

### Sur Render.com

1. Dashboard → Votre service → Onglet "Logs"
2. Filtrez par "Email" pour voir les activités d'envoi
3. Configurez des alertes si besoin

---

## ✅ Checklist de Vérification

Avant de mettre en production:

- [ ] Validation en 2 étapes Gmail activée
- [ ] Mot de passe d'application généré
- [ ] Variables d'environnement configurées (local ET production)
- [ ] Test d'envoi d'email réussi
- [ ] Email reçu dans aglaalberic@gmail.com
- [ ] Format HTML de l'email correct
- [ ] Informations client complètes dans l'email
- [ ] Webhook Lygos configuré pour pointer vers votre backend

---

## 📞 Support

En cas de problème persistant:
- Contactez le support Gmail: https://support.google.com/mail
- Vérifiez la documentation SMTP Gmail: https://support.google.com/mail/answer/7126229

---

**Date de création**: 2024  
**Version**: 1.0  
**Auteur**: FortniteItems Team
