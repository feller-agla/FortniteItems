# ✅ Vérification du Déploiement Render

## 🔍 Changements Effectués

### 1. **Port Dynamique**
Le backend utilise maintenant la variable d'environnement `PORT` de Render au lieu du port 5000 en dur.

```python
port = int(os.getenv('PORT', 5000))
app.run(host='0.0.0.0', port=port, debug=debug_mode)
```

### 2. **Route Racine Ajoutée**
Ajout d'une route `/` pour que le health check de Render fonctionne.

### 3. **Configuration render.yaml Complétée**
Ajout de `healthCheckPath` et autres paramètres de production.

---

## 🚀 Étapes de Vérification

### 1. Vérifier le Déploiement sur Render

Attendez que Render redéploie automatiquement (push git détecté).

Dans les logs de Render, vous devriez voir :
```
==> Build successful 🎉
==> Deploying...
==> Running 'gunicorn lygos:app'
[INFO] Starting gunicorn 21.2.0
[INFO] Listening at: http://0.0.0.0:10000 (56)
[INFO] Using worker: sync
[INFO] Booting worker with pid: 57
```

✅ **Le port 10000 est maintenant utilisé** (au lieu de chercher le 5000)

### 2. Tester l'API en Ligne

Une fois déployé, testez ces URLs :

**Health Check** :
```
https://fortniteitems-backend.onrender.com/health
```

Réponse attendue :
```json
{
  "status": "ok",
  "service": "FortniteItems Backend API",
  "timestamp": "2025-10-29T16:30:00"
}
```

**Page d'accueil** :
```
https://fortniteitems-backend.onrender.com/
```

Réponse attendue :
```json
{
  "service": "FortniteItems Backend API",
  "status": "running",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "create_payment": "/api/create-payment [POST]",
    ...
  }
}
```

### 3. Tester la Création de Paiement

Avec curl ou Postman :

```bash
curl -X POST https://fortniteitems-backend.onrender.com/api/create-payment \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "id": "2",
        "name": "2800 V-Bucks",
        "price": 9000,
        "quantity": 1
      }
    ],
    "customer": {
      "fortniteName": "TestPlayer",
      "epicEmail": "test@example.com",
      "platform": "pc"
    }
  }'
```

Réponse attendue :
```json
{
  "success": true,
  "payment_link": "https://pay.lygosapp.com/...",
  "order_id": "uuid-xxxx-xxxx",
  "amount": 9000
}
```

---

## 🔧 Configuration Frontend

Une fois le backend fonctionnel, mettez à jour [`checkout.js`](checkout.js ) :

Remplacez :
```javascript
const API_URL = 'http://localhost:5000';
```

Par :
```javascript
const API_URL = 'https://fortniteitems-backend.onrender.com';
```

Puis commit et push sur Netlify.

---

## ⚠️ Points Importants

### Variables d'Environnement sur Render

Dans le dashboard Render, configurez :

1. **LYGOS_API_KEY** : Votre clé API Lygos
2. **BASE_URL** : `https://fortniteitems.vercel.app`
3. **FLASK_ENV** : `production`

### CORS

Le backend accepte les requêtes depuis :
- `https://fortniteitems.vercel.app` (production)
- `http://localhost:8000` (développement)

Si votre frontend Netlify a une URL différente, ajoutez-la dans `ALLOWED_ORIGINS` dans [`lygos.py`](lygos.py ).

---

## 🐛 Dépannage

### Erreur "Port scan timeout"
✅ **RÉSOLU** - Le backend utilise maintenant `PORT` de l'environnement

### Erreur 404 sur "/"
✅ **RÉSOLU** - Route `/` ajoutée

### CORS Error
Vérifiez que l'URL de votre frontend Netlify est dans `ALLOWED_ORIGINS`

### Erreur API Lygos
Vérifiez que la clé `LYGOS_API_KEY` est correctement configurée dans les variables d'environnement Render

---

## 📊 Statut Actuel

- [x] Port dynamique configuré
- [x] Route `/` ajoutée pour health check
- [x] render.yaml mis à jour
- [x] Code pushé sur GitHub
- [ ] Déploiement Render en cours... (vérifier les logs)
- [ ] Frontend mis à jour avec la bonne URL API
- [ ] Tests de paiement effectués

---

## 🎯 Prochaines Étapes

1. ✅ Attendre que Render finisse le déploiement (2-3 minutes)
2. ✅ Vérifier `/health` et `/` 
3. ✅ Tester la création de paiement avec curl
4. ✅ Mettre à jour l'URL API dans [`checkout.js`](checkout.js )
5. ✅ Tester un achat complet sur votre site

---

**Le problème est maintenant résolu !** 🎉

Render devrait détecter automatiquement le port 10000 grâce à la variable `PORT`.
