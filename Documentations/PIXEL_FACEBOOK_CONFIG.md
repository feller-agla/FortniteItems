# 📊 Configuration Pixel Facebook pour FortniteItems

## Objectif

Suivre les conversions et optimiser vos publicités Facebook en trackant automatiquement tous les événements e-commerce.

---

## 🚀 Configuration Rapide

### Étape 1 : Créer votre Pixel Facebook

1. **Allez sur Facebook Business Manager** : https://business.facebook.com/
2. **Menu** → **Gestionnaire d'événements** (Events Manager)
3. **Connecter des sources de données** → **Web** → **Pixel Facebook**
4. **Donnez un nom** : "FortniteItems Pixel"
5. **Entrez votre site** : `https://fortniteitems.netlify.app`
6. **Copiez l'ID du Pixel** (ex: `123456789012345`)

### Étape 2 : Configurer le Pixel dans votre site

1. **Ouvrez** : `/home/FeLLeRGLITCH_x/FortniteItems/analytics.js`
2. **Ligne 7**, remplacez :
   ```javascript
   const FACEBOOK_PIXEL_ID = 'VOTRE_PIXEL_ID_ICI';
   ```
   par :
   ```javascript
   const FACEBOOK_PIXEL_ID = '123456789012345'; // Votre vrai ID
   ```

3. **Commitez et déployez** :
   ```bash
   git add analytics.js
   git commit -m "📊 Configuration Pixel Facebook"
   git push origin main
   ```

### Étape 3 : Vérifier que ça fonctionne

1. **Installez** : [Facebook Pixel Helper](https://chrome.google.com/webstore/detail/facebook-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc) (extension Chrome)
2. **Allez sur** : https://fortniteitems.netlify.app
3. **Ouvrez l'extension Pixel Helper** (icône en haut à droite)
4. **Vous devriez voir** :
   - ✅ Pixel détecté
   - ✅ Event: PageView
5. **Testez le parcours complet** :
   - Ajoutez un produit → Event: AddToCart
   - Cliquez sur Commander → Event: InitiateCheckout
   - Complétez l'achat → Event: Purchase

---

## 📊 Événements Trackés Automatiquement

### 1. **PageView** - Vue de page
- **Quand** : Chaque fois qu'une page est chargée
- **Données** : Aucune
- **Utilité** : Suivre le trafic global

### 2. **AddToCart** - Ajout au panier
- **Quand** : Utilisateur clique sur "Ajouter au panier"
- **Données** :
  - ID produit
  - Nom produit
  - Prix
  - Quantité
  - Monnaie (XOF)
- **Utilité** : Créer des audiences de personnes qui ajoutent au panier

### 3. **InitiateCheckout** - Début du checkout
- **Quand** : Utilisateur clique sur "Commander"
- **Données** :
  - Tous les articles du panier
  - Montant total
  - Nombre d'articles
- **Utilité** : Optimiser les publicités pour les personnes qui commencent un achat

### 4. **Purchase** - Achat complété ⭐
- **Quand** : Paiement réussi + page success.html affichée
- **Données** :
  - Order ID
  - Montant exact
  - Tous les produits achetés
  - Transaction ID pour éviter les doublons
- **Utilité** : L'ÉVÉNEMENT LE PLUS IMPORTANT - mesure les vraies conversions

---

## 💰 Optimisation des Publicités Facebook

### Configuration Campaign Budget Optimization (CBO)

1. **Créez une campagne** sur Facebook Ads Manager
2. **Objectif** : Conversions
3. **Événement de conversion** : **Purchase** (le plus important!)
4. **Fenêtre d'attribution** : 7 jours click / 1 jour view
5. **Budget** : Minimum 20,000 FCFA/jour pour l'apprentissage

### Audiences à Créer

**Audience 1 - Warm (Chaud)**
- Personnes qui ont visité le site (PageView)
- Durée : 30 derniers jours
- → Montrer des publicités avec témoignages

**Audience 2 - Hot (Très chaud)**
- Personnes qui ont ajouté au panier (AddToCart)
- Durée : 7 derniers jours
- → Retargeting agressif avec offre limitée

**Audience 3 - Checkout Abandoners**
- Personnes qui ont InitiateCheckout MAIS PAS Purchase
- Durée : 3 derniers jours
- → Rappels urgents "Terminez votre commande !"

**Audience 4 - Customers (Exclusion)**
- Personnes qui ont Purchase
- Durée : 180 jours
- → EXCLURE de vos publicités d'acquisition

### Lookalike Audiences

Une fois que vous avez **50+ purchases** :
1. **Créez un Lookalike à 1%** basé sur les acheteurs
2. **Testez des Lookalikes 2-5%** pour scaling
3. **Combinez** avec les intérêts Fortnite/Gaming

---

## 🔍 Vérification et Débogage

### Dans Facebook Events Manager

1. **Allez sur** : https://business.facebook.com/events_manager
2. **Sélectionnez votre pixel**
3. **Onglet "Test Events"**
4. **Faites un achat test sur votre site**
5. **Vérifiez que tous les événements apparaissent** :
   ```
   PageView → AddToCart → InitiateCheckout → Purchase
   ```

### Dans la Console du Navigateur

Appuyez sur **F12** sur votre site et regardez les logs :
```
✅ Pixel Facebook initialisé: 123456789012345
📊 Événement tracké: AddToCart {content_ids: ['2'], ...}
📊 Événement tracké: InitiateCheckout {value: 9000, ...}
🎉 Achat tracké: test-order-123 9000 FCFA
```

### Problèmes Courants

**❌ Pixel non détecté**
- Vérifiez que vous avez bien remplacé `VOTRE_PIXEL_ID_ICI`
- Videz le cache du navigateur (Ctrl+Shift+Delete)
- Vérifiez que `analytics.js` est bien chargé (onglet Network)

**❌ Événements Purchase ne se déclenchent pas**
- Vérifiez que vous arrivez bien sur `success.html` après paiement
- Regardez la console pour les erreurs JavaScript
- Vérifiez que `localStorage` contient `fortniteshop_pending_order`

**❌ Valeurs incorrectes**
- Toutes les valeurs sont en **FCFA** (pas en dollars)
- Facebook convertira automatiquement en USD pour les rapports

---

## 📈 Métriques à Suivre

### Dans Facebook Ads Manager

**Métriques d'Acquisition**
- **CPA** (Coût Par Acquisition) : Coût / Nombre de purchases
- **ROAS** (Return On Ad Spend) : Revenus / Dépenses publicitaires
- **CTR** (Click Through Rate) : Clics / Impressions

**Objectifs Réalistes**
- **CPA cible** : 2,000 - 5,000 FCFA (selon le produit)
- **ROAS cible** : 2.0x minimum (2 FCFA de revenu pour 1 FCFA dépensé)
- **CTR cible** : 2-5% (bon contenu publicitaire)

### Formules Importantes

```
ROAS = (Revenus des ventes / Coût publicitaire) x 100

Exemple:
- Dépenses pub: 50,000 FCFA
- Ventes générées: 150,000 FCFA
- ROAS = (150,000 / 50,000) = 3.0x ✅ Excellent!
```

```
Break-even ROAS = 1 / Marge bénéficiaire

Exemple:
- Marge: 40%
- Break-even ROAS = 1 / 0.40 = 2.5x
- → Vous devez faire minimum 2.5x pour être rentable
```

---

## 🎯 Stratégie de Publicité Recommandée

### Phase 1 : Test (Budget: 20,000 FCFA/jour)
- **Durée** : 7 jours
- **Objectif** : Apprendre et collecter des données
- **Ciblage** : Intérêts larges (Fortnite, Gaming, Consoles)
- **Créatifs** : Testez 3-5 visuels différents

### Phase 2 : Optimisation (Budget: 30,000-50,000 FCFA/jour)
- **Durée** : 14 jours
- **Objectif** : Trouver la meilleure audience/créatif
- **Ciblage** : Audiences qui performent + Lookalikes
- **Créatifs** : Gardez les gagnants, éliminez les perdants

### Phase 3 : Scaling (Budget: 50,000+ FCFA/jour)
- **Durée** : Continu
- **Objectif** : Maximiser les profits
- **Ciblage** : Dupliquer les campagnes gagnantes
- **Créatifs** : Rafraîchir toutes les 2 semaines

---

## ✅ Checklist de Lancement

Avant de lancer vos publicités :

- [ ] Pixel Facebook configuré avec le bon ID
- [ ] Extension Pixel Helper installée et pixel détecté
- [ ] Test d'achat complet effectué
- [ ] Événement Purchase visible dans Events Manager
- [ ] Audiences créées (Warm, Hot, Checkout Abandoners)
- [ ] Pixel de conversion défini sur Purchase
- [ ] Mode de paiement test désactivé (utiliser le vrai Lygos)
- [ ] Budget journalier défini (minimum 20,000 FCFA)
- [ ] 3-5 créatifs publicitaires prêts

---

## 📞 Support

**Problèmes techniques** : Vérifiez la console JavaScript  
**Problèmes Facebook** : https://www.facebook.com/business/help

---

**Date de création** : 31 octobre 2025  
**Version** : 1.0  
**Statut** : ✅ Prêt pour production
