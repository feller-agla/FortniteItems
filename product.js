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
        image: 'https://cdn1.epicgames.com/offer/fn/FNECO_32-00_VbuckStoreArtUpdate_1000_EGS_1200x1600_1200x1600-e70f8c1bfbd98a4a3d619e9527aeef8e',
        description: 'Pack parfait pour commencer ton aventure Fortnite. Idéal pour acheter un skin, une emote ou un accessoire dans la boutique.',
        features: [
            '1000 V-Bucks instantanément livrés',
            'Valable sur toutes les plateformes',
            'Livraison en 0-5 minutes',
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
        image: 'https://cdn1.epicgames.com/offer/fn/FNECO_32-00_VbuckStoreArtUpdate_2800_EGS_1200x1600_1200x1600-380718e8fb23306b6e8a801d27880104',
        description: 'Le pack le plus populaire parmi nos clients ! Parfait équilibre entre quantité et prix. Idéal pour acheter plusieurs skins ou le Battle Pass avec des V-Bucks en rab.',
        features: [
            '2800 V-Bucks livrés instantanément',
            'Économie de 5 500 F par rapport au prix normal',
            'Assez pour Battle Pass + extras',
            'Livraison garantie en moins de 5 minutes',
            'Méthode 100% sécurisée, 0 risque de ban'
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
        image: 'https://cdn1.epicgames.com/offer/fn/FNECO_32-00_VbuckStoreArtUpdate_5000_EGS_1200x1600_1200x1600-eb3c8e7ca0803a6cb2fb374d271227f2',
        description: 'Notre meilleur rapport qualité-prix ! Assez de V-Bucks pour te faire plaisir pendant plusieurs saisons. Achète les meilleurs skins, emotes et accessoires sans compter.',
        features: [
            '5000 V-Bucks livrés instantanément',
            'Économie massive de 10 000 F',
            'Battle Pass + plusieurs skins légendaires',
            'Pack le plus vendu de notre boutique',
            'Livraison express garantie'
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
        image: 'https://cdn1.epicgames.com/offer/fn/FNECO_32-00_VbuckStoreArtUpdate_13500_EGS_1200x1600_1200x1600-d283e52ea33ff79da7d4be0ff86d6e52',
        description: 'Pour les vrais gamers ! Pack ultime qui te permet d\'acheter tout ce que tu veux dans Fortnite pendant des mois. Collection complète de skins, Battle Pass pour plusieurs saisons et plus encore.',
        features: [
            '13500 V-Bucks - Pack premium',
            'Économie exceptionnelle de 27 000 F',
            'Équivalent à plusieurs Battle Pass',
            'Collection complète de skins possibles',
            'Support prioritaire pour ce pack'
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
        image: 'https://cdn2.unrealengine.com/crew-subscription-share-image-1920x1080-1920x1080-d4a70e27ef1c.jpg',
        description: 'Abonnement mensuel qui inclut 1000 V-Bucks PLUS un skin exclusif Crew PLUS le Battle Pass de la saison actuelle. Meilleure valeur pour les joueurs réguliers !',
        features: [
            '1000 V-Bucks chaque mois',
            'Skin Fortnite Crew exclusif mensuel',
            'Battle Pass de la saison inclus',
            'Accès aux sauvegardes Fortnite',
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

