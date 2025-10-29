#!/bin/bash

# Script de test du backend FortniteItems

echo "🧪 Test du Backend FortniteItems"
echo "================================="

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URL du backend (modifier selon votre cas)
BACKEND_URL="${1:-http://localhost:5000}"

echo -e "\n${BLUE}🔍 Backend URL: ${BACKEND_URL}${NC}\n"

# Test 1: Health Check
echo -e "${BLUE}Test 1: Health Check${NC}"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "${BACKEND_URL}/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Health check OK${NC}"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}❌ Health check failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi

# Test 2: Create Payment
echo -e "\n${BLUE}Test 2: Create Payment${NC}"
PAYMENT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BACKEND_URL}/api/create-payment" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 9000,
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
  }')

HTTP_CODE=$(echo "$PAYMENT_RESPONSE" | tail -n1)
BODY=$(echo "$PAYMENT_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Création paiement OK${NC}"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
    
    # Extraire l'order_id
    ORDER_ID=$(echo "$BODY" | jq -r '.order_id' 2>/dev/null)
    
    if [ ! -z "$ORDER_ID" ] && [ "$ORDER_ID" != "null" ]; then
        # Test 3: Get Order
        echo -e "\n${BLUE}Test 3: Get Order Details${NC}"
        ORDER_RESPONSE=$(curl -s -w "\n%{http_code}" "${BACKEND_URL}/api/order/${ORDER_ID}")
        HTTP_CODE=$(echo "$ORDER_RESPONSE" | tail -n1)
        BODY=$(echo "$ORDER_RESPONSE" | head -n-1)
        
        if [ "$HTTP_CODE" -eq 200 ]; then
            echo -e "${GREEN}✅ Récupération commande OK${NC}"
            echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
        else
            echo -e "${RED}❌ Récupération commande failed (HTTP $HTTP_CODE)${NC}"
            echo "$BODY"
        fi
    fi
else
    echo -e "${RED}❌ Création paiement failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi

# Test 4: Get All Orders
echo -e "\n${BLUE}Test 4: Get All Orders${NC}"
ORDERS_RESPONSE=$(curl -s -w "\n%{http_code}" "${BACKEND_URL}/api/orders")
HTTP_CODE=$(echo "$ORDERS_RESPONSE" | tail -n1)
BODY=$(echo "$ORDERS_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Récupération commandes OK${NC}"
    ORDER_COUNT=$(echo "$BODY" | jq '. | length' 2>/dev/null)
    echo "Nombre de commandes: $ORDER_COUNT"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}❌ Récupération commandes failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi

echo -e "\n${BLUE}=================================${NC}"
echo -e "${GREEN}✅ Tests terminés !${NC}"
