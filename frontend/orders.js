(function() {
    'use strict';

    class OrdersManager {
        constructor() {
            this.orders = [];
            this.currentReviewOrderId = null;
            this.init();
        }

        init() {
            this.loadOrders();
            this.renderOrders();
            this.bindEvents();
        }

        loadOrders() {
            const stored = localStorage.getItem('fortniteshop_orders');
            this.orders = stored ? JSON.parse(stored) : [];
            // Trier par date (plus récent en premier)
            this.orders.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        saveOrders() {
            localStorage.setItem('fortniteshop_orders', JSON.stringify(this.orders));
        }

        renderOrders() {
            const container = document.getElementById('ordersList');
            const emptyState = document.getElementById('emptyOrders');

            if (!container) return;

            if (this.orders.length === 0) {
                container.style.display = 'none';
                if (emptyState) emptyState.style.display = 'block';
                return;
            }

            container.style.display = 'block';
            if (emptyState) emptyState.style.display = 'none';

            container.innerHTML = this.orders.map(order => this.createOrderCard(order)).join('');
        }

        createOrderCard(order) {
            const date = new Date(order.date);
            const formattedDate = date.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const statusBadge = this.getStatusBadge(order.status);
            const canMarkReceived = order.status === 'pending';
            const canReview = order.status === 'received' && !order.review;
            const hasReview = order.review !== null;

            return `
                <article class="order-card" style="background: var(--card-bg); border-radius: 12px; padding: 2rem; margin-bottom: 1.5rem; border: 2px solid rgba(123, 104, 238, 0.3);">
                    <div class="order-header" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                        <div>
                            <h3 style="margin: 0 0 0.5rem 0; color: var(--electric-blue);">Commande #${order.id}</h3>
                            <p style="margin: 0; color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">${formattedDate}</p>
                        </div>
                        ${statusBadge}
                    </div>

                    <div class="order-items" style="margin-bottom: 1.5rem;">
                        <h4 style="margin: 0 0 1rem 0; color: rgba(255, 255, 255, 0.9);">Articles :</h4>
                        <ul style="list-style: none; padding: 0; margin: 0;">
                            ${order.items.map(item => `
                                <li style="padding: 0.5rem 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1); display: flex; justify-content: space-between;">
                                    <span>${this.escapeHtml(item.name)} x${item.quantity}</span>
                                    <span style="color: var(--electric-blue); font-weight: 600;">${(item.price * item.quantity).toLocaleString('fr-FR')} FCFA</span>
                                </li>
                            `).join('')}
                        </ul>
                        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid rgba(123, 104, 238, 0.3); display: flex; justify-content: space-between; font-size: 1.1rem; font-weight: 700;">
                            <span>Total :</span>
                            <span style="color: var(--neon-pink);">${order.total.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                    </div>

                    <div class="order-actions" style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        ${canMarkReceived ? `
                            <button class="cta-button" onclick="ordersManager.markAsReceived('${order.id}')" style="flex: 1; min-width: 150px;">
                                <span>✅ J'ai reçu ma commande</span>
                            </button>
                            <button class="ghost-button" onclick="ordersManager.markAsNotReceived('${order.id}')" style="flex: 1; min-width: 150px;">
                                <span>❌ Je n'ai pas reçu</span>
                            </button>
                        ` : ''}
                        ${canReview ? `
                            <button class="cta-button" onclick="ordersManager.openReviewModal('${order.id}')" style="flex: 1; min-width: 150px;">
                                <span>⭐ Donner mon avis</span>
                            </button>
                        ` : ''}
                        ${hasReview ? `
                            <div style="flex: 1; padding: 1rem; background: rgba(123, 104, 238, 0.1); border-radius: 8px; border-left: 3px solid var(--electric-blue);">
                                <div style="margin-bottom: 0.5rem;">
                                    ${'⭐'.repeat(order.review.rating)}${'☆'.repeat(5 - order.review.rating)}
                                </div>
                                ${order.review.comment ? `<p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 0.9rem;">${this.escapeHtml(order.review.comment)}</p>` : ''}
                            </div>
                        ` : ''}
                    </div>
                </article>
            `;
        }

        getStatusBadge(status) {
            const badges = {
                'pending': '<span style="padding: 0.5rem 1rem; background: rgba(255, 193, 7, 0.2); color: #FFC107; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">⏳ En attente</span>',
                'received': '<span style="padding: 0.5rem 1rem; background: rgba(76, 175, 80, 0.2); color: #4CAF50; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">✅ Reçue</span>',
                'not_received': '<span style="padding: 0.5rem 1rem; background: rgba(244, 67, 54, 0.2); color: #F44336; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">❌ Non reçue</span>'
            };
            return badges[status] || badges.pending;
        }

        markAsReceived(orderId) {
            const order = this.orders.find(o => o.id === orderId);
            if (!order) return;

            if (confirm('Confirmer que tu as bien reçu ta commande ?')) {
                order.status = 'received';
                this.saveOrders();
                this.renderOrders();
            }
        }

        markAsNotReceived(orderId) {
            const order = this.orders.find(o => o.id === orderId);
            if (!order) return;

            if (confirm('Tu n\'as pas reçu ta commande ? Notre équipe va te contacter pour résoudre le problème.')) {
                order.status = 'not_received';
                this.saveOrders();
                this.renderOrders();
            }
        }

        openReviewModal(orderId) {
            const order = this.orders.find(o => o.id === orderId);
            if (!order) return;

            this.currentReviewOrderId = orderId;
            const modal = document.getElementById('reviewModal');
            const orderNameEl = document.getElementById('reviewOrderName');
            const ratingInput = document.getElementById('reviewRating');
            const commentInput = document.getElementById('reviewComment');

            if (orderNameEl) orderNameEl.textContent = `Commande #${order.id}`;
            if (ratingInput) ratingInput.value = '0';
            if (commentInput) commentInput.value = '';

            // Reset stars
            document.querySelectorAll('.star-btn').forEach(btn => {
                btn.style.opacity = '0.3';
            });

            if (modal) {
                modal.style.display = 'flex';
                modal.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
            }
        }

        closeReviewModal() {
            const modal = document.getElementById('reviewModal');
            if (modal) {
                modal.style.display = 'none';
                modal.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            }
            this.currentReviewOrderId = null;
        }

        submitReview() {
            if (!this.currentReviewOrderId) return;

            const rating = parseInt(document.getElementById('reviewRating').value);
            const comment = document.getElementById('reviewComment').value.trim();

            if (rating === 0) {
                alert('Veuillez sélectionner une note (1 à 5 étoiles)');
                return;
            }

            const order = this.orders.find(o => o.id === this.currentReviewOrderId);
            if (!order) return;

            order.review = {
                rating: rating,
                comment: comment || null,
                date: new Date().toISOString()
            };

            // Sauvegarder l'avis dans la liste globale des avis
            const reviews = JSON.parse(localStorage.getItem('fortniteshop_reviews') || '[]');
            reviews.push({
                orderId: order.id,
                rating: rating,
                comment: comment || null,
                date: order.review.date,
                customerName: order.customer.fullName || 'Client'
            });
            localStorage.setItem('fortniteshop_reviews', JSON.stringify(reviews));

            this.saveOrders();
            this.closeReviewModal();
            this.renderOrders();
            
            alert('Merci pour ton avis ! Il sera affiché sur notre page d\'accueil.');
        }

        bindEvents() {
            // Close modal buttons
            document.getElementById('reviewModalClose')?.addEventListener('click', () => this.closeReviewModal());
            document.getElementById('reviewCancelBtn')?.addEventListener('click', () => this.closeReviewModal());

            // Submit review
            document.getElementById('reviewSubmitBtn')?.addEventListener('click', () => this.submitReview());

            // Star rating buttons
            document.querySelectorAll('.star-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const rating = parseInt(e.target.dataset.rating);
                    document.getElementById('reviewRating').value = rating;
                    
                    // Update star display
                    document.querySelectorAll('.star-btn').forEach((star, index) => {
                        star.style.opacity = index < rating ? '1' : '0.3';
                    });
                });
            });

            // Close on backdrop click
            const modal = document.getElementById('reviewModal');
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.closeReviewModal();
                    }
                });
            }

            // Close on Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.currentReviewOrderId) {
                    this.closeReviewModal();
                }
            });
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    }

    // Initialize
    window.ordersManager = new OrdersManager();
})();

