// ===========================
// PRODUCT PAGE MANAGER
// ===========================

// Product database
const products = {
    '1': {
        id: '1',
        name: '1000 V-Bucks',
        price: 3500,
        originalPrice: 5500,
        savings: 2000,
        rarity: 'legendary',
        badge: 'STARTER',
        icon: 'V',
        iconStyle: 'background: var(--gradient-primary);',
        image: 'assets/1000vbucks.png',
        description: 'Pack parfait pour commencer ton aventure Fortnite. Reçois tes 1000 V-Bucks directement sur ton compte principal. Plus besoin d\'attendre !',
        features: [
            '1000 V-Bucks ajoutés sur ton compte',
            'Livraison ultra-rapide (10-30 min)',
            'Aucun lien d\'amitié requis',
            'Profite de tes V-Bucks immédiatement',
            'Garantie satisfait ou remboursé',
            'Support client 24/7'
        ]
    },
    '2': {
        id: '2',
        name: '2800 V-Bucks',
        price: 9000,
        originalPrice: 14500,
        savings: 5500,
        rarity: 'epic',
        badge: '⭐ POPULAIRE',
        icon: 'V',
        iconStyle: 'background: var(--gradient-secondary);',
        image: 'assets/2800vbucks.png',
        paymentLink: 'https://pay.lygosapp.com/link/93049047-a2b4-4920-a708-b0547b39b585',
        description: 'Le pack le plus populaire ! Reçois 2800 V-Bucks directement sur ton compte. Idéal pour le Battle Pass et quelques skins.',
        features: [
            '2800 V-Bucks sur ton compte principal',
            'Économie de 5 500 F',
            'Parfait pour Battle Pass + Skins',
            'Livraison directe en 10-30 min',
            'Méthode 100% sécurisée et légale',
            'Utilisation immédiate des crédits'
        ]
    },
    '3': {
        id: '3',
        name: '5000 V-Bucks',
        price: 16000,
        originalPrice: 26000,
        savings: 10000,
        rarity: 'mythic',
        badge: '🔥 MEILLEUR DEAL',
        icon: 'V',
        iconStyle: 'background: var(--gradient-secondary);',
        image: 'assets/5000vbucks.png',
        paymentLink: 'https://pay.lygosapp.com/link/ecc76f1a-3aa7-4397-ae55-4aa76dc86a70',
        description: 'Notre meilleur rapport qualité-prix ! 5000 V-Bucks chargés directement sur ton compte. Fais-toi plaisir sans limites.',
        features: [
            '5000 V-Bucks livrés directement',
            'Économie massive de 10 000 F',
            'Débloque des tonnes de skins',
            'Plus d\'attente de 48h',
            'Livraison prioritaire',
            'Système sécurisé anti-ban'
        ]
    },
    '4': {
        id: '4',
        name: '13500 V-Bucks',
        price: 38000,
        originalPrice: 65000,
        savings: 27000,
        rarity: 'mythic',
        badge: '💎 MEGA PACK',
        icon: '👑',
        iconStyle: 'background: linear-gradient(135deg, #FFD700, #FFA500);',
        image: 'assets/13500vbucks.png',
        paymentLink: 'https://pay.lygosapp.com/link/dfc40c75-1d83-44c2-9c9b-469a83d62408',
        description: 'Pour les vrais gamers ! 13500 V-Bucks crédités sur ton compte. L\'offre ultime pour dominer la boutique pendant des mois.',
        features: [
            '13500 V-Bucks sur ton compte',
            'Économie exceptionnelle de 27 000 F',
            'Équivalent à plusieurs Battle Pass',
            'Accès immédiat à tout le catalogue',
            'Livraison VIP ultra-rapide',
            'Support dédié pour ce pack'
        ]
    },
    '5': {
        id: '5',
        name: 'Fortnite Crew',
        price: 4500,
        originalPrice: 7500,
        savings: 3000,
        rarity: 'legendary',
        badge: 'MENSUEL',
        icon: '🎮',
        iconStyle: 'background: var(--gradient-primary);',
        image: 'assets/crew.png',
        paymentLink: 'https://pay.lygosapp.com/link/ba797d68-7f79-4798-9edb-11f13559d802',
        description: 'Abonnement mensuel activé directement sur ton compte. Inclut 1000 V-Bucks + Skin exclusif + Battle Pass. Le top !',
        features: [
            '1000 V-Bucks chaque mois',
            'Skin Crew exclusif mensuel',
            'Battle Pass actif inclus',
            'Activation directe sur ton compte',
            'Annulable à tout moment'
        ]
    }
};

class ProductPage {
    constructor() {
        this.productId = this.getProductIdFromURL();
        this.quantity = 1;
        this.init();
    }

    init() {
        if (!this.productId || !products[this.productId]) {
            window.location.href = 'index.html';
            return;
        }

        this.product = products[this.productId];
        this.loadProductData();
        this.attachEventListeners();
    }

    getProductIdFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    loadProductData() {
        const p = this.product;

        // Update page title
        document.title = `${p.name} - Fortnite Shop`;

        // Product icon or image with overlay (same as homepage)
        const iconContainer = document.getElementById('productIcon');
        if (p.image) {
            // Use real image with text overlay
            iconContainer.innerHTML = `
                <div class="vbucks-image-container">
                    <img src="${p.image}" alt="${p.name}" class="vbucks-official-image">
                    <div class="card-overlay">
                        <div class="overlay-quantity">${p.name}</div>
                        <div class="overlay-price">${p.price.toLocaleString()} F</div>
                    </div>
                </div>
            `;
            iconContainer.style.cssText = 'background: transparent; padding: 0; border: none; border-radius: 20px; overflow: hidden;';
        } else {
            // Use icon fallback
            iconContainer.innerHTML = `<span class="icon-text" style="${p.iconStyle}">${p.icon}</span>`;
        }
        iconContainer.className = `product-large-icon ${p.rarity}`;

        // Product badge
        document.getElementById('productBadge').textContent = p.badge;

        // Full description
        document.getElementById('fullDescription').textContent = p.description;
    }

    attachEventListeners() {
        // Add to cart button
        const addToCartBtn = document.getElementById('addToCartBtn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => {
                cart.addItem(
                    this.product.id,
                    this.product.name,
                    this.product.price,
                    this.quantity
                );

                // Visual feedback
                addToCartBtn.style.transform = 'scale(0.95)';
                setTimeout(() => addToCartBtn.style.transform = 'scale(1)', 150);
            });
        }

        // Buy now button
        const buyNowBtn = document.getElementById('buyNowBtn');
        if (buyNowBtn) {
            buyNowBtn.addEventListener('click', () => {
                cart.addItem(
                    this.product.id,
                    this.product.name,
                    this.product.price,
                    this.quantity
                );
                setTimeout(() => {
                    window.location.href = 'cart.html';
                }, 300);
            });
        }

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        // Update buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });

        // Update panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
            if (pane.id === tabName) {
                pane.classList.add('active');
            }
        });
    }
}

// Quantity control
function changeQuantity(delta) {
    const input = document.getElementById('quantity');
    let newValue = parseInt(input.value) + delta;
    newValue = Math.max(1, Math.min(10, newValue));
    input.value = newValue;
    if (window.productPage) {
        window.productPage.quantity = newValue;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productPage = new ProductPage();
});

