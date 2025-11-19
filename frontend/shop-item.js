(function() {
    'use strict';

    class ShopItemPage {
        constructor() {
            this.apiBaseUrl = this.resolveBackendBaseUrl();
            this.itemId = this.getItemIdFromUrl();
            this.itemData = null;
            this.init();
        }

        resolveBackendBaseUrl() {
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                return 'http://localhost:5000';
            }
            return '';
        }

        getItemIdFromUrl() {
            const params = new URLSearchParams(window.location.search);
            return params.get('id');
        }

        async init() {
            if (!this.itemId) {
                this.showError('Aucun ID d\'article spécifié');
                return;
            }

            await this.loadItemData();
        }

        async loadItemData() {
            try {
                const response = await fetch(`${this.apiBaseUrl}/api/shop`);
                if (!response.ok) {
                    throw new Error(`Erreur API (${response.status})`);
                }

                const payload = await response.json();
                
                if (payload.success === false) {
                    throw new Error(payload.error || 'Impossible de charger la boutique');
                }

                // Trouver l'item dans les données
                let item = null;
                if (payload.items && Array.isArray(payload.items)) {
                    item = payload.items.find(i => i.id === this.itemId || i.entry?.offerId === this.itemId);
                }

                if (!item) {
                    this.showError('Article non trouvé');
                    return;
                }

                this.itemData = item;
                this.displayItem();
            } catch (error) {
                console.error('Erreur lors du chargement:', error);
                this.showError(error.message);
            }
        }

        displayItem() {
            const loadingEl = document.getElementById('shopItemLoading');
            const errorEl = document.getElementById('shopItemError');
            const contentEl = document.getElementById('shopItemContent');

            if (loadingEl) loadingEl.style.display = 'none';
            if (errorEl) errorEl.style.display = 'none';
            if (contentEl) {
                contentEl.style.display = 'block';
                // Animation de fade-in pour le contenu
                contentEl.style.opacity = '0';
                contentEl.style.transform = 'translateY(20px)';
                contentEl.style.transition = 'opacity 0.5s ease-in, transform 0.5s ease-in';
                setTimeout(() => {
                    contentEl.style.opacity = '1';
                    contentEl.style.transform = 'translateY(0)';
                }, 100);
            }

            // Image
            const imageEl = document.getElementById('shopItemImage');
            if (imageEl) {
                const imageUrl = this.itemData.images?.featured 
                    || this.itemData.images?.icon 
                    || 'assets/5000vbucks.png';
                imageEl.src = imageUrl;
                imageEl.alt = this.itemData.name || 'Article Fortnite';
                // Ajouter une animation de fade-in
                imageEl.style.opacity = '0';
                imageEl.style.transition = 'opacity 0.5s ease-in';
                setTimeout(() => {
                    imageEl.style.opacity = '1';
                }, 100);
            }

            // Nom
            const nameEl = document.getElementById('shopItemName');
            if (nameEl) {
                nameEl.textContent = this.itemData.name || 'Article Fortnite';
            }

            // Description
            const descEl = document.getElementById('shopItemDescription');
            if (descEl) {
                descEl.textContent = this.itemData.description || 'Disponible dans la boutique officielle.';
            }

            // Type
            const typeEl = document.getElementById('shopItemType');
            if (typeEl) {
                const type = this.itemData.type || 'N/A';
                typeEl.textContent = type;
            }

            // Rareté (seulement dans les métadonnées, pas à côté de l'image)
            const rarityTextEl = document.getElementById('shopItemRarityText');
            const rarity = this.itemData.rarity || 'Classique';
            if (rarityTextEl) {
                rarityTextEl.textContent = rarity;
            }

            // Prix
            const priceEl = document.getElementById('shopItemPrice');
            if (priceEl) {
                const price = this.itemData.vbucks || 0;
                priceEl.textContent = this.formatPrice(price);
            }

            // Date d'expiration
            if (this.itemData.outDate) {
                const expiryEl = document.getElementById('shopItemExpiry');
                const expiryDateEl = document.getElementById('shopItemExpiryDate');
                if (expiryEl) expiryEl.style.display = 'block';
                if (expiryDateEl) {
                    expiryDateEl.textContent = this.formatExpiry(this.itemData.outDate);
                }
            }

            // Stocker les items pour la navigation (pack ou items liés)
            this.allItems = [];
            
            // Si c'est un pack, utiliser bundle_items
            if (this.itemData.is_bundle && this.itemData.bundle_items) {
                this.allItems = this.itemData.bundle_items.map((item, index) => ({
                    ...item,
                    isMain: index === 0
                }));
            }
            // Si c'est un item avec des items liés (tenue + accessoire)
            else if (this.itemData.has_related_items && this.itemData.related_items) {
                // Ajouter l'item principal en premier
                this.allItems.push({
                    id: this.itemData.id,
                    name: this.itemData.name,
                    type: this.itemData.type,
                    rarity: this.itemData.rarity,
                    description: this.itemData.description,
                    images: this.itemData.images,
                    isMain: true
                });
                // Ajouter les items liés
                this.itemData.related_items.forEach(item => {
                    this.allItems.push({
                        ...item,
                        isMain: false
                    });
                });
            }
            
            // Vidéo - chercher dans l'item principal ou les items du pack
            let currentVideoId = null;
            if (this.itemData.br_item?.showcaseVideo) {
                currentVideoId = this.itemData.br_item.showcaseVideo;
            } else if (this.itemData.entry?.brItems?.[0]?.showcaseVideo) {
                currentVideoId = this.itemData.entry.brItems[0].showcaseVideo;
            }
            
            // Afficher le bouton vidéo en bas si disponible
            if (currentVideoId) {
                const videoEl = document.getElementById('shopItemVideo');
                const videoLinkEl = document.getElementById('shopItemVideoLink');
                if (videoEl) videoEl.style.display = 'block';
                if (videoLinkEl) {
                    videoLinkEl.href = `https://www.youtube.com/watch?v=${currentVideoId}`;
                }
            }

            // Bundle (pack) - afficher la liste détaillée dans la section info avec clics
            if (this.itemData.is_bundle && this.itemData.bundle_items) {
                const bundleEl = document.getElementById('shopItemBundle');
                const bundleItemsEl = document.getElementById('shopItemBundleItems');
                if (bundleEl) bundleEl.style.display = 'block';
                if (bundleItemsEl) {
                    bundleItemsEl.innerHTML = this.itemData.bundle_items.map((item, index) => {
                        const imageUrl = item.images?.icon || item.images?.smallIcon || item.images?.featured || 'assets/icon.png';
                        const isActive = index === 0 ? 'active' : '';
                        return `
                            <div class="bundle-item clickable ${isActive}" data-item-index="${index}">
                                <img src="${imageUrl}" 
                                     alt="${this.escapeHtml(item.name)}" 
                                     class="bundle-item-image">
                                <div class="bundle-item-info">
                                    <h4>${this.escapeHtml(item.name)}</h4>
                                    <p>${this.escapeHtml(item.type)} · ${this.escapeHtml(item.rarity)}</p>
                                </div>
                            </div>
                        `;
                    }).join('');
                    
                    // Ajouter les event listeners
                    bundleItemsEl.querySelectorAll('.bundle-item.clickable').forEach((bundleItem, index) => {
                        bundleItem.addEventListener('click', () => {
                            this.selectBundleItem(this.itemData.bundle_items[index], index);
                        });
                    });
                }
            }

            // Items secondaires (tenue + accessoire de dos, etc.)
            if (this.itemData.has_related_items && this.itemData.related_items) {
                const bundleEl = document.getElementById('shopItemBundle');
                const bundleItemsEl = document.getElementById('shopItemBundleItems');
                if (bundleEl) {
                    bundleEl.style.display = 'block';
                    const titleEl = bundleEl.querySelector('h3');
                    if (titleEl) titleEl.textContent = 'Contenu inclus:';
                }
                if (bundleItemsEl) {
                    // Ajouter l'item principal en premier
                    const mainItem = {
                        id: this.itemData.id,
                        name: this.itemData.name,
                        type: this.itemData.type,
                        rarity: this.itemData.rarity,
                        description: this.itemData.description,
                        images: this.itemData.images
                    };
                    const allRelatedItems = [mainItem, ...this.itemData.related_items];
                    
                    bundleItemsEl.innerHTML = allRelatedItems.map((item, index) => {
                        const imageUrl = item.images?.icon || item.images?.smallIcon || item.images?.featured || 'assets/icon.png';
                        const isActive = index === 0 ? 'active' : '';
                        return `
                            <div class="bundle-item clickable ${isActive}" data-item-index="${index}">
                                <img src="${imageUrl}" 
                                     alt="${this.escapeHtml(item.name)}" 
                                     class="bundle-item-image">
                                <div class="bundle-item-info">
                                    <h4>${this.escapeHtml(item.name)}</h4>
                                    <p>${this.escapeHtml(item.type)} · ${this.escapeHtml(item.rarity)}</p>
                                </div>
                            </div>
                        `;
                    }).join('');
                    
                    // Ajouter les event listeners
                    bundleItemsEl.querySelectorAll('.bundle-item.clickable').forEach((bundleItem, index) => {
                        bundleItem.addEventListener('click', () => {
                            this.selectBundleItem(allRelatedItems[index], index);
                        });
                    });
                }
            }

            // Bouton ajouter au panier
            const addToCartEl = document.getElementById('shopItemAddToCart');
            if (addToCartEl) {
                addToCartEl.addEventListener('click', () => {
                    this.addToCart();
                });
            }
        }

        addToCart() {
            if (!this.itemData) return;

            const item = {
                id: this.itemData.id || '',
                name: this.itemData.name || 'Article Fortnite',
                price: this.itemData.vbucks || 0,
                section: this.itemData.section || 'Boutique'
            };

            // Utiliser le système de panier existant
            if (window.orderBridge) {
                window.orderBridge.addToCart(item);
                window.location.href = 'cart.html';
            } else {
                // Fallback: redirection vers le panier avec les paramètres
                const params = new URLSearchParams({
                    id: item.id,
                    name: item.name,
                    price: item.price
                });
                window.location.href = `cart.html?${params.toString()}`;
            }
        }

        showError(message) {
            const loadingEl = document.getElementById('shopItemLoading');
            const errorEl = document.getElementById('shopItemError');
            const contentEl = document.getElementById('shopItemContent');

            if (loadingEl) loadingEl.style.display = 'none';
            if (contentEl) contentEl.style.display = 'none';
            if (errorEl) {
                errorEl.style.display = 'block';
                const errorText = errorEl.querySelector('p');
                if (errorText) errorText.textContent = `❌ ${message}`;
            }
        }

        formatPrice(vbucks) {
            // Conversion V-Bucks -> FCFA (même formule que shop.js)
            const DEFAULT_USD_TO_XOF = 580;
            const usd = vbucks * 0.00357 * 1.5;
            const rate = Number(window.FORTNITE_ITEMS_USD_TO_XOF) || DEFAULT_USD_TO_XOF;
            const fcfa = usd * rate;
            const rounded = Math.round(fcfa / 100) * 100;
            return `${rounded.toLocaleString('fr-FR')} FCFA`;
        }

        formatExpiry(dateString) {
            const timestamp = Date.parse(dateString);
            if (Number.isNaN(timestamp)) return 'Quitte bientôt';
            const date = new Date(timestamp);
            const day = date.getDate();
            const month = date.toLocaleDateString('fr-FR', { month: 'short' });
            const year = date.getFullYear();
            return `${day} ${month} ${year}`;
        }

        slugify(value) {
            const base = (value || '').toString().trim().toLowerCase();
            return base.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'standard';
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        selectBundleItem(item, index) {
            // Mettre à jour l'image principale (utiliser featured en priorité, puis icon)
            const imageEl = document.getElementById('shopItemImage');
            if (imageEl) {
                const imageUrl = item.images?.featured || item.images?.icon || item.images?.smallIcon || 'assets/5000vbucks.png';
                imageEl.src = imageUrl;
                imageEl.alt = item.name || 'Article Fortnite';
                // Animation de fade-in
                imageEl.style.opacity = '0';
                setTimeout(() => {
                    imageEl.style.opacity = '1';
                }, 100);
            }
            
            // Mettre à jour le nom
            const nameEl = document.getElementById('shopItemName');
            if (nameEl) {
                nameEl.textContent = item.name || 'Article Fortnite';
            }
            
            // Mettre à jour la description
            const descEl = document.getElementById('shopItemDescription');
            if (descEl) {
                descEl.textContent = item.description || 'Disponible dans la boutique officielle.';
            }
            
            // Mettre à jour le type
            const typeEl = document.getElementById('shopItemType');
            if (typeEl) {
                typeEl.textContent = item.type || 'N/A';
            }
            
            // Mettre à jour la rareté (seulement dans les métadonnées)
            const rarityTextEl = document.getElementById('shopItemRarityText');
            const rarity = item.rarity || 'Classique';
            if (rarityTextEl) {
                rarityTextEl.textContent = rarity;
            }
            
            // Mettre à jour l'état actif dans la section bundle
            const bundleItemsEl = document.getElementById('shopItemBundleItems');
            if (bundleItemsEl) {
                bundleItemsEl.querySelectorAll('.bundle-item').forEach((bundleItem, i) => {
                    if (i === index) {
                        bundleItem.classList.add('active');
                    } else {
                        bundleItem.classList.remove('active');
                    }
                });
            }
        }
    }

    // Initialiser la page quand le DOM est prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new ShopItemPage();
        });
    } else {
        new ShopItemPage();
    }
})();

