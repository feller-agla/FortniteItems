(function() {
    'use strict';

    class OrdersManager {
        constructor() {
            this.orders = [];
            this.init();
        }

        async init() {
            await this.loadOrdersFromApi();
            this.renderOrders();
        }

        async loadOrdersFromApi() {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                // Not logged in handled by orders.html script
                return; 
            }

            try {
                // Utiliser le port 5000 du backend Flask
                const response = await fetch('http://localhost:5000/api/user/orders', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                console.log('Orders API Status:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    console.log('Orders API Data:', data);
                    
                    // Backend returns { success: true, orders: [...] }
                    if (data.orders && Array.isArray(data.orders)) {
                        this.orders = data.orders;
                    } else if (Array.isArray(data)) {
                        // Fallback if backend changes to return direct list
                        this.orders = data;
                    } else {
                        console.error('Expected array of orders, got:', data);
                        this.orders = [];
                    }
                } else {
                    console.error('Failed to fetch orders:', response.statusText);
                    if (response.status === 401) {
                        // Token invalid/expired
                        localStorage.removeItem('auth_token');
                        window.location.href = 'login.html';
                    }
                    this.orders = []; 
                }
            } catch (error) {
                console.error('Error fetching orders:', error);
                this.orders = [];
            }
        }

        // Calculate progress percentage based on status
        getProgressWidth(status) {
            switch(status) {
                case 'paid': return '50%';
                case 'processing': return '50%';
                case 'delivered': return '100%';
                case 'received': return '100%';
                default: return '0%'; // pending
            }
        }

        renderOrders() {
            const container = document.getElementById('ordersList');
            const emptyState = document.getElementById('emptyOrders');

            if (!container) return;

            if (!this.orders || this.orders.length === 0) {
                container.style.display = 'none';
                if (emptyState) emptyState.style.display = 'block';
                return;
            }

            container.style.display = 'block';
            if (emptyState) emptyState.style.display = 'none';

            container.innerHTML = this.orders.map(order => this.createOrderCard(order)).join('');
        }

        createOrderCard(order) {
            const date = new Date(order.created_at);
            const formattedDate = date.toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
            });

            // Map status to readable text and progress
            let statusText = "Validation en cours";
            let statusColor = "white";
            
            // Declare step classes
            let step1Class = 'completed';
            let step2Class = '';
            let step3Class = '';

            // User Logic: "If it's here, I paid."
            // So Step 1 (Validée) is active or done.
            // Step 2 (Livraison) is what they wait for.
            
            if (order.status === 'pending') {
                step1Class = 'active'; 
                statusText = "Validation paiement...";
                statusColor = "#FFC107"; // Orange
            } else if (order.status === 'paid' || order.status === 'processing') {
                step1Class = 'completed';
                step2Class = 'active';
                statusText = "Paiement validé par le support • Livraison en cours";
                statusColor = "var(--electric-blue)"; // Blue
            } else if (order.status === 'delivered' || order.status === 'received') {
                step1Class = 'completed';
                step2Class = 'completed';
                step3Class = 'completed';
                statusText = "Commande livrée ✅";
                statusColor = "#00ff88"; // Green
            }

            const progressWidth = this.getProgressWidth(order.status);
            
            // Item summary with icons
            let itemsHtml = '<div style="opacity:0.6; padding:1rem;">Détails indisponibles</div>';
            if (order.items && Array.isArray(order.items)) {
                itemsHtml = order.items.map(item => `
                    <div class="item-row">
                        <div class="item-icon">⚡</div>
                        <div style="flex:1;">
                            <div style="font-weight:600;">${item.name}</div>
                            <div style="font-size:0.8rem; opacity:0.6;">Quantité: ${item.quantity}</div>
                        </div>
                        <div style="font-family:'Orbitron'; color:var(--electric-blue);">${(item.price * item.quantity).toLocaleString()} FCFA</div>
                    </div>
                `).join('');
            }

            return `
                <div class="order-card" id="card-${order.order_id}">
                    <!-- Header (Always Visible + Clickable) -->
                    <div class="order-header-live" onclick="toggleOrder('${order.order_id}')" style="cursor: pointer;">
                        <div style="flex:1">
                            <h3 class="order-id-title">
                                <span style="margin-right:10px;">${statusText.includes('livrée') ? '✅' : '📦'}</span>
                                COMMANDE #${order.order_id.substring(0, 8)}
                            </h3>
                            <div class="order-date-sub">📅 ${formattedDate} • <span style="color:${statusColor}">${statusText}</span></div>
                        </div>
                        <div style="text-align:right;">
                            <div class="order-amount-display">${order.amount.toLocaleString()} FCFA</div>
                            <div class="chevron-icon" style="font-size:1.5rem; transition:transform 0.3s;">▼</div>
                        </div>
                    </div>

                    <!-- Collapsible Content -->
                    <div id="details-${order.order_id}" class="order-expand-content" style="display:none;">
                        
                        <!-- Status Blocks -->
                        <div class="order-status-track">
                            <!-- Step 1 -->
                            <div class="status-step ${step1Class}">
                                <div class="step-icon">📝</div>
                                <div class="step-info">
                                    <div class="step-label">Validée</div>
                                    <div class="step-desc">Commande reçue</div>
                                </div>
                            </div>

                            <!-- Step 2 -->
                            <div class="status-step ${step2Class}">
                                <div class="step-icon">🎮</div>
                                <div class="step-info">
                                    <div class="step-label">Livraison</div>
                                    <div class="step-desc">Envoi en cours</div>
                                </div>
                            </div>

                            <!-- Step 3 -->
                            <div class="status-step ${step3Class}">
                                <div class="step-icon">✅</div>
                                <div class="step-info">
                                    <div class="step-label">Terminée</div>
                                    <div class="step-desc">Livré succès</div>
                                </div>
                            </div>
                        </div>

                        <div class="order-details-live">
                            <h4 style="margin:0 0 10px 0; font-size:0.9rem; text-transform:uppercase; letter-spacing:1px; opacity:0.5;">Articles</h4>
                            ${itemsHtml}
                        </div>

                        <div class="live-actions">
                            <div class="status-text-live" style="color: ${statusColor}">
                                📍 ${statusText}
                            </div>
                            <button class="cta-glass open-chat-btn" onclick="openOrderChat('${order.order_id}')" style="padding: 10px 20px; font-size: 0.9rem;">
                                💬 Besoin d'aide ?
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // Global toggle function
    window.toggleOrder = function(orderId) {
        const content = document.getElementById(`details-${orderId}`);
        const card = document.getElementById(`card-${orderId}`);
        const chevron = card.querySelector('.chevron-icon');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            card.classList.add('expanded');
            chevron.style.transform = 'rotate(180deg)';
        } else {
            content.style.display = 'none';
            card.classList.remove('expanded');
            chevron.style.transform = 'rotate(0deg)';
        }
    };

    // Global function for onclick
    window.openOrderChat = function(orderId) {
        // Stop propagation to prevent closing the accordion when clicking chat is unlikely but good practice if nested, 
        // though onclick button handles it usually.
        event.stopPropagation();
        window.location.href = `messages.html?chat_order=${orderId}`; 
    };

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        window.ordersManager = new OrdersManager();
    });

})();

