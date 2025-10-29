# 🚨 ACTION REQUISE : Configuration Dashboard Render

## ⚠️ Problème Identifié

Render cherche le port 5000 au lieu de 10000, ce qui signifie qu'il y a probablement une variable d'environnement `PORT=5000` configurée dans le dashboard.

---

## 📋 Actions à Effectuer MAINTENANT

### 1. Allez sur le Dashboard Render
```
https://dashboard.render.com
```

### 2. Sélectionnez votre service `fortniteitems-backend`

### 3. Allez dans l'onglet **"Environment"**

### 4. Cherchez la variable `PORT`

**Option A - Si `PORT` existe avec la valeur 5000** :
- Cliquez sur le bouton "Edit" ou "Delete"
- **SUPPRIMEZ** cette variable
- OU changez sa valeur à `10000`

**Option B - Si `PORT` n'existe pas** :
- Rien à faire, passez à l'étape suivante

### 5. Sauvegardez les changements

Cliquez sur "Save Changes" en haut à droite.

---

## 🚀 Puis Déployez les Nouveaux Fichiers

Maintenant que nous avons créé `gunicorn.conf.py`, commitons et pushons :

```bash
git add gunicorn.conf.py render.yaml
git commit -m "Add gunicorn config file for dynamic port binding"
git push
```

---

## 🔍 Ce Qui Va Se Passer

1. **gunicorn.conf.py** lira automatiquement `os.getenv('PORT')` fourni par Render
2. Si `PORT` n'est pas défini, il utilisera `10000` par défaut
3. Render détectera le bon port
4. ✅ Déploiement réussi !

---

## 📊 Vérification des Logs

Après le déploiement, vous devriez voir dans les logs :

```
[INFO] Starting gunicorn 21.2.0
[INFO] Listening at: http://0.0.0.0:10000 (56)
✅ Port 10000 detected successfully
```

Et **PAS** :
```
❌ Continuing to scan for open port 5000...
```

---

## 🆘 Si Ça Ne Fonctionne Toujours Pas

Contactez le support Render et demandez :
- Quelle est la valeur de la variable d'environnement `PORT` ?
- Y a-t-il des variables d'environnement cachées/système ?

Ou essayez de logger toutes les variables :

```python
# Dans lygos.py au démarrage
import os
print("=== ENVIRONMENT VARIABLES ===")
print(f"PORT: {os.getenv('PORT', 'NOT SET')}")
print(f"All env vars: {dict(os.environ)}")
```

---

**Faites ces actions AVANT de pusher le nouveau code !**
