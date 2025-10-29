#!/bin/bash

# 🧪 Script de vérification rapide du projet FortniteItems
# Usage: ./verify.sh

echo "======================================"
echo "🔍 VÉRIFICATION DU PROJET FORTNITEITEMS"
echo "======================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
total=0
passed=0
failed=0

# Fonction de test
test_file() {
    total=$((total + 1))
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1 existe"
        passed=$((passed + 1))
    else
        echo -e "${RED}❌${NC} $1 manquant"
        failed=$((failed + 1))
    fi
}

# Fonction de test de contenu
test_content() {
    total=$((total + 1))
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✅${NC} $1 contient '$2'"
        passed=$((passed + 1))
    else
        echo -e "${RED}❌${NC} $1 ne contient pas '$2'"
        failed=$((failed + 1))
    fi
}

echo "📁 Vérification des fichiers principaux..."
echo "-------------------------------------------"
test_file "index.html"
test_file "product.html"
test_file "cart.html"
test_file "success.html"
test_file "styles.css"
test_file "script.js"
test_file "cart.js"
test_file "product.js"
test_file "checkout.js"
test_file "README.md"

echo ""
echo "🖼️ Vérification des assets..."
echo "-------------------------------------------"
test_file "assets/1000vbucks.png"
test_file "assets/2800vbucks.png"
test_file "assets/5000vbucks.png"
test_file "assets/13500vbucks.png"
test_file "assets/crew.png"

echo ""
echo "📄 Vérification des fichiers de documentation..."
echo "-------------------------------------------"
test_file "LYGOS_CONFIG.md"
test_file "TEST_FLOW.md"
test_file "CORRECTIONS.md"

echo ""
echo "🔧 Vérification du contenu critique..."
echo "-------------------------------------------"
test_content "checkout.js" "function processPayment()"
test_content "checkout.js" "function nextStep(step)"
test_content "checkout.js" "function redirectToLygosPayment()"
test_content "checkout.js" "nextStep(3)"
test_content "checkout.js" "setTimeout"
test_content "cart.html" "id=\"step3\""
test_content "cart.html" "class=\"spinner\""
test_content "cart.html" "Traitement en cours"

echo ""
echo "📊 Vérification de la structure HTML..."
echo "-------------------------------------------"
test_content "cart.html" "checkout-step"
test_content "cart.html" "processPayment()"
test_content "success.html" "Commande Réussie"

echo ""
echo "🎨 Vérification des styles CSS..."
echo "-------------------------------------------"
test_content "styles.css" ".checkout-step"
test_content "styles.css" ".spinner"
test_content "styles.css" ".processing"
test_content "styles.css" "@keyframes spin"

echo ""
echo "======================================"
echo "📈 RÉSULTATS"
echo "======================================"
echo -e "Total de tests: ${YELLOW}$total${NC}"
echo -e "Réussis: ${GREEN}$passed${NC}"
echo -e "Échoués: ${RED}$failed${NC}"
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}🎉 TOUS LES TESTS SONT PASSÉS !${NC}"
    echo ""
    echo "✅ Votre projet est prêt pour le test manuel"
    echo ""
    echo "Pour tester :"
    echo "1. python3 -m http.server 8000"
    echo "2. Ouvrir http://localhost:8000"
    echo "3. Suivre le guide TEST_FLOW.md"
    exit 0
else
    echo -e "${RED}⚠️ CERTAINS TESTS ONT ÉCHOUÉ${NC}"
    echo ""
    echo "Veuillez vérifier les fichiers manquants ou le contenu incorrect."
    exit 1
fi
