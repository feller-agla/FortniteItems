# 🚀 GUIDE D'INTÉGRATION FEDAPAY

## 📋 Étape 1 : Créer ton compte FedaPay

1. Va sur **https://fedapay.com**
2. Clique sur "S'inscrire" (en haut à droite)
3. Remplis le formulaire d'inscription
4. Vérifie ton email
5. Connecte-toi au Dashboard

---

## 🔑 Étape 2 : Récupérer tes clés API

1. Une fois connecté, va dans **Dashboard**
2. Clique sur **"Développeurs"** dans le menu
3. Clique sur **"Clés API"**
4. Tu verras 2 clés :
   - **Clé Publique** : `pk_sandbox_xxxxx...`
   - **Clé Secrète** : `sk_sandbox_xxxxx...`
5. **COPIE CES 2 CLÉS** ⚠️

---

## ⚙️ Étape 3 : Configurer l'API Backend

### Option A : Test en LOCAL

1. Ouvre le fichier `.env.fedapay`
2. Remplace les valeurs par tes vraies clés :

```bash
FEDAPAY_MODE=sandbox
FEDAPAY_SECRET_KEY=sk_sandbox_TA_VRAIE_CLE_ICI
FEDAPAY_PUBLIC_KEY=pk_sandbox_TA_VRAIE_CLE_ICI
```

3. Lance le serveur local :
```bash
./start-fedapay.sh
```

4. Le backend sera accessible sur : `http://localhost:10000`

---

### Option B : Déploiement sur RENDER (Production)

1. Va sur **https://render.com**
2. Connecte-toi avec ton compte GitHub
3. Clique sur **"New +"** → **"Web Service"**
4. Sélectionne ton repo **FortniteItems**
5. Configure :
   - **Name** : `fortniteitems-fedapay`
   - **Region** : Frankfurt (Europe) ou Oregon (USA)
   - **Branch** : `main`
   - **Build Command** : `pip install -r requirements.txt`
   - **Start Command** : `python fedapay_api.py`

6. Ajoute les **Environment Variables** :
   - `FEDAPAY_MODE` = `sandbox` (ou `live` pour la prod)
   - `FEDAPAY_SECRET_KEY` = `sk_sandbox_ta_cle...`
   - `FEDAPAY_PUBLIC_KEY` = `pk_sandbox_ta_cle...`
   - `PORT` = `10000`
   - `SUCCESS_URL` = `https://fortniteitems.netlify.app/success.html`
   - `CANCEL_URL` = `https://fortniteitems.netlify.app/payment-failed.html`

7. Clique sur **"Create Web Service"**

8. Attend le déploiement (2-3 minutes)

9. Récupère l'URL : `https://fortniteitems-fedapay.onrender.com`

---

## 🔧 Étape 4 : Mettre à jour le Frontend

1. Ouvre `checkout.js`
2. Change l'URL de l'API :

```javascript
// Pour LOCAL
const API_URL = 'http://localhost:10000';

// Pour PRODUCTION (Render)
const API_URL = 'https://fortniteitems-fedapay.onrender.com';
```

---

## 🧪 Étape 5 : Tester le Paiement

### Mode SANDBOX (Test)

FedaPay te donne des numéros de test :

**Mobile Money TEST :**
- Numéro : `+22990000001` à `+22990000010`
- Code OTP : `123456`

**Carte bancaire TEST :**
- Numéro : `4111 1111 1111 1111`
- CVV : `123`
- Expiration : n'importe quelle date future

### Test Flow :

1. Lance ton site local : `./start-local.sh`
2. Va sur `http://localhost:8000`
3. Ajoute un produit au panier
4. Clique sur "Commander"
5. Remplis le formulaire
6. Choisis "Mobile Money"
7. Clique sur "Payer Maintenant"
8. Tu es redirigé vers FedaPay
9. Utilise un numéro TEST
10. Le paiement est validé instantanément

---

## ✅ Étape 6 : Passer en MODE LIVE (Production)

Une fois les tests OK :

1. Va sur FedaPay Dashboard
2. Complète la vérification de ton compte (KYC)
3. Récupère tes **clés LIVE** (sans "sandbox")
4. Mets à jour `.env.fedapay` ou Render :
   ```
   FEDAPAY_MODE=live
   FEDAPAY_SECRET_KEY=sk_live_xxxxx...
   FEDAPAY_PUBLIC_KEY=pk_live_xxxxx...
   ```

5. Redéploie sur Render

6. C'est tout ! Les paiements sont maintenant RÉELS 💰

---

## 📊 Avantages FedaPay vs Lygos

| Critère | FedaPay | Lygos |
|---------|---------|-------|
| **Stabilité** | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Rapidité** | ⚡ Instantané | 🐌 Lent |
| **Support** | 💬 Excellent | 🤷 Moyen |
| **Dashboard** | 📊 Clair | 📉 Basic |
| **API** | 🛠️ Moderne | 🔧 OK |
| **Fiabilité** | ✅ 99.9% | ⚠️ 70% |
| **Frais** | 2.9% | 3% |

---

## 🆘 Support

**En cas de problème :**

1. **FedaPay Support :**
   - Email : support@fedapay.com
   - Docs : https://docs.fedapay.com

2. **Notre Support :**
   - WhatsApp : +229 65 62 36 91

---

## 📌 Notes Importantes

⚠️ **Garde tes clés secrètes PRIVÉES !**
- Ne les commit jamais sur GitHub
- Ne les partage jamais
- Utilise `.env` ou variables d'environnement Render

✅ **Test en sandbox d'abord !**
- Vérifie tout fonctionne
- Teste plusieurs paiements
- Vérifie les webhooks

🔒 **Sécurité**
- HTTPS obligatoire en production
- Vérifie les signatures webhook
- Log tous les paiements

---

**Bon courage ! 🚀**
