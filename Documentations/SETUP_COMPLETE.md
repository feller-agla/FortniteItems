# 📋 Résumé - Configuration Complète Backend + Frontend

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Navigateur)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│            FRONTEND (Netlify)                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ https://fortniteitems.vercel.app                      │ │
│  │                                                         │ │
│  │  - index.html      → Page d'accueil                    │ │
│  │  - product.html    → Détails produit                   │ │
│  │  - cart.html       → Panier + Checkout                 │ │
│  │  - success.html    → Confirmation                      │ │
│  │  - payment-failed.html → Échec paiement                │ │
│  │                                                         │ │
│  │  - checkout.js     → Appelle le backend API            │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ HTTPS Request
                           ↓
┌─────────────────────────────────────────────────────────────┐
│            BACKEND API (Render)                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ https://fortniteitems-backend.onrender.com             │ │
│  │                                                         │ │
│  │  POST /api/create-payment                              │ │
│  │  POST /api/webhook/lygos                               │ │
│  │  GET  /api/order/:id                                   │ │
│  │  GET  /health                                          │ │
│  │                                                         │ │
│  │  Python + Flask + gunicorn                             │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ API Call
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              LYGOS PAYMENT GATEWAY                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ https://api.lygosapp.com/v1/gateway                    │ │
│  │                                                         │ │
│  │  - Génère lien de paiement                             │ │
│  │  - Traite les paiements Mobile Money                   │ │
│  │  - Envoie webhooks de confirmation                     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flux de Paiement Complet

```
1. Client ajoute produit au panier (cart.js)
   ↓
2. Client clique "Passer à la Commande"
   ↓
3. Modal s'ouvre (étape 1: formulaire)
   ↓
4. Client remplit: Pseudo, Email, Plateforme
   ↓
5. Client clique "Continuer" → Étape 2
   ↓
6. Client choisit "Mobile Money"
   ↓
7. Client clique "Payer Maintenant"
   ↓
8. checkout.js appelle le BACKEND:
   POST https://fortniteitems-backend.onrender.com/api/create-payment
   Body: {amount, items, customer}
   ↓
9. Backend (lygos.py) reçoit la requête
   ↓
10. Backend appelle LYGOS API:
    POST https://api.lygosapp.com/v1/gateway
    Body: {amount, shop_name, success_url, failure_url, order_id}
    ↓
11. LYGOS génère un lien de paiement unique
    ↓
12. Backend retourne le lien au frontend
    ↓
13. checkout.js affiche "Traitement en cours..." (1.5s)
    ↓
14. Redirection automatique vers le lien LYGOS
    ↓
15. Client effectue le paiement sur LYGOS
    ↓
16a. SI SUCCÈS:
     - Lygos redirige → https://fortniteitems.vercel.app/success.html
     - success.html affiche confirmation
     - Panier vidé automatiquement
    ↓
16b. SI ÉCHEC:
     - Lygos redirige → https://fortniteitems.vercel.app/payment-failed.html
     - payment-failed.html affiche message d'erreur
     - Option de réessayer
    ↓
17. WEBHOOK (asynchrone):
    Lygos envoie notification → Backend /api/webhook/lygos
    Backend met à jour le statut de la commande
```

---

## 📝 Checklist de Déploiement

### Étape 1: Préparer les Fichiers ✅

- [x] `lygos.py` - Backend Flask
- [x] `requirements.txt` - Dépendances Python
- [x] `render.yaml` - Config Render
- [x] `.env.example` - Variables d'environnement
- [x] `checkout.js` - Frontend modifié pour API
- [x] `success.html` - Page de confirmation
- [x] `payment-failed.html` - Page d'échec

### Étape 2: Déployer le Backend sur Render

1. **Créer un compte Render**
   - Aller sur https://render.com
   - S'inscrire avec GitHub

2. **Nouveau Web Service**
   - New + → Web Service
   - Connecter repo GitHub `FortniteItems`
   - Configurer:
     * Build Command: `pip install -r requirements.txt`
     * Start Command: `gunicorn lygos:app`
     * Environment: Python 3

3. **Variables d'Environnement**
   - `LYGOS_API_KEY` = `lygosapp-9651642a-25f7-4e06-98b9-3617433e335c`
   - `BASE_URL` = `https://fortniteitems.vercel.app`
   - `PYTHON_VERSION` = `3.11.0`

4. **Déployer**
   - Cliquer "Create Web Service"
   - Attendre le déploiement (~5 min)
   - Récupérer l'URL: `https://fortniteitems-backend.onrender.com`

### Étape 3: Mettre à Jour le Frontend

1. **Modifier `checkout.js`**
   ```javascript
   const BACKEND_URL = 'https://fortniteitems-backend.onrender.com';
   ```

2. **Commit et Push**
   ```bash
   git add checkout.js
   git commit -m "Update backend URL"
   git push origin main
   ```

3. **Netlify se redéploie automatiquement**

### Étape 4: Configurer Lygos

⚠️ **IMPORTANT** : Cette étape est OBLIGATOIRE

1. **Se connecter au Dashboard Lygos**
   - https://dashboard.lygosapp.com

2. **Configurer le Webhook**
   - Settings → Webhooks
   - URL: `https://fortniteitems-backend.onrender.com/api/webhook/lygos`
   - Événements: `payment.success`, `payment.failed`

3. **Note**: Les URLs de redirection (success_url, failure_url) sont
   automatiquement envoyées par le backend lors de chaque paiement.

### Étape 5: Tester

1. **Test Backend**
   ```bash
   # Local
   ./test_backend.sh

   # Production
   ./test_backend.sh https://fortniteitems-backend.onrender.com
   ```

2. **Test Frontend**
   - Aller sur https://fortniteitems.vercel.app
   - Ajouter un produit au panier
   - Faire un checkout complet
   - Vérifier la redirection vers Lygos

3. **Test Paiement** (optionnel, avec argent réel)
   - Faire un paiement de test (1000 V-Bucks)
   - Vérifier la redirection vers success.html
   - Vérifier que le panier est vidé

---

## 🔑 Variables d'Environnement

### Backend (Render)

| Variable | Valeur | Description |
|----------|--------|-------------|
| `LYGOS_API_KEY` | `lygosapp-9651642a-25f7-4e06-98b9-3617433e335c` | Clé API Lygos |
| `BASE_URL` | `https://fortniteitems.vercel.app` | URL du site |
| `PYTHON_VERSION` | `3.11.0` | Version Python |

### Frontend (checkout.js)

```javascript
const BACKEND_URL = 'https://fortniteitems-backend.onrender.com';
```

---

## 📊 URLs Importantes

| Service | URL | Usage |
|---------|-----|-------|
| Frontend | https://fortniteitems.vercel.app | Site principal |
| Backend API | https://fortniteitems-backend.onrender.com | API Python |
| Backend Health | https://fortniteitems-backend.onrender.com/health | Status API |
| Lygos Dashboard | https://dashboard.lygosapp.com | Config paiements |
| Lygos API | https://api.lygosapp.com/v1/gateway | Gateway paiement |

---

## 🧪 Commandes de Test

### Test Local Backend

```bash
# Démarrer le backend
python3 lygos.py

# Tester (dans un autre terminal)
./test_backend.sh
```

### Test Production Backend

```bash
# Health check
curl https://fortniteitems-backend.onrender.com/health

# Créer un paiement
curl -X POST https://fortniteitems-backend.onrender.com/api/create-payment \
  -H "Content-Type: application/json" \
  -d '{"amount": 9000, "items": [{"id": "2", "name": "2800 V-Bucks", "price": 9000, "quantity": 1}], "customer": {"fortniteName": "Test", "epicEmail": "test@mail.com", "platform": "pc"}}'
```

---

## 🐛 Dépannage

### Backend ne démarre pas
- Vérifier `requirements.txt`
- Vérifier les logs Render
- Vérifier les variables d'environnement

### CORS Error
- Vérifier que l'URL Netlify est dans `ALLOWED_ORIGINS` (lygos.py)
- Redéployer le backend

### Webhook ne fonctionne pas
- Vérifier l'URL dans Lygos Dashboard
- Vérifier les logs du backend
- Tester avec Postman

### Paiement ne redirige pas
- Vérifier que `success_url` et `failure_url` sont corrects
- Vérifier dans les logs Lygos

---

## 📞 Support

- **Backend Render**: https://render.com/docs
- **Lygos API**: https://docs.lygosapp.com
- **Netlify**: https://docs.netlify.com

---

## ✅ Statut Final

Une fois tout configuré :

- ✅ Backend déployé sur Render
- ✅ Frontend déployé sur Netlify
- ✅ API Lygos configurée
- ✅ Webhooks configurés
- ✅ Tests réussis

**Votre site est PRÊT pour la production ! 🚀**
