// ===========================
// CHECKOUT PROCESS MANAGER
// ===========================

class CheckoutManager {
    constructor() {
        this.currentStep = 1;
        this.orderData = {};
        this.init();
    }

    init() {
        this.attachModalEvents();
        this.attachFormValidation();
    }

    attachModalEvents() {
        // Close modal
        const closeBtn = document.querySelector('.close-modal');
        const modal = document.getElementById('checkoutModal');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal) {
                this.closeModal();
            }
        });
    }

    attachFormValidation() {
        const accountForm = document.getElementById('accountForm');
        if (accountForm) {
            accountForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.validateStep1();
            });
        }

        // Payment method selection avec style visuel
        document.querySelectorAll('.payment-option input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                // Retirer la classe 'active' de toutes les options
                document.querySelectorAll('.payment-option').forEach(opt => {
                    opt.classList.remove('active');
                });
                // Ajouter la classe 'active' à l'option sélectionnée
                e.target.closest('.payment-option').classList.add('active');
            });
        });
    }

    validateStep1() {
        const fortniteName = document.getElementById('fortniteName').value.trim();
        const epicEmail = document.getElementById('epicEmail').value.trim();
        const platform = document.getElementById('platform').value;

        if (!fortniteName || !epicEmail || !platform) {
            this.showError('Veuillez remplir tous les champs requis');
            return false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(epicEmail)) {
            this.showError('Email invalide');
            return false;
        }

        // Store data
        this.orderData.fortniteName = fortniteName;
        this.orderData.epicEmail = epicEmail;
        this.orderData.platform = platform;

        nextStep(2);
        return true;
    }

    validateStep2() {
        const selectedPayment = document.querySelector('input[name="payment"]:checked');
        
        if (!selectedPayment) {
            this.showError('Veuillez sélectionner un mode de paiement');
            return false;
        }

        this.orderData.paymentMethod = selectedPayment.value;
        return true;
    }

    showError(message) {
        const error = document.createElement('div');
        error.className = 'error-notification';
        error.textContent = message;
        document.body.appendChild(error);

        setTimeout(() => {
            error.classList.add('show');
        }, 10);

        setTimeout(() => {
            error.classList.remove('show');
            setTimeout(() => error.remove(), 300);
        }, 3000);
    }

    closeModal() {
        const modal = document.getElementById('checkoutModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    generateOrderNumber() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `FN${timestamp}${random}`;
    }
}

// Step navigation
function nextStep(step) {
    console.log('nextStep appelé avec step:', step);
    
    if (step === 2) {
        // Validate step 1
        const fortniteName = document.getElementById('fortniteName').value.trim();
        const epicEmail = document.getElementById('epicEmail').value.trim();
        const platform = document.getElementById('platform').value;

        if (!fortniteName || !epicEmail || !platform) {
            checkout.showError('Veuillez remplir tous les champs requis');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(epicEmail)) {
            checkout.showError('Email invalide');
            return;
        }
    }

    // Hide all steps
    console.log('Masquage de toutes les étapes');
    document.querySelectorAll('.checkout-step').forEach(s => {
        s.classList.remove('active');
        console.log('Step masquée:', s.id);
    });

    // Show selected step
    const targetStep = document.getElementById(`step${step}`);
    console.log('Affichage étape:', `step${step}`, targetStep);
    
    if (targetStep) {
        targetStep.classList.add('active');
        console.log('✅ Étape', step, 'affichée');
    } else {
        console.error('❌ Étape introuvable:', `step${step}`);
    }
}

// Process payment
function processPayment() {
    console.log('========================================');
    console.log('🚀 processPayment appelé');
    console.log('========================================');
    
    const selectedPayment = document.querySelector('input[name="payment"]:checked');
    console.log('Paiement sélectionné:', selectedPayment);
    
    // VALIDATION: Vérifier qu'un moyen de paiement est sélectionné
    if (!selectedPayment) {
        console.log('❌ Aucun paiement sélectionné!');
        checkout.showError('Veuillez sélectionner un mode de paiement');
        return false;
    }

    const paymentMethod = selectedPayment.value;
    console.log('💳 Méthode de paiement:', paymentMethod);
    
    // Si Crypto, afficher message coming soon
    if (paymentMethod === 'crypto') {
        console.log('₿ Crypto sélectionné - Coming Soon');
        checkout.showError('Paiement Crypto - Coming Soon 🚀');
        return false;
    }
    
    // Si Mobile Money, afficher traitement puis rediriger vers Lygos
    if (paymentMethod === 'mobile') {
        console.log('📱 Mobile Money sélectionné');
        console.log('⏳ Affichage de l\'étape de traitement...');
        
        // Afficher l'étape de traitement (Step 3)
        nextStep(3);
        
        console.log('⏰ Timer de 2 secondes avant redirection...');
        // Attendre 2 secondes pour que l'utilisateur voie le message "Traitement en cours"
        setTimeout(() => {
            console.log('✅ Redirection vers Lygos maintenant...');
            redirectToLygosPayment();
        }, 2000);
        
        return true;
    }

    // Ne devrait jamais arriver ici avec la config actuelle
    console.log('⚠️ Méthode de paiement inconnue:', paymentMethod);
    checkout.showError('Méthode de paiement non supportée');
    return false;
}

// Redirect to Lygos payment link based on cart items
async function redirectToLygosPayment() {
    console.log('=== DEBUT redirectToLygosPayment ===');
    console.log('cart object:', cart);
    console.log('cart.items:', cart.items);
    
    const cartItems = cart.items;
    
    if (!cartItems || cartItems.length === 0) {
        console.log('ERREUR: Panier vide');
        checkout.showError('Votre panier est vide');
        return false;
    }
    
    console.log('Nombre d\'articles:', cartItems.length);
    
    // Récupérer les infos du formulaire
    const fortniteName = document.getElementById('fortniteName').value;
    const epicEmail = document.getElementById('epicEmail').value;
    const platform = document.getElementById('platform').value;
    
    // Calculer le montant total
    const totalAmount = cart.getTotal();
    
    console.log('Montant total:', totalAmount);
    
    // Préparer les données pour l'API
    const paymentData = {
        amount: totalAmount,
        items: cartItems,
        customer: {
            fortniteName: fortniteName,
            epicEmail: epicEmail,
            platform: platform
        }
    };
    
    console.log('Données envoyées à l\'API:', paymentData);
    
    // URL de l'API - Production sur Render
    const API_URL = 'https://fortniteitems.onrender.com';
    
    try {
        // Appeler l'API backend pour créer le paiement
        const response = await fetch(`${API_URL}/api/create-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });
        
        const result = await response.json();
        console.log('Réponse de l\'API:', result);
        
        if (result.success && result.payment_link) {
            console.log('✅ Lien de paiement généré:', result.payment_link);
            
            // Sauvegarder les infos de commande avec l'order_id
            localStorage.setItem('fortniteshop_pending_order', JSON.stringify({
                order_id: result.order_id,
                fortniteName: fortniteName,
                epicEmail: epicEmail,
                platform: platform,
                items: cartItems,
                amount: totalAmount,
                timestamp: new Date().toISOString()
            }));
            
            // Rediriger vers la page de paiement Lygos
            console.log('🚀 Redirection vers Lygos...');
            window.location.href = result.payment_link;
            
            return true;
        } else {
            console.log('❌ Erreur lors de la création du paiement:', result.error);
            checkout.showError(result.error || 'Erreur lors de la création du paiement');
            
            // Retourner à l'étape 2
            nextStep(2);
            return false;
        }
    } catch (error) {
        console.error('❌ Erreur réseau:', error);
        checkout.showError('Erreur de connexion. Vérifiez que le serveur backend est démarré.');
        
        // Retourner à l'étape 2
        nextStep(2);
        return false;
    }
}

// Complete order
function completeOrder() {
    const orderNumber = checkout.generateOrderNumber();
    const epicEmail = document.getElementById('epicEmail').value;

    document.getElementById('orderNumber').textContent = orderNumber;
    document.getElementById('confirmEmail').textContent = epicEmail;

    // Show success step
    nextStep(4);

    // Clear cart
    cart.clearCart();

    // Store order in localStorage (for order history)
    const orders = JSON.parse(localStorage.getItem('fortniteshop_orders') || '[]');
    orders.push({
        orderNumber: orderNumber,
        date: new Date().toISOString(),
        items: cart.items,
        total: cart.getTotal(),
        email: epicEmail
    });
    localStorage.setItem('fortniteshop_orders', JSON.stringify(orders));
}

// Initialize checkout
const checkout = new CheckoutManager();

// Payment Integration Functions (Placeholder for real payment APIs)

function initStripe() {
    // Stripe integration would go here
    console.log('Stripe payment initialized');
}

function initFlutterwave() {
    // Flutterwave for African payments
    console.log('Flutterwave payment initialized');
}

function initPaystack() {
    // Paystack for African mobile money
    console.log('Paystack payment initialized');
}

// Example payment implementation (uncomment when ready to integrate)
/*
function processStripePayment(amount) {
    // Stripe.js code here
    stripe.redirectToCheckout({
        lineItems: [{price: 'price_xxxxx', quantity: 1}],
        mode: 'payment',
        successUrl: window.location.origin + '/success.html',
        cancelUrl: window.location.origin + '/cart.html',
    });
}

function processFlutterwavePayment(amount, email) {
    FlutterwaveCheckout({
        public_key: "YOUR_PUBLIC_KEY",
        tx_ref: checkout.generateOrderNumber(),
        amount: amount,
        currency: "USD",
        payment_options: "card, mobilemoneyghana, ussd",
        customer: {
            email: email,
        },
        customizations: {
            title: "Fortnite Shop",
            description: "V-Bucks Purchase",
            logo: "https://yoursite.com/logo.png",
        },
        callback: function (data) {
            if (data.status === "successful") {
                completeOrder();
            }
        },
        onclose: function() {
            console.log("Payment cancelled");
        }
    });
}
*/

