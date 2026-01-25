# 🚀 Déploiement Backend sur Render

## Étapes de Déploiement

### 1. Préparer le Repository

Assurez-vous que ces fichiers sont dans votre repo GitHub :
- ✅ `lygos.py` (backend Flask)
- ✅ `requirements.txt` (dépendances Python)
- ✅ `render.yaml` (configuration Render)

### 2. Créer un Compte Render

1. Allez sur https://render.com
2. Cliquez sur **"Get Started"**
3. Connectez-vous avec GitHub

### 3. Déployer le Backend

#### Option A : Déploiement Automatique (Recommandé)

1. Dans le dashboard Render, cliquez sur **"New +"** → **"Blueprint"**
2. Connectez votre repository GitHub `FortniteItems`
3. Render détectera automatiquement le fichier `render.yaml`
4. Cliquez sur **"Apply"**

#### Option B : Déploiement Manuel

1. Dans le dashboard Render, cliquez sur **"New +"** → **"Web Service"**
2. Connectez votre repository GitHub
3. Configurez :
   - **Name** : `fortniteitems-backend`
   - **Environment** : `Python 3`
   - **Build Command** : `pip install -r requirements.txt`
   - **Start Command** : `gunicorn lygos:app`
   - **Plan** : `Free` (gratuit)

### 4. Configurer les Variables d'Environnement

Dans Render, allez dans **Environment** et ajoutez :

| Key | Value |
|-----|-------|
| `LYGOS_API_KEY` | `lygosapp-9651642a-25f7-4e06-98b9-3617433e335c` |
| `BASE_URL` | `https://fortniteitems.vercel.app` |
| `PYTHON_VERSION` | `3.11.0` |

### 5. Récupérer l'URL du Backend

Une fois déployé, Render vous donnera une URL comme :
```
https://fortniteitems-backend.onrender.com
```

### 6. Mettre à Jour le Frontend (Netlify)

Modifiez `checkout.js` pour utiliser l'URL Render :

```javascript
const BACKEND_URL = 'https://fortniteitems-backend.onrender.com';
```

---

## 🧪 Tester le Backend

### Test 1 : Health Check

```bash
curl https://fortniteitems-backend.onrender.com/health
```

Réponse attendue :
```json
{
  "status": "ok",
  "service": "FortniteItems Backend API",
  "timestamp": "2025-10-29T..."
}
```

### Test 2 : Créer un Paiement

```bash
curl -X POST https://fortniteitems-backend.onrender.com/api/create-payment \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 9000,
    "items": [{"id": "2", "name": "2800 V-Bucks", "price": 9000, "quantity": 1}],
    "customer": {
      "fortniteName": "TestPlayer",
      "epicEmail": "test@example.com",
      "platform": "pc"
    }
  }'
```

---

## ⚙️ Configuration Avancée

### Activer les Logs

Dans Render Dashboard → Votre service → **Logs**

### Webhooks Lygos

URL du webhook à configurer dans Lygos :
```
https://fortniteitems-backend.onrender.com/api/webhook/lygos
```

### Base de Données (Future)

Pour une vraie base de données, ajoutez PostgreSQL dans Render :
1. **New +** → **PostgreSQL**
2. Connectez-le à votre service
3. Utilisez SQLAlchemy dans `lygos.py`

---

## 💰 Coûts

- **Plan Gratuit Render** :
  - ✅ 750 heures/mois (suffisant pour un site 24/7)
  - ✅ Sommeil après 15 min d'inactivité (réveil automatique)
  - ✅ 512 MB RAM
  - ⚠️ Première requête peut être lente (réveil du serveur)

- **Plan Payant** (7$/mois) :
  - Pas de sommeil
  - Plus de RAM
  - Meilleure performance

---

## 🔄 Workflow Complet

```
1. Code push → GitHub
   ↓
2. GitHub → Render (auto-deploy)
   ↓
3. Render build + deploy backend
   ↓
4. Backend disponible sur: fortniteitems-backend.onrender.com
   ↓
5. Frontend (Netlify) appelle le backend
   ↓
6. Backend génère lien Lygos
   ↓
7. Client redirigé vers Lygos
   ↓
8. Après paiement → success.html
```

---

## 🐛 Dépannage

### Problème : "Application failed to respond"

**Solution** : Vérifiez que `gunicorn` est dans `requirements.txt`

### Problème : "Module not found"

**Solution** : Vérifiez `requirements.txt` et re-déployez

### Problème : CORS Error

**Solution** : Ajoutez votre domaine Netlify dans `lygos.py` :
```python
CORS(app, origins=["https://fortniteitems.vercel.app"])
```

### Problème : Backend trop lent

**Solution** : 
- Plan gratuit : Serveur s'endort après 15 min
- Solution : Upgrade vers plan payant OU utilisez un service de "ping" gratuit

---

## 📞 Support Render

- Documentation : https://render.com/docs
- Support : https://render.com/support

---

**Prêt à déployer ! 🚀**
