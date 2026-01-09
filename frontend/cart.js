// ===========================
// CART MANAGEMENT SYSTEM
// ===========================

class ShoppingCart {
    constructor() {
        this.items = this.loadCart();
        this.init();
    }

    init() {
        this.updateCartCount();
        this.updateCartDisplay();
        this.attachEventListeners();
    }

    // Load cart from localStorage
    loadCart() {
        try {
            const saved = localStorage.getItem('fortniteshop_cart');
            if (!saved) return [];
            const parsed = JSON.parse(saved);
            if (!Array.isArray(parsed)) return [];
            return this.normalizeCartItems(parsed);
        } catch (error) {
            console.warn('Impossible de charger le panier localStorage', error);
            return [];
        }
    }

    normalizeCartItems(items) {
        return items.map((item) => ({
            ...item,
            baseId: item.baseId || this.extractBaseProductId(item.id),
            metadata: item.metadata || null
        }));
    }

    extractBaseProductId(id) {
        if (!id) return '';
        const normalized = String(id);
        const [head] = normalized.split('::');
        return head.split('-')[0];
    }

    // Save cart to localStorage
    saveCart() {
        localStorage.setItem('fortniteshop_cart', JSON.stringify(this.items));
    }

    // Add item to cart
    addItem(id, name, price, quantity = 1, options = {}) {
        const normalizedId = String(id);
        const safeQuantity = Math.max(1, parseInt(quantity, 10) || 1);
        const numericPrice = Number.parseFloat(price) || 0;
        const baseId = options.baseId || this.extractBaseProductId(normalizedId);
        const metadata = options.metadata || null;

        const existingItem = this.items.find(item => item.id === normalizedId);
        
        if (existingItem) {
            existingItem.quantity += safeQuantity;
            existingItem.price = numericPrice;
            existingItem.name = name;
            existingItem.baseId = existingItem.baseId || baseId;
            if (metadata) {
                existingItem.metadata = metadata;
            }
        } else {
            this.items.push({
                id: normalizedId,
                baseId,
                name,
                price: numericPrice,
                quantity: safeQuantity,
                metadata
            });
        }

        this.saveCart();
        this.updateCartCount();
        this.updateCartDisplay();
        this.showNotification(`✅ ${name} ajouté au panier !`);
        
        // 📊 Facebook Pixel - Tracker l'ajout au panier
        if (typeof fbq !== 'undefined') {
            fbq('track', 'AddToCart', {
                content_ids: [id],
                content_name: name,
                content_type: 'product',
                value: parseFloat(price),
                currency: 'XOF'  // Franc CFA
            });
        }
    }

    // Remove item from cart
    removeItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.saveCart();
        this.updateCartCount();
        this.updateCartDisplay();
        this.showNotification('❌ Produit retiré du panier');
    }

    // Update item quantity
    updateQuantity(id, quantity) {
        const item = this.items.find(item => item.id === id);
        if (item) {
            item.quantity = parseInt(quantity);
            if (item.quantity <= 0) {
                this.removeItem(id);
            } else {
                this.saveCart();
                this.updateCartDisplay();
            }
        }
    }

    // Get cart total
    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    // Get items count
    getItemsCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }

    // Update cart count badge
    updateCartCount() {
        const cartCounts = document.querySelectorAll('#cartCount, .cart-count');
        const count = this.getItemsCount();
        cartCounts.forEach(element => {
            element.textContent = count;
            element.style.display = count > 0 ? 'flex' : 'none';
        });
    }

    // Update cart display (cart page)
    updateCartDisplay() {
        const cartItems = document.getElementById('cartItems');
        const emptyCart = document.getElementById('emptyCart');
        const checkoutBtn = document.getElementById('checkoutBtn');
        
        if (!cartItems) return; // Not on cart page

        if (this.items.length === 0) {
            cartItems.style.display = 'none';
            emptyCart.style.display = 'flex';
            if (checkoutBtn) checkoutBtn.disabled = true;
        } else {
            cartItems.style.display = 'block';
            emptyCart.style.display = 'none';
            if (checkoutBtn) checkoutBtn.disabled = false;

            cartItems.innerHTML = this.items.map(item => `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-info">
                        <div class="cart-item-icon">
                            ${this.getProductIcon(item)}
                        </div>
                        <div class="cart-item-details">
                            <h3>${item.name}</h3>
                            <p class="item-price">${Math.round(item.price).toLocaleString()} F / unité</p>
                        </div>
                    </div>
                    <div class="cart-item-controls">
                        <div class="quantity-control">
                            <button class="qty-btn" onclick="cart.updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                            <input type="number" value="${item.quantity}" min="1" max="10" 
                                   onchange="cart.updateQuantity('${item.id}', this.value)" readonly>
                            <button class="qty-btn" onclick="cart.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                        </div>
                        <div class="item-total">${Math.round(item.price * item.quantity).toLocaleString()} F</div>
                        <button class="remove-btn" onclick="cart.removeItem('${item.id}')">🗑️</button>
                    </div>
                </div>
            `).join('');
        }

        this.updateCartSummary();
    }

    // Update cart summary
    updateCartSummary() {
        const subtotal = this.getTotal();
        const total = subtotal; // Add taxes/fees here if needed

        const subtotalEl = document.getElementById('subtotal');
        const totalEl = document.getElementById('total');

        if (subtotalEl) subtotalEl.textContent = `${Math.round(subtotal).toLocaleString()} F`;
        if (totalEl) totalEl.textContent = `${Math.round(total).toLocaleString()} F`;
    }

    // Get product icon based on ID
    getProductIcon(itemOrId) {
        const baseId = (itemOrId && typeof itemOrId === 'object')
            ? (itemOrId.baseId || this.extractBaseProductId(itemOrId.id))
            : this.extractBaseProductId(itemOrId);

        const icons = {
            '1': '<span class="product-icon-small" style="background: var(--gradient-primary);">V</span>',
            '2': '<span class="product-icon-small" style="background: var(--gradient-secondary);">V</span>',
            '3': '<span class="product-icon-small" style="background: var(--gradient-secondary);">V</span>',
            '4': '<span class="product-icon-small" style="background: linear-gradient(135deg, #FFD700, #FFA500);">👑</span>',
            '5': '<span class="product-icon-small" style="background: var(--gradient-primary);">🎮</span>'
        };
        return icons[baseId] || '<span class="product-icon-small">V</span>';
    }

    // Show notification
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Attach event listeners
    attachEventListeners() {
        // Add to cart buttons on product pages
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', (e) => {
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    if(confirm("Vous devez être connecté pour commander. Se connecter maintenant ?")) {
                       window.location.href = 'login.html';
                    }
                    return;
                }

                const btn = e.currentTarget;
                const id = btn.dataset.id;
                const name = btn.dataset.name;
                const price = btn.dataset.price;
                this.addItem(id, name, price);
                
                // Visual feedback
                btn.style.transform = 'scale(0.95)';
                setTimeout(() => btn.style.transform = 'scale(1)', 150);
            });
        });

        // Promo code
        const applyPromo = document.getElementById('applyPromo');
        if (applyPromo) {
            applyPromo.addEventListener('click', () => this.applyPromoCode());
        }

        // Checkout button
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.openCheckout());
        }
    }

    // Apply promo code
    applyPromoCode() {
        const promoInput = document.getElementById('promoInput');
        const promoSuccess = document.getElementById('promoSuccess');
        const code = promoInput.value.trim().toUpperCase();

        const validCodes = {
            'WELCOME10': 0.10,  // 10% off
            'FIRST20': 0.20,    // 20% off
            'VBUCKS15': 0.15    // 15% off
        };

        if (validCodes[code]) {
            const discount = validCodes[code];
            const subtotal = this.getTotal();
            const discountAmount = subtotal * discount;
            const newTotal = subtotal - discountAmount;

            // Store promo code
            localStorage.setItem('fortniteshop_promo', JSON.stringify({
                code: code,
                discount: discount
            }));

            // Update display
            if (promoSuccess) {
                promoSuccess.style.display = 'block';
                promoSuccess.innerHTML = `✅ Code "${code}" appliqué ! -${Math.round(discountAmount).toLocaleString()} F`;
            }

            const totalEl = document.getElementById('total');
            if (totalEl) totalEl.textContent = `${Math.round(newTotal).toLocaleString()} F`;

            this.showNotification(`🎉 Promo "${code}" appliquée !`);
        } else {
            this.showNotification('❌ Code promo invalide');
            if (promoSuccess) promoSuccess.style.display = 'none';
        }
    }

    // Open checkout modal
    openCheckout() {
        const modal = document.getElementById('checkoutModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Détecter le type de produit et adapter le formulaire
            if (typeof checkout !== 'undefined' && checkout.detectProductType) {
                checkout.detectProductType();
            }
            
            // 📊 Facebook Pixel - Tracker le début du checkout
            if (typeof fbq !== 'undefined') {
                const totalAmount = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const contentIds = this.items.map(item => item.id);
                const contents = this.items.map(item => ({
                    id: item.id,
                    quantity: item.quantity,
                    item_price: item.price
                }));
                
                fbq('track', 'InitiateCheckout', {
                    content_ids: contentIds,
                    contents: contents,
                    content_type: 'product',
                    value: totalAmount,
                    currency: 'XOF',
                    num_items: this.items.reduce((sum, item) => sum + item.quantity, 0)
                });
            }
        }
    }

    // Clear cart
    clearCart() {
        this.items = [];
        this.saveCart();
        this.updateCartCount();
        this.updateCartDisplay();
    }
}

// Initialize cart
const cart = new ShoppingCart();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShoppingCart;
}

