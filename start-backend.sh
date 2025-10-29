#!/bin/bash

# Script de démarrage du backend FortniteItems

echo "🚀 Démarrage du Backend FortniteItems"
echo "======================================"

# Vérifier si Python3 est installé
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 n'est pas installé"
    exit 1
fi

echo "✅ Python3 trouvé"

# Vérifier si les dépendances sont installées
echo "📦 Vérification des dépendances..."
python3 -c "import flask, flask_cors, requests" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "📥 Installation des dépendances..."
    pip3 install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "❌ Erreur lors de l'installation des dépendances"
        exit 1
    fi
fi

echo "✅ Dépendances OK"
echo ""
echo "🌐 Le backend sera accessible sur:"
echo "   http://localhost:5000"
echo ""
echo "🔗 Endpoints disponibles:"
echo "   POST   /api/create-payment    - Créer un paiement"
echo "   POST   /api/webhook/lygos     - Webhook Lygos"
echo "   GET    /api/order/<id>        - Détails commande"
echo "   GET    /api/orders            - Toutes les commandes"
echo "   GET    /health                - Health check"
echo ""
echo "⚠️  IMPORTANT: Assurez-vous que le frontend est aussi démarré sur le port 8000"
echo "   Pour démarrer le frontend: python3 -m http.server 8000"
echo ""
echo "🛑 Pour arrêter le serveur: Ctrl+C"
echo ""
echo "======================================"
echo ""

# Démarrer le serveur
python3 lygos.py
