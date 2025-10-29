# 🔧 Configuration Lygos pour FortniteItems

## 📋 Instructions de Configuration

Pour que le système de paiement fonctionne correctement, vous devez configurer les URLs de retour dans votre compte Lygos.

---

## 🔗 URLs à Configurer dans Lygos

Pour chaque lien de paiement que vous avez créé, allez dans les paramètres et configurez :

### URL de Succès (Success URL)
```
https://votredomaine.com/success.html
```
ou pour le développement local :
```
http://localhost:8000/success.html
```

### URL d'Échec (Cancel/Failed URL)
```
https://votredomaine.com/payment-failed.html
```
ou pour le développement local :
```
http://localhost:8000/payment-failed.html
```

### URL de Notification (Webhook URL) - Pour automatisation future
```
https://votredomaine.com/api/webhook/lygos
```
(Nécessite un backend - à implémenter plus tard)

---

## 📝 Liste des Liens Lygos à Configurer

| Produit | ID | Lien Lygos | Prix |
|---------|----|-----------|----|
| 1000 V-Bucks | 1 | `b1af9df8-c835-4d1a-ba4b-bb16b64a8d46` | 3 500 F |
| 2800 V-Bucks | 2 | `93049047-a2b4-4920-a708-b0547b39b585` | 9 000 F |
| 5000 V-Bucks | 3 | `ecc76f1a-3aa7-4397-ae55-4aa76dc86a70` | 16 000 F |
| 13500 V-Bucks | 4 | `dfc40c75-1d83-44c2-9c9b-469a83d62408` | 38 000 F |
| Fortnite Crew | 5 | `ba797d68-7f79-4798-9edb-11f13559d802` | 4 500 F |

---

## 🚀 Étapes de Configuration

### 1. Connectez-vous à Lygos Dashboard
```
https://dashboard.lygosapp.com
```

### 2. Pour Chaque Lien de Paiement

1. Allez dans **"Mes Liens"** ou **"Payment Links"**
2. Sélectionnez le lien correspondant
3. Cliquez sur **"Paramètres"** ou **"Settings"**
4. Trouvez la section **"URLs de Redirection"** ou **"Redirect URLs"**
5. Ajoutez :
   - **URL de Succès** : `https://votredomaine.com/success.html`
   - **URL d'Échec** : `https://votredomaine.com/payment-failed.html`
   - **URL d'Annulation** : `https://votredomaine.com/payment-failed.html`

### 3. Sauvegardez les Modifications

Assurez-vous de cliquer sur **"Enregistrer"** pour chaque lien modifié.

---

## 🔄 Flux de Paiement

```
1. Client clique "Payer Maintenant" sur le site
   ↓
2. Modal affiche "Traitement en cours..."
   ↓
3. Redirection automatique vers Lygos (1.5 secondes)
   ↓
4. Client effectue le paiement sur Lygos
   ↓
5a. Si paiement réussi → Lygos redirige vers success.html
   ↓
   success.html affiche les détails de la commande
   ↓
   Le panier est vidé automatiquement
   
5b. Si paiement échoué/annulé → Lygos redirige vers payment-failed.html
   ↓
   payment-failed.html explique les raisons possibles
   ↓
   Le panier reste intact pour réessayer
```

---

## 🧪 Test du Flux Complet

### Mode Test Local

1. Démarrez le serveur :
   ```bash
   cd /home/FeLLeRGLITCH_x/FortniteItems
   python3 -m http.server 8000
   ```

2. Configurez les liens Lygos avec :
   ```
   Success URL: http://localhost:8000/success.html
   Failed URL: http://localhost:8000/payment-failed.html
   ```

3. Testez un achat :
   - Ajoutez un produit au panier
   - Passez à la commande
   - Remplissez le formulaire
   - Choisissez Mobile Money
   - Vérifiez que "Traitement en cours..." s'affiche
   - Vérifiez la redirection vers Lygos

4. Testez les pages de retour :
   - Pour succès : `http://localhost:8000/success.html`
   - Pour échec : `http://localhost:8000/payment-failed.html`

### Mode Production

1. Déployez le site sur Netlify/Vercel

2. Configurez les liens Lygos avec :
   ```
   Success URL: https://fortniteitems.com/success.html
   Failed URL: https://fortniteitems.com/payment-failed.html
   ```

3. Testez avec un vrai paiement (petit montant)

4. Testez aussi un paiement annulé pour vérifier la page d'échec

---

## ⚙️ Configuration Avancée (Future)

### Webhooks Lygos

Pour automatiser la livraison des V-Bucks, vous devrez :

1. **Créer un backend** (Node.js/Python) avec une route webhook :
   ```javascript
   app.post('/api/webhook/lygos', (req, res) => {
       const { status, reference, amount } = req.body;
       
       if (status === 'successful') {
           // Livrer les V-Bucks automatiquement
           deliverVBucks(reference);
       }
       
       res.status(200).send('OK');
   });
   ```

2. **Configurer l'URL webhook dans Lygos** :
   ```
   https://votredomaine.com/api/webhook/lygos
   ```

3. **Vérifier la signature** pour sécuriser les requêtes

---

## 🔒 Sécurité

### Vérification des Paiements

**Important** : Actuellement, la page `success.html` s'affiche dès que l'utilisateur arrive dessus. Pour éviter les abus :

1. **À court terme** : Vérifiez manuellement chaque paiement dans le dashboard Lygos avant de livrer

2. **À moyen terme** : Implémentez les webhooks pour automatiser et sécuriser

3. **Best Practice** : 
   - Ne jamais faire confiance aux paramètres URL
   - Toujours vérifier côté serveur
   - Utiliser les webhooks Lygos pour confirmation

---

## 📞 Support Lygos

Si vous avez des questions sur la configuration :

- **Documentation** : https://docs.lygosapp.com
- **Support** : support@lygosapp.com
- **Dashboard** : https://dashboard.lygosapp.com

---

## ✅ Checklist Configuration

- [ ] Compte Lygos créé et vérifié
- [ ] 5 liens de paiement créés (un par produit)
- [ ] URL de succès configurée pour chaque lien
- [ ] URL d'annulation configurée (optionnel)
- [ ] Test effectué en mode local
- [ ] Test effectué avec un vrai paiement
- [ ] Documentation lue et comprise
- [ ] Webhook configuré (future étape)

---

## 🎯 Prochaines Étapes

1. ✅ **Immédiat** : Configurer les URLs de retour dans Lygos
2. ✅ **Court terme** : Tester le flux complet de paiement
3. ⏳ **Moyen terme** : Créer un backend pour les webhooks
4. ⏳ **Long terme** : Automatiser la livraison des V-Bucks

---

**Dernière mise à jour** : 29 Octobre 2025
