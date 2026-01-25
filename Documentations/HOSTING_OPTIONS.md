# 🌐 Alternatives d'Hébergement Backend

## Comparaison des Plateformes

| Plateforme | Prix | Avantages | Inconvénients |
|------------|------|-----------|---------------|
| **Render** ⭐ | Gratuit | Simple, Auto-deploy, Logs | Sommeil après 15min |
| **Railway** | Gratuit (limité) | Très rapide, Moderne | Limite 500h/mois |
| **Fly.io** | Gratuit | Performant, Global | Configuration complexe |
| **PythonAnywhere** | Gratuit | Facile, 24/7 | Limites strictes |
| **Heroku** | Payant | Historique, Stable | Plus gratuit |

---

## Option 2 : Railway.app 🚂

**Pourquoi Railway ?**
- Interface moderne
- Déploiement ultra-rapide
- Variables d'environnement faciles

**Déploiement :**

1. **Inscription** : https://railway.app
2. **New Project** → **Deploy from GitHub repo**
3. Sélectionnez votre repo `FortniteItems`
4. Railway détecte automatiquement Python
5. Ajoutez les variables d'environnement
6. Déployez !

**URL finale** : `https://fortniteitems.railway.app`

---

## Option 3 : Fly.io 🪰

**Pourquoi Fly.io ?**
- Serveurs dans plusieurs régions (dont Afrique)
- Très performant
- Gratuit jusqu'à 3 apps

**Déploiement :**

1. Installez Fly CLI :
```bash
curl -L https://fly.io/install.sh | sh
```

2. Créez `fly.toml` :
```toml
app = "fortniteitems-backend"

[build]
  builder = "paketobuildpacks/builder:base"

[[services]]
  http_checks = []
  internal_port = 5000
  protocol = "tcp"
  
  [[services.ports]]
    handlers = ["http"]
    port = 80
  
  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

3. Déployez :
```bash
fly launch
fly deploy
```

---

## Option 4 : PythonAnywhere 🐍

**Pourquoi PythonAnywhere ?**
- Spécialisé Python
- Gratuit 24/7 (pas de sommeil)
- Facile pour débutants

**Déploiement :**

1. **Inscription** : https://www.pythonanywhere.com
2. **Web** → **Add a new web app**
3. Choisissez **Flask**
4. Uploadez vos fichiers
5. Configurez le WSGI file
6. Reload

**Limites gratuites** :
- 1 app web
- Requêtes limitées/jour
- Pas d'HTTPS custom

---

## Option 5 : Netlify Functions (Serverless) ⚡

**Pourquoi Netlify Functions ?**
- Même hébergeur que le frontend
- Serverless (pas de serveur à gérer)
- Intégré

**⚠️ Limitation** : Netlify Functions ne supporte pas Flask directement.

**Solution** : Réécrire en JavaScript (Node.js)

Exemple `netlify/functions/create-payment.js` :
```javascript
const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { amount, items, customer } = JSON.parse(event.body);

  try {
    const response = await axios.post('https://api.lygosapp.com/v1/gateway', {
      amount: amount,
      shop_name: 'FortniteItems',
      message: `Commande ${items[0].name}`,
      success_url: 'https://fortniteitems.vercel.app/success.html',
      failure_url: 'https://fortniteitems.vercel.app/payment-failed.html',
      order_id: Date.now().toString()
    }, {
      headers: {
        'api-key': process.env.LYGOS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        payment_link: response.data.link,
        order_id: response.data.order_id
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
```

---

## Option 6 : Vercel (Serverless) ▲

Similaire à Netlify Functions, mais avec API Routes.

**Structure** :
```
/api
  /create-payment.js
  /webhook.js
```

---

## 🎯 Recommandation Finale

### Pour votre cas (FortniteItems) :

**1ère Priorité : Render.com** ⭐⭐⭐⭐⭐
- Gratuit
- Simple
- Parfait pour Flask
- Auto-deploy GitHub

**2ème Choix : Railway.app** ⭐⭐⭐⭐
- Moderne
- Rapide
- Limite 500h/mois

**3ème Choix : PythonAnywhere** ⭐⭐⭐
- Pas de sommeil
- Gratuit 24/7
- Interface simple

---

## 📋 Checklist de Déploiement

- [ ] Backend déployé sur Render/Railway
- [ ] URL backend récupérée
- [ ] Variables d'environnement configurées
- [ ] `checkout.js` mis à jour avec URL backend
- [ ] Frontend re-déployé sur Netlify
- [ ] Test health check réussi
- [ ] Test création paiement réussi
- [ ] Webhook Lygos configuré
- [ ] Test flux complet effectué

---

**Suivez le guide `DEPLOY_BACKEND.md` pour Render ! 🚀**
