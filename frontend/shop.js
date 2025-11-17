(function () {
    const root = document.getElementById('shopApp');
    if (!root) return;

    class ShopOrderBridge {
        constructor(packOptions = []) {
            this.packOptions = Array.isArray(packOptions) ? packOptions : [];
            this.modal = document.getElementById('shopOrderModal');
            this.itemNameEl = document.getElementById('shopOrderItemName');
            this.itemPriceEl = document.getElementById('shopOrderItemPrice');
            this.packSelect = document.getElementById('shopPackSelect');
            this.noteInput = document.getElementById('shopOrderNote');
            this.addBtn = document.getElementById('shopOrderAddBtn');
            this.viewCartBtn = document.getElementById('shopOrderViewCart');
            this.closeBtn = document.getElementById('shopOrderClose');
            this.currentItem = null;
            this.isReady = Boolean(this.modal && this.packSelect && this.addBtn);
            this.handleBackdrop = (event) => {
                if (event.target === this.modal) {
                    this.closeModal();
                }
            };
            this.handleEscape = (event) => {
                if (event.key === 'Escape') {
                    this.closeModal();
                }
            };
            if (this.isReady) {
                this.renderPackOptions();
                this.bindModalEvents();
            }
        }

        bind(trigger, item = {}) {
            if (!this.isReady || !trigger || trigger.dataset.cartBridgeBound === 'true') return;
            trigger.addEventListener('click', (event) => {
                event.preventDefault();
                this.openWithItem(item);
            });
            trigger.dataset.cartBridgeBound = 'true';
        }

        renderPackOptions() {
            if (!this.packSelect) return;
            const options = this.packOptions.map((pack) => {
                const label = `${pack.name} · ${Math.round(pack.price).toLocaleString('fr-FR')} F`;
                return `<option value="${pack.id}">${label}</option>`;
            }).join('');
            this.packSelect.innerHTML = options;
            if (!this.packSelect.value && this.packOptions.length) {
                this.packSelect.value = this.packOptions[0].id;
            }
        }

        bindModalEvents() {
            if (!this.modal) return;
            this.modal.addEventListener('click', this.handleBackdrop);
            this.closeBtn?.addEventListener('click', () => this.closeModal());
            document.addEventListener('keydown', this.handleEscape);
            this.addBtn?.addEventListener('click', () => this.handleAddToCart());
            this.viewCartBtn?.addEventListener('click', () => this.handleViewCart());
        }

        openWithItem(item) {
            this.currentItem = item || {};
            if (this.itemNameEl) {
                this.itemNameEl.textContent = this.currentItem.name || 'Boutique Fortnite';
            }
            if (this.itemPriceEl) {
                if (Number.isFinite(this.currentItem.price)) {
                    this.itemPriceEl.textContent = `${Math.round(this.currentItem.price).toLocaleString('fr-FR')} V-Bucks`;
                } else {
                    this.itemPriceEl.textContent = '--';
                }
            }
            if (this.noteInput) {
                this.noteInput.value = this.currentItem.name
                    ? `Skin souhaité: ${this.currentItem.name}`
                    : '';
            }
            this.openModal();
        }

        openModal() {
            if (!this.modal) return;
            this.modal.classList.add('is-visible');
            this.modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }

        closeModal() {
            if (!this.modal) return;
            this.modal.classList.remove('is-visible');
            this.modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }

        handleAddToCart() {
            if (typeof cart === 'undefined' || typeof cart.addItem !== 'function') {
                console.warn('🛒 Cart non disponible, impossible d’ajouter le pack');
                return;
            }
            const pack = this.getSelectedPack();
            if (!pack) return;
            const suffix = this.currentItem?.name ? ` · ${this.currentItem.name}` : '';
            const lineName = `${pack.name}${suffix}`;
            cart.addItem(pack.id, lineName, pack.price, 1);
            this.persistNote();
            this.closeModal();
        }

        handleViewCart() {
            this.closeModal();
            window.location.href = 'cart.html';
        }

        getSelectedPack() {
            if (!this.packOptions.length) return null;
            const selectedId = this.packSelect?.value;
            return this.packOptions.find((pack) => pack.id === selectedId) || this.packOptions[0];
        }

        persistNote() {
            const note = this.noteInput?.value.trim();
            if (!note) return;
            try {
                const payload = {
                    item: this.currentItem?.name || null,
                    note,
                    section: this.currentItem?.section || null,
                    createdAt: new Date().toISOString()
                };
                sessionStorage.setItem('fortniteitems_shop_note', JSON.stringify(payload));
            } catch (error) {
                console.warn('Impossible de stocker la note utilisateur', error);
            }
        }
    }

    class FortniteShopPage {
        constructor(rootElement) {
            this.root = rootElement;
            this.apiBaseUrl = this.resolveBackendBaseUrl();
            this.orderFlowUrl = 'index.html#products';
            this.packOptions = [
                { id: '1', name: 'Pack 1000 V-Bucks', price: 3500 },
                { id: '2', name: 'Pack 2800 V-Bucks', price: 9000 },
                { id: '3', name: 'Pack 5000 V-Bucks', price: 16000 },
                { id: '4', name: 'Pack 13500 V-Bucks', price: 38000 },
                { id: '5', name: 'Fortnite Crew', price: 4500 }
            ];
            this.state = {
                loading: true,
                error: null,
                sections: [],
                totalItems: 0,
                filters: {
                    search: '',
                    rarity: 'all',
                    type: 'all',
                    sort: 'featured'
                },
                meta: {
                    lastUpdated: null,
                    ttlSeconds: 900,
                    vbuckIcon: null
                }
            };

            this.elements = {
                sections: document.getElementById('shopSections'),
                skeletons: document.getElementById('shopSkeletonWrapper'),
                emptyState: document.getElementById('shopEmptyState'),
                resetFilters: document.getElementById('shopResetFilters'),
                statusBanner: document.getElementById('shopStatusBanner'),
                lastUpdate: document.getElementById('shopLastUpdate'),
                totalItems: document.getElementById('shopItemsCount'),
                ttl: document.getElementById('shopTtl'),
                search: document.getElementById('shopSearch'),
                rarity: document.getElementById('shopFilterRarity'),
                type: document.getElementById('shopFilterType'),
                sort: document.getElementById('shopFilterSort'),
                refresh: document.getElementById('shopRefreshButton'),
                featuredName: document.getElementById('shopFeaturedName'),
                featuredDescription: document.getElementById('shopFeaturedDescription'),
                featuredPrice: document.getElementById('shopFeaturedPrice'),
                featuredCta: document.getElementById('shopFeaturedCta'),
                featuredTag: document.getElementById('shopFeaturedTag'),
                featuredBadge: document.getElementById('shopFeaturedBadge'),
                featuredMedia: document.getElementById('shopFeaturedMedia'),
                hero: document.getElementById('shopHero')
            };

            this.searchDebounce = null;
            this.orderBridge = new ShopOrderBridge(this.packOptions);
            this.bindEvents();
            this.renderSkeletons();
            this.loadShopData();
        }

        resolveBackendBaseUrl() {
            if (window.FORTNITE_ITEMS_BACKEND) {
                return window.FORTNITE_ITEMS_BACKEND;
            }

            const host = window.location.hostname;
            const isLocalhost = ['localhost', '127.0.0.1'].includes(host);
            if (isLocalhost) {
                return 'http://localhost:5000';
            }

            return 'https://fortniteitems-backend.onrender.com';
        }

        bindEvents() {
            this.elements.refresh?.addEventListener('click', () => this.loadShopData(true));
            this.elements.resetFilters?.addEventListener('click', () => this.resetFilters());

            this.elements.search?.addEventListener('input', () => {
                clearTimeout(this.searchDebounce);
                this.searchDebounce = setTimeout(() => this.applyFilterChanges(), 250);
            });

            ['rarity', 'type', 'sort'].forEach((key) => {
                const element = this.elements[key];
                element?.addEventListener('change', () => this.applyFilterChanges());
            });

            document.addEventListener('visibilitychange', () => {
                if (!document.hidden && this.isDataOutdated()) {
                    this.loadShopData();
                }
            });
        }

        renderSkeletons() {
            if (!this.elements.skeletons) return;
            const placeholders = Array.from({ length: 6 })
                .map(() => '<div class="shop-skeleton-card"></div>')
                .join('');
            this.elements.skeletons.innerHTML = placeholders;
        }

        setLoading(isLoading) {
            this.state.loading = isLoading;
            this.root.classList.toggle('is-loading', Boolean(isLoading));
            this.toggleControls(isLoading);
            if (isLoading && this.elements.skeletons) {
                this.elements.skeletons.removeAttribute('hidden');
            }
        }

        toggleControls(disabled) {
            const controls = [
                this.elements.search,
                this.elements.rarity,
                this.elements.type,
                this.elements.sort,
                this.elements.refresh,
                this.elements.resetFilters
            ];
            controls.forEach((control) => {
                if (control) control.disabled = Boolean(disabled);
            });
        }

        async loadShopData(forceRefresh = false) {
            this.setLoading(true);
            this.state.error = null;

            const url = `${this.apiBaseUrl}/api/shop${forceRefresh ? '?refresh=1' : ''}`;

            try {
                const response = await fetch(url, {
                    headers: { Accept: 'application/json' },
                    cache: forceRefresh ? 'reload' : 'default'
                });

                if (!response.ok) {
                    throw new Error(`Erreur API (${response.status})`);
                }

                const payload = await response.json();

                if (!payload.success) {
                    throw new Error(payload.error || 'Impossible de récupérer la boutique Fortnite');
                }

                this.state.meta.lastUpdated = payload.last_updated;
                this.state.meta.ttlSeconds = payload.ttl_seconds || this.state.meta.ttlSeconds;
                this.state.meta.vbuckIcon = payload.data?.vbuckIcon || null;
                this.state.sections = this.normalizeSections(payload.data);
                this.state.totalItems = this.state.sections.reduce((sum, section) => sum + section.items.length, 0);
                this.populateFilterOptions();
                this.render();
            } catch (error) {
                console.error('❌ Impossible de charger la boutique Fortnite', error);
                this.state.error = error.message;
                this.renderError();
            } finally {
                this.setLoading(false);
            }
        }

        normalizeSections(data) {
            const entries = Array.isArray(data?.entries) ? data.entries : [];
            const sectionsMap = new Map();

            entries.forEach((entry, index) => {
                const layout = entry.layout || {};
                const sectionName = layout.name || entry.categories?.[0] || 'Boutique Fortnite';
                const sectionId = layout.id || sectionName.toLowerCase().replace(/\s+/g, '-');

                if (!sectionsMap.has(sectionId)) {
                    sectionsMap.set(sectionId, {
                        id: sectionId,
                        title: sectionName,
                        subtitle: layout.categoryName || layout.displayType || '',
                        index: typeof layout.index === 'number' ? layout.index : sectionsMap.size,
                        items: []
                    });
                }

                const section = sectionsMap.get(sectionId);
                section.items.push(this.normalizeItem(entry, index));
            });

            return Array.from(sectionsMap.values()).sort((a, b) => (a.index ?? 999) - (b.index ?? 999));
        }

        normalizeItem(entry, fallbackIndex = 0) {
            const brItem = Array.isArray(entry.brItems) ? entry.brItems[0] || {} : {};
            const rarityName = brItem.rarity?.displayValue || entry.rarity?.name || 'Classique';
            const raritySlug = this.slugify(brItem.rarity?.value || rarityName || 'standard');
            const typeName = brItem.type?.displayValue || entry.displayType || 'Objet';
            const typeSlug = this.slugify(brItem.type?.value || typeName || 'item');
            const price = entry.finalPrice ?? entry.price?.finalPrice ?? entry.price?.regularPrice ?? entry.regularPrice ?? 0;

            const primaryImage = entry.newDisplayAsset?.renderImages?.[0]?.image
                || brItem.images?.featured
                || brItem.images?.icon
                || entry.displayAssets?.[0]?.url
                || 'assets/5000vbucks.png';

            const expiresAt = entry.outDate || null;
            const tags = [];
            if (entry.giftable) tags.push('🎁 Cadeau autorisé');
            if (entry.refundable) tags.push('↩️ Remboursable');
            if (expiresAt && this.computeHoursLeft(expiresAt) <= 2) {
                tags.push('⏰ Quitte bientôt');
            }
            if (brItem.series?.value) {
                tags.push(brItem.series.value);
            }

            return {
                id: brItem.id || entry.offerId,
                name: brItem.name || entry.devName || 'Objet Fortnite',
                description: brItem.description || entry.displayDescription || 'Disponible aujourd\'hui dans la boutique.',
                price,
                rarity: { name: rarityName, slug: raritySlug },
                type: { name: typeName, slug: typeSlug },
                image: primaryImage,
                video: brItem.showcaseVideo ? `https://www.youtube.com/watch?v=${brItem.showcaseVideo}` : null,
                tags,
                giftable: Boolean(entry.giftable),
                refundable: Boolean(entry.refundable),
                expiresAt,
                order: entry.layout?.index ?? entry.sortPriority ?? fallbackIndex,
                meta: {
                    introduction: brItem.introduction?.text || null,
                    set: brItem.set?.value || null,
                    series: brItem.series?.value || null
                }
            };
        }

        computeHoursLeft(dateString) {
            const timestamp = Date.parse(dateString);
            if (Number.isNaN(timestamp)) return Infinity;
            const diffMs = timestamp - Date.now();
            return diffMs / 3_600_000; // hours
        }

        populateFilterOptions() {
            const rarityMap = new Map();
            const typeMap = new Map();

            this.state.sections.forEach((section) => {
                section.items.forEach((item) => {
                    rarityMap.set(item.rarity.slug, item.rarity.name);
                    typeMap.set(item.type.slug, item.type.name);
                });
            });

            this.renderSelectOptions(this.elements.rarity, rarityMap, 'Toutes les raretés');
            this.renderSelectOptions(this.elements.type, typeMap, 'Tous les types');
        }

        renderSelectOptions(selectElement, optionMap, defaultLabel) {
            if (!selectElement) return;

            const currentValue = selectElement.value;
            const defaultOption = new Option(defaultLabel, 'all');

            selectElement.innerHTML = '';
            selectElement.appendChild(defaultOption);

            optionMap.forEach((label, value) => {
                const option = new Option(label, value);
                selectElement.appendChild(option);
            });

            if (optionMap.has(currentValue)) {
                selectElement.value = currentValue;
            } else {
                selectElement.value = 'all';
            }
        }

        applyFilterChanges() {
            this.state.filters = {
                search: this.elements.search?.value.trim().toLowerCase() || '',
                rarity: this.elements.rarity?.value || 'all',
                type: this.elements.type?.value || 'all',
                sort: this.elements.sort?.value || 'featured'
            };
            this.renderSections();
            this.updateHero();
        }

        resetFilters() {
            if (this.elements.search) this.elements.search.value = '';
            if (this.elements.rarity) this.elements.rarity.value = 'all';
            if (this.elements.type) this.elements.type.value = 'all';
            if (this.elements.sort) this.elements.sort.value = 'featured';
            this.applyFilterChanges();
        }

        render() {
            if (this.state.error) {
                this.renderError();
                return;
            }

            this.renderStatus();
            this.updateHero();
            this.renderSections();
            this.updateStats();
        }

        renderStatus() {
            if (!this.elements.statusBanner) return;

            if (this.state.error) {
                this.elements.statusBanner.classList.add('is-error');
                this.elements.statusBanner.innerHTML = `
                    <p>⚠️ ${this.state.error}
                        <button type="button" class="ghost-button ghost-button--inline" id="shopRetryButton">Réessayer</button>
                    </p>`;
                document.getElementById('shopRetryButton')?.addEventListener('click', () => this.loadShopData(true));
                return;
            }

            this.elements.statusBanner.classList.remove('is-error');
            const relativeTime = this.formatRelativeTime(this.state.meta.lastUpdated);
            this.elements.statusBanner.innerHTML = `
                <p>✅ Boutique synchronisée ${relativeTime}. Source: <strong>fortnite-api.com</strong> · Cache ${Math.round((this.state.meta.ttlSeconds || 900) / 60)} min.</p>`;
        }

        updateHero() {
            const featuredItem = this.getFeaturedItem();
            if (!featuredItem) return;

            if (this.elements.featuredMedia) {
                this.elements.featuredMedia.style.backgroundImage = `url('${featuredItem.image}')`;
            }

            if (this.elements.featuredName) {
                this.elements.featuredName.textContent = featuredItem.name;
            }

            if (this.elements.featuredDescription) {
                this.elements.featuredDescription.textContent = featuredItem.description;
            }

            if (this.elements.featuredPrice) {
                this.elements.featuredPrice.textContent = this.formatPrice(featuredItem.price);
            }

            if (this.elements.featuredTag) {
                this.elements.featuredTag.textContent = featuredItem.type.name;
            }

            if (this.elements.featuredBadge) {
                this.elements.featuredBadge.textContent = featuredItem.rarity.name;
            }

            if (this.elements.featuredCta) {
                this.elements.featuredCta.href = '#products';
                this.elements.featuredCta.dataset.itemName = featuredItem.name;
                this.elements.featuredCta.dataset.itemPrice = featuredItem.price;
                this.elements.featuredCta.dataset.itemSection = featuredItem.type.name;
                this.orderBridge?.bind(this.elements.featuredCta, {
                    name: featuredItem.name,
                    price: featuredItem.price,
                    section: featuredItem.type.name
                });
            }
        }

        getFeaturedItem() {
            const filteredSections = this.getFilteredSections();
            if (filteredSections.length) {
                return filteredSections[0].items[0];
            }
            return this.state.sections[0]?.items[0] || null;
        }

        getFilteredSections() {
            const filters = this.state.filters;
            const filtered = this.state.sections
                .map((section) => {
                    const items = this.applyFilters(section.items, filters);
                    return { ...section, items };
                })
                .filter((section) => section.items.length);
            return this.sortSections(filtered, filters.sort);
        }

        sortSections(sections, sortMode) {
            if (sortMode !== 'featured') return sections;
            return sections.sort((a, b) => (a.index ?? 999) - (b.index ?? 999));
        }

        applyFilters(items, filters) {
            const search = filters.search;
            const rarity = filters.rarity;
            const type = filters.type;

            let filtered = items.filter((item) => {
                const description = (item.description || '').toLowerCase();
                const series = (item.meta.series || '').toLowerCase();
                const setName = (item.meta.set || '').toLowerCase();
                const tags = item.tags.join(' ').toLowerCase();

                const matchesSearch = !search
                    || item.name.toLowerCase().includes(search)
                    || description.includes(search)
                    || series.includes(search)
                    || setName.includes(search)
                    || tags.includes(search);

                const matchesRarity = rarity === 'all' || item.rarity.slug === rarity;
                const matchesType = type === 'all' || item.type.slug === type;

                return matchesSearch && matchesRarity && matchesType;
            });

            filtered = this.sortItems(filtered, filters.sort);
            return filtered;
        }

        sortItems(items, sortMode) {
            const clone = [...items];
            switch (sortMode) {
                case 'price-asc':
                    return clone.sort((a, b) => a.price - b.price);
                case 'price-desc':
                    return clone.sort((a, b) => b.price - a.price);
                case 'name':
                    return clone.sort((a, b) => a.name.localeCompare(b.name));
                default:
                    return clone.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            }
        }

        renderSections() {
            if (!this.elements.sections) return;

            if (this.state.loading) {
                this.elements.sections.classList.add('is-loading');
                return;
            }

            const filteredSections = this.getFilteredSections();

            if (!filteredSections.length) {
                this.elements.sections.innerHTML = '';
                if (this.elements.emptyState) this.elements.emptyState.hidden = false;
                return;
            }

            if (this.elements.emptyState) this.elements.emptyState.hidden = true;
            if (this.elements.skeletons) this.elements.skeletons.setAttribute('hidden', 'true');

            const markup = filteredSections
                .map((section) => this.createSectionMarkup(section))
                .join('');

            this.elements.sections.classList.remove('is-loading');
            this.elements.sections.innerHTML = markup;
            this.registerCartFlow();
        }

        createSectionMarkup(section) {
            const cards = section.items.map((item) => this.createItemCard(item, section.title)).join('');
            const subtitle = section.subtitle || 'Section boutique officielle';

            return `
                <article class="shop-section-block" id="${section.id}">
                    <header class="shop-section-header">
                        <div>
                            <p class="section-eyebrow">${this.escapeHtml(subtitle)}</p>
                            <h2>${this.escapeHtml(section.title)}</h2>
                        </div>
                        <span class="section-count">${section.items.length} objets</span>
                    </header>
                    <div class="shop-grid">
                        ${cards}
                    </div>
                </article>
            `;
        }

        createItemCard(item, sectionTitle) {
            const icon = this.state.meta.vbuckIcon || 'assets/icon.png';
            const tags = item.tags.length
                ? `<div class="media-tags">${item.tags.map((tag) => `<span class="item-tag">${this.escapeHtml(tag)}</span>`).join('')}</div>`
                : '';
            const metaLine = item.meta.introduction || sectionTitle;
            const orderHint = `Note "${item.name}" dans ton message de confirmation.`;

            return `
                <article class="shop-card product-card rarity-${item.rarity.slug}">
                    <div class="shop-card-media" style="background-image:url('${item.image}')">
                        <span class="rarity-pill">${this.escapeHtml(item.rarity.name)}</span>
                        ${tags}
                    </div>
                    <div class="shop-card-body">
                        <div class="shop-card-head">
                            <h3>${this.escapeHtml(item.name)}</h3>
                            <span class="item-type">${this.escapeHtml(item.type.name)}</span>
                        </div>
                        <p class="shop-card-description">${this.escapeHtml(item.description)}</p>
                        <p class="shop-card-meta-line">${this.escapeHtml(metaLine || '')}</p>
                        <div class="shop-card-meta">
                            <div class="price-tag">
                                <img src="${icon}" alt="V-Bucks" loading="lazy">
                                <span>${this.formatPrice(item.price)}</span>
                            </div>
                            <div class="availability-flags">
                                ${item.giftable ? '<span class="flag">🎁 Cadeau</span>' : ''}
                                ${item.refundable ? '<span class="flag">↩️ Refund</span>' : ''}
                                ${item.expiresAt ? `<span class="flag">⏳ ${this.formatExpiry(item.expiresAt)}</span>` : ''}
                            </div>
                        </div>
                        <div class="shop-card-actions">
                            <p class="shop-card-hint">${this.escapeHtml(orderHint)}</p>
                            <button type="button"
                                class="product-button cart-flow-cta"
                                data-item-name="${this.escapeHtml(item.name)}"
                                data-item-price="${item.price}"
                                data-item-section="${this.escapeHtml(sectionTitle)}"
                                data-disable-product-animation="true">
                                Préparer ma commande
                            </button>
                            ${item.video ? `<a class="ghost-button" href="${item.video}" target="_blank" rel="noopener">▶️ Aperçu</a>` : ''}
                        </div>
                    </div>
                </article>
            `;
        }

        renderError() {
            if (!this.elements.sections) return;
            this.elements.sections.innerHTML = `
                <div class="shop-error">
                    <h3>Impossible de charger la boutique</h3>
                    <p>${this.escapeHtml(this.state.error || 'Erreur inconnue')}</p>
                    <button type="button" class="product-button" id="shopErrorRetry">Réessayer</button>
                </div>
            `;
            document.getElementById('shopErrorRetry')?.addEventListener('click', () => this.loadShopData(true));
            if (this.elements.emptyState) this.elements.emptyState.hidden = true;
            this.renderStatus();
        }

        updateStats() {
            if (this.elements.lastUpdate) {
                this.elements.lastUpdate.textContent = this.formatAbsoluteDate(this.state.meta.lastUpdated);
            }
            if (this.elements.totalItems) {
                this.elements.totalItems.textContent = this.state.totalItems.toString();
            }
            if (this.elements.ttl) {
                const minutes = Math.round((this.state.meta.ttlSeconds || 900) / 60);
                this.elements.ttl.textContent = `${minutes} min`;
            }
        }

        registerCartFlow() {
            if (!this.orderBridge) return;
            const ctas = this.root.querySelectorAll('.cart-flow-cta');
            ctas.forEach((cta) => {
                const item = {
                    name: cta.dataset.itemName || 'Commande Fortnite',
                    price: Number(cta.dataset.itemPrice) || 0,
                    section: cta.dataset.itemSection || 'Boutique Live'
                };
                this.orderBridge.bind(cta, item);
            });
        }

        formatExpiry(dateString) {
            const timestamp = Date.parse(dateString);
            if (Number.isNaN(timestamp)) return 'Quitte bientôt';
            const diffMs = timestamp - Date.now();
            if (diffMs <= 0) return 'Expire maintenant';
            const hours = Math.floor(diffMs / 3_600_000);
            const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
            if (hours > 0) {
                return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
            }
            return `${minutes} min`;
        }

        isDataOutdated() {
            if (!this.state.meta.lastUpdated) return true;
            const updatedAt = Date.parse(this.state.meta.lastUpdated);
            if (Number.isNaN(updatedAt)) return true;
            const ttlMs = (this.state.meta.ttlSeconds || 900) * 1000;
            return Date.now() - updatedAt > ttlMs;
        }

        formatPrice(value) {
            if (!Number.isFinite(value)) return '—';
            return `${Math.round(value).toLocaleString('fr-FR')} V-Bucks`;
        }

        formatRelativeTime(dateString) {
            if (!dateString) return 'il y a un moment';
            const timestamp = Date.parse(dateString);
            if (Number.isNaN(timestamp)) return 'il y a un moment';
            const diffMs = Date.now() - timestamp;
            const minutes = Math.floor(diffMs / 60_000);
            if (minutes < 1) return 'à l’instant';
            if (minutes < 60) return `il y a ${minutes} min`;
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `il y a ${hours} h`;
            const days = Math.floor(hours / 24);
            return `il y a ${days} j`;
        }

        formatAbsoluteDate(dateString) {
            if (!dateString) return '--';
            const date = new Date(dateString);
            if (Number.isNaN(date.getTime())) return '--';
            return new Intl.DateTimeFormat('fr-FR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        }

        escapeHtml(value) {
            const div = document.createElement('div');
            div.textContent = value ?? '';
            return div.innerHTML;
        }

        slugify(value, fallback = 'standard') {
            const base = (value || fallback).toString().trim().toLowerCase();
            const slug = base.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            return slug || fallback;
        }
    }

    new FortniteShopPage(root);
})();
