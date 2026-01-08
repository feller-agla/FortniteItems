/**
 * FortniteItems Chat System
 * Gère la messagerie en temps réel (polling) sur la page de succès
 */

class OrderChat {
    constructor(orderId, apiUrl, containerId = null, currentUserType = 'user') {
        this.orderId = orderId;
        this.apiUrl = apiUrl;
        this.messages = [];
        this.pollInterval = null;
        this.chatContainer = null;
        this.messagesArea = null;
        this.inputArea = null;
        this.isOpen = false;
        this.containerId = containerId; // Support for embedded mode
        this.currentUserType = currentUserType || 'user'; // 'user' or 'admin'
        
        this.init();
    }
    
    init() {
        if (this.containerId) {
            // Embedded Mode
            this.renderEmbedded();
        } else {
            // Floating Widget Mode
            this.createWidget();
        }
        
        // this.fetchHistory(); // Method does not exist, startPolling handles it
        this.startPolling();
        console.log(`💬 Chat initialisé pour la commande ${this.orderId}`);
    }

    renderEmbedded() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container with ID '${this.containerId}' not found for embedded chat.`);
            return;
        }

        // Clear placeholder
        container.innerHTML = '';

        // Create chat interface without the toggle button and header (header is static in HTML)
        const chatWindow = document.createElement('div');
        chatWindow.className = 'chat-window embedded';
        chatWindow.innerHTML = `
            <div class="chat-messages" id="chatMessages">
                <div class="chat-date">Aujourd'hui</div>
                <div class="message system">
                    👋 Bonjour ! Un agent va prendre en charge votre commande <strong>#${this.orderId}</strong>.
                </div>
            </div>
            <div class="chat-input-area">
                <input type="text" id="chatInput" placeholder="Écrivez votre message...">
                <button id="sendChatBtn">➤</button>
            </div>
        `;

        container.appendChild(chatWindow);

        this.chatContainer = chatWindow;
        this.messagesArea = chatWindow.querySelector('#chatMessages');
        this.inputArea = chatWindow.querySelector('#chatInput');

        // Bind events
        this.bindEvents();
        this.isOpen = true; // Always open in embedded mode
    }

    bindEvents() {
        if (!this.chatContainer) return;

        const sendBtn = this.chatContainer.querySelector('#sendChatBtn');
        const input = this.chatContainer.querySelector('#chatInput');
        const closeBtn = this.chatContainer.querySelector('.close-chat');

        if (sendBtn) {
            sendBtn.onclick = () => this.sendMessage();
        }

        if (input) {
            input.onkeypress = (e) => {
                if (e.key === 'Enter') this.sendMessage();
            };
        }

        if (closeBtn) {
            closeBtn.onclick = () => this.toggleChat();
        }
    }
    
    createWidget() {
        // Créer le bouton flottant
        const chatButton = document.createElement('button');
        chatButton.className = 'chat-toggle-btn';
        chatButton.innerHTML = '<span>💬</span><span class="notification-badge" style="display:none">0</span>';
        chatButton.onclick = () => this.toggleChat();
        document.body.appendChild(chatButton);
        
        // Créer la fenêtre de chat
        const chatWindow = document.createElement('div');
        chatWindow.className = 'chat-window hidden';
        chatWindow.innerHTML = `
            <div class="chat-header">
                <div class="chat-title">
                    <span class="status-dot"></span>
                    <h3>Support FortniteItems</h3>
                </div>
                <button class="close-chat">×</button>
            </div>
            <div class="chat-messages" id="chatMessages">
                <div class="chat-welcome">
                    <p>👋 Besoin d'aide pour votre commande ? Posez vos questions ici !</p>
                </div>
            </div>
            <div class="chat-input-area">
                <input type="text" id="chatInput" placeholder="Écrivez votre message..." autocomplete="off">
                <button id="sendChatBtn">➤</button>
            </div>
        `;
        document.body.appendChild(chatWindow);
        
        this.chatContainer = chatWindow;
        this.messagesArea = chatWindow.querySelector('#chatMessages');
        this.inputArea = chatWindow.querySelector('#chatInput');
        
        // Event Listeners
        chatWindow.querySelector('.close-chat').onclick = () => this.toggleChat();
        chatWindow.querySelector('#sendChatBtn').onclick = () => this.sendMessage();
        this.inputArea.onkeypress = (e) => {
            if (e.key === 'Enter') this.sendMessage();
        };
        
        // Auto-open chat after a delay if it's a new order
        setTimeout(() => {
            if (!this.isOpen && this.messages.length <= 1) { // Only if few messages (welcome msg mostly)
               // this.toggleChat(); // Optionnel : ne pas forcer l'ouverture pour ne pas être intrusif
            }
        }, 2000);
    }
    
    toggleChat() {
        this.isOpen = !this.isOpen;
        this.chatContainer.classList.toggle('hidden');
        const btn = document.querySelector('.chat-toggle-btn');
        
        if (this.isOpen) {
            btn.classList.add('hidden');
            this.scrollToBottom();
            // Reset badge
            btn.querySelector('.notification-badge').style.display = 'none';
            btn.querySelector('.notification-badge').textContent = '0';
        } else {
            btn.classList.remove('hidden');
        }
    }
    
    async startPolling() {
        await this.fetchMessages(); // Premier fetch immédiat
        await this.fetchMessages(); // Premier fetch immédiat
        this.pollInterval = setInterval(() => this.fetchMessages(), 1000); // Poll toutes les 1s (Réactivité max)
    }

    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }
    
    async fetchMessages() {
        try {
            const response = await fetch(`${this.apiUrl}/api/chat/history/${this.orderId}`);
            if (response.status === 404) {
                console.warn(`Commande ${this.orderId} introuvable. Arrêt du polling.`);
                this.stopPolling();
                
                // Show system message
                if (this.messages.length === 0 && this.messagesArea) {
                     const msgDiv = document.createElement('div');
                     msgDiv.className = 'message system';
                     msgDiv.innerHTML = '<div class="message-content" style="opacity:0.7;">🚫 Cette commande est introuvable sur le serveur.<br>Suppression automatique...</div>';
                     this.messagesArea.appendChild(msgDiv);
                }
                
                // AUTO-CLEANUP: Remove ghost order from LocalStorage
                try {
                    const raw = localStorage.getItem('fortniteshop_orders');
                    if(raw) {
                        const orders = JSON.parse(raw);
                        const newOrders = orders.filter(o => (o.order_id || o.orderNumber) !== this.orderId);
                        
                        if(newOrders.length < orders.length) {
                             console.log(`🧹 Commande fantôme ${this.orderId} supprimée du cache.`);
                             localStorage.setItem('fortniteshop_orders', JSON.stringify(newOrders));
                             
                             // Refresh to update the list (delayed so user sees the message)
                             setTimeout(() => {
                                 if(window.location.pathname.includes('messages.html')) {
                                     window.location.reload();
                                 }
                             }, 2000);
                        }
                    }
                } catch(e) { console.warn("Cleanup error", e); }
                
                return;
            }

            if (response.ok) {
                const newMessages = await response.json();
                
                if (newMessages.length > 0) {
                    const oldLength = this.messages.length;
                    
                    // On met à jour la liste locale
                    this.messages = newMessages;
                    
                    // On appelle render sans index, pour qu'il vérifie tout (ID check)
                    this.renderMessages();
                    
                    // Notification sonore ou visuelle si chat fermé
                    if (!this.isOpen && oldLength > 0) {
                        this.notifyNewMessage(newMessages.length - oldLength);
                    }
                }
            }
        } catch (error) {
            console.error('Erreur polling chat:', error);
        }
    }
    
    renderMessages(startIndex = 0) {
        // Enlèvement des messages temporaires UNIQUEMENT si on a reçu le nôtre (check content match ou juste refresh global)
        // Pour faire simple : on nettoie les temp et on laisse le serveur combler
        // Amélioration : on pourrait vérifier si le dernier message du serveur correspond au temp
        
        const tempMsgs = this.messagesArea.querySelectorAll('.temp-message');
        tempMsgs.forEach(el => el.remove());

        // ID-Based Deduplication (Robust)
        this.messages.forEach(msg => {
             // Check if already rendered
             if (this.messagesArea.querySelector(`.message[data-id="${msg.id}"]`)) {
                 return; // Skip duplicate
             }

            const msgDiv = document.createElement('div');
            // Check if message is from ME (sent) or OTHER (received)
            const isMe = msg.sender === this.currentUserType;
            msgDiv.className = `message ${isMe ? 'sent' : 'received'}`;
            msgDiv.setAttribute('data-id', msg.id); // Tag with ID
            
            // Formater l'heure
            const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            msgDiv.innerHTML = `
                <div class="message-content">${this.escapeHtml(msg.content)}</div>
                <div class="message-time">${time}</div>
            `;
            
            this.messagesArea.appendChild(msgDiv);
        });
        
        this.scrollToBottom();
    }
    
    scrollToBottom() {
        this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
    }
    
    async sendMessage() {
        const content = this.inputArea.value.trim();
        if (!content) return;
        
        // Optimistic UI update
        const tempMsg = {
            sender: this.currentUserType,
            content: content,
            timestamp: new Date().toISOString()
        };
        
        this.renderOptimistic(tempMsg);
        this.inputArea.value = '';
        
        try {
            const response = await fetch(`${this.apiUrl}/api/chat/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: this.orderId,
                    content: content,
                    sender: this.currentUserType
                })
            });
            
            if (response.ok) {
                // Fetch will act as confirmation
                this.fetchMessages();
            } else {
                console.error('Erreur envoi message');
                // TODO: Afficher erreur visuelle
            }
        } catch (error) {
            console.error('Erreur réseau chat:', error);
        }
    }
    
    renderOptimistic(msg) {
        // Affiche le message immédiatement sans attendre le serveur
        const msgDiv = document.createElement('div');
        msgDiv.className = `message sent temp-message`; // Add temp class for styling if needed (e.g. opacity)
        msgDiv.style.opacity = '0.7';
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        msgDiv.innerHTML = `
            <div class="message-content">${this.escapeHtml(msg.content)}</div>
            <div class="message-time">${time} • Envoi...</div>
        `;
        
        this.messagesArea.appendChild(msgDiv);
        this.scrollToBottom();
    }
    
    notifyNewMessage(count) {
        const badge = document.querySelector('.chat-toggle-btn .notification-badge');
        badge.textContent = count;
        badge.style.display = 'block';
        badge.classList.add('pulse');
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
