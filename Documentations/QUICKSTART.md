# 🚀 DÉMARRAGE RAPIDE - 5 ÉTAPES

## Déployer FortniteItems en 10 minutes

### 1️⃣ Créer un compte Render
👉 https://render.com
- S'inscrire avec GitHub
- Connecter votre repo `FortniteItems`

### 2️⃣ Créer un Web Service
- **New +** → **Web Service**
- Repository: `FortniteItems`
- Build: `pip install -r requirements.txt`
- Start: `gunicorn lygos:app`
- Variables d'environnement:
  - `LYGOS_API_KEY` = `lygosapp-9651642a-25f7-4e06-98b9-3617433e335c`
  - `BASE_URL` = `https://fortniteitems.netlify.app`

### 3️⃣ Récupérer l'URL Backend
Exemple: `https://fortniteitems-backend.onrender.com`

### 4️⃣ Mettre à jour le Frontend
Dans `checkout.js`, ligne ~170:
```javascript
const BACKEND_URL = 'https://fortniteitems-backend.onrender.com';
```

Puis commit et push:
```bash
git add checkout.js
git commit -m "Connect to Render backend"
git push
```

### 5️⃣ Configurer Lygos Webhook
Dashboard Lygos → Settings → Webhooks:
```
https://fortniteitems-backend.onrender.com/api/webhook/lygos
```

---

## ✅ Vérification

```bash
# Test 1: Backend en ligne ?
curl https://fortniteitems-backend.onrender.com/health

# Test 2: Site fonctionne ?
# Aller sur votre site et faire un achat test
```

---

## 📚 Documentation Complète

- 📖 `DEPLOY_BACKEND.md` - Guide détaillé Render
- 📖 `HOSTING_OPTIONS.md` - Alternatives (Railway, Fly.io...)
- 📖 `SETUP_COMPLETE.md` - Architecture complète
- 📖 `LYGOS_CONFIG.md` - Configuration Lygos

---

**C'est tout ! Votre site est prêt ! 🎉**
