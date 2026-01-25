# 🌐 Configuration Automatique Local vs Production

## Problème Résolu

Le système détecte maintenant **automatiquement** s'il tourne en local ou en production, et utilise la bonne URL d'API.

---

## Comment ça marche ?

### Détection Automatique

```javascript
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'  // Local
    : 'https://fortniteitems.onrender.com';  // Production
```

### En Local (Développement)

Quand vous ouvrez : `http://localhost:8000` ou `http://127.0.0.1:8000`

**Le frontend appellera automatiquement** : `http://localhost:5000`

```
Frontend Local (localhost:8000)
        ↓
Backend Local (localhost:5000)
```

### En Production (En ligne)

Quand vous ouvrez : `https://fortniteitems.vercel.app`

**Le frontend appellera automatiquement** : `https://fortniteitems.onrender.com`

```
Frontend Production (fortniteitems.vercel.app)
        ↓
Backend Production (fortniteitems.onrender.com)
```

---

## Fichiers Concernés

### ✅ `checkout.js`
- Détecte automatiquement l'environnement
- Logs dans la console :
  ```
  🌐 Environnement détecté: LOCAL
  🔗 API Backend: http://localhost:5000
  ```

### ✅ `success.html`
- Détecte automatiquement l'environnement
- Logs dans la console :
  ```
  🌐 Success Page - Environnement: LOCAL
  🔗 API Backend: http://localhost:5000
  ```

---

## Vérification

### En Local

1. Ouvrez la console du navigateur (F12)
2. Chargez la page
3. Vous devriez voir :
   ```
   🌐 Environnement détecté: LOCAL
   🔗 API Backend: http://localhost:5000
   ```

### En Production

1. Ouvrez votre site en ligne
2. Ouvrez la console (F12)
3. Vous devriez voir :
   ```
   🌐 Environnement détecté: PRODUCTION
   🔗 API Backend: https://fortniteitems.onrender.com
   ```

---

## Avantages

✅ **Plus besoin de changer l'URL manuellement**  
✅ **Fonctionne automatiquement en local ET en production**  
✅ **Pas de risque d'oublier de changer l'URL avant déploiement**  
✅ **Logs clairs pour le débogage**

---

## Tests

### Test Local
```bash
# Terminal 1: Démarrer le backend
cd /home/FeLLeRGLITCH_x/FortniteItems
python3 lygos.py

# Terminal 2: Démarrer le frontend
cd /home/FeLLeRGLITCH_x/FortniteItems
python3 -m http.server 8000

# Navigateur: http://localhost:8000
# Console devrait afficher: "LOCAL" et "http://localhost:5000"
```

### Test Production
```bash
# Déployez sur Netlify/Render
# Ouvrez: https://fortniteitems.vercel.app
# Console devrait afficher: "PRODUCTION" et "https://fortniteitems.onrender.com"
```

---

**Date**: 30 octobre 2025  
**Statut**: ✅ Opérationnel
