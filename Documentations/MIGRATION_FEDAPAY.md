# ⚡ MIGRATION RAPIDE : Lygos → FedaPay

## 🎯 Ce qui a changé

✅ **Nouveaux fichiers créés :**
- `fedapay_api.py` - Backend API FedaPay
- `.env.fedapay` - Configuration des clés
- `start-fedapay.sh` - Script de démarrage
- `render-fedapay.yaml` - Config Render
- `FEDAPAY_SETUP.md` - Guide complet

🔧 **Fichiers modifiés :**
- `checkout.js` - Variable `PAYMENT_PROVIDER` ajoutée

---

## 🚀 Démarrage ULTRA-RAPIDE (5 minutes)

### 1️⃣ Créer compte FedaPay (2 min)
```
https://fedapay.com → S'inscrire → Vérifier email
```

### 2️⃣ Récupérer les clés (1 min)
```
Dashboard → Développeurs → Clés API
Copie : sk_sandbox_xxx... et pk_sandbox_xxx...
```

### 3️⃣ Configurer (30 sec)
Ouvre `.env.fedapay` et colle tes clés :
```bash
FEDAPAY_SECRET_KEY=sk_sandbox_COLLE_TA_CLE_ICI
FEDAPAY_PUBLIC_KEY=pk_sandbox_COLLE_TA_CLE_ICI
```

### 4️⃣ Lancer (10 sec)
```bash
./start-fedapay.sh
```

### 5️⃣ Tester (1 min)
```bash
# Dans un autre terminal
./start-local.sh
```

Puis ouvre `http://localhost:8000`

**Numéro TEST :** `+22990000001`  
**Code OTP :** `123456`

---

## 🌐 Déployer sur Render

### Méthode 1 : Via GitHub (Automatique)

```bash
# 1. Commit les changements
git add .
git commit -m "feat: Intégration FedaPay"
git push origin main

# 2. Va sur Render.com
# 3. New Web Service → Sélectionne FortniteItems
# 4. Configure :
#    - Start Command: python fedapay_api.py
#    - Environment Variables :
#      FEDAPAY_MODE=sandbox
#      FEDAPAY_SECRET_KEY=sk_sandbox_xxx...
#      FEDAPAY_PUBLIC_KEY=pk_sandbox_xxx...
#      PORT=10000
```

### Méthode 2 : Blueprint (Recommandé)

```bash
# 1. Sur Render.com
# 2. New → Blueprint
# 3. Sélectionne : render-fedapay.yaml
# 4. Ajoute manuellement les clés API
# 5. Deploy !
```

---

## 🔄 Switcher entre Lygos et FedaPay

Dans `checkout.js`, ligne 6-7 :

```javascript
// FEDAPAY (stable)
const API_URL = 'https://fortniteitems-fedapay.onrender.com';
const PAYMENT_PROVIDER = 'fedapay';

// ou LYGOS (si besoin)
const API_URL = 'https://fortniteitems.onrender.com';
const PAYMENT_PROVIDER = 'lygos';
```

**Redéploie Netlify après changement !**

---

## ✅ Checklist Rapide

- [ ] Compte FedaPay créé
- [ ] Clés API récupérées
- [ ] `.env.fedapay` configuré
- [ ] Backend testé en local (`./start-fedapay.sh`)
- [ ] Paiement TEST validé
- [ ] Backend déployé sur Render
- [ ] `checkout.js` mis à jour avec URL Render
- [ ] Frontend redéployé sur Netlify
- [ ] Paiement LIVE testé

---

## 🎯 Comparaison API

| Action | Lygos | FedaPay |
|--------|-------|---------|
| Créer paiement | `/api/create-payment` | `/api/create-payment` |
| Vérifier statut | ❌ Non disponible | `/api/verify-payment/<id>` |
| Webhook | `/api/webhook/lygos` | `/api/webhook/fedapay` |
| Health check | `/health` | `/health` |

**📌 Les endpoints sont identiques !**  
Le frontend ne change pas, seul le backend change.

---

## 🆘 Problèmes Courants

### Erreur "Invalid API Key"
➡️ Vérifie que tu as copié la **BONNE** clé (sandbox ou live)

### Timeout / Connexion lente
➡️ Backend Render en veille, attends 10-15 sec ou warmup

### Paiement bloqué
➡️ En mode TEST, utilise les numéros fournis par FedaPay

### Webhook ne fonctionne pas
➡️ Configure l'URL dans FedaPay Dashboard → Webhooks

---

## 💰 Frais

**FedaPay :**
- Mobile Money : 2.9% + 0 FCFA
- Carte bancaire : 2.9% + 0 FCFA
- Pas de frais mensuels

**Exemple :**
- Produit 3500 FCFA
- Frais : 3500 × 0.029 = 101 FCFA
- Tu reçois : 3399 FCFA

---

## 🎉 C'est Tout !

FedaPay est maintenant intégré. Il est **10x plus stable** que Lygos.

**Besoin d'aide ?**  
WhatsApp : +229 65 62 36 91

---

*Dernière mise à jour : 30 Oct 2025*
