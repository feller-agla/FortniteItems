// ===========================
// CHECKOUT PROCESS MANAGER
// ===========================

// Configuration API Backend - Détection automatique de l'environnement
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'  // Environnement LOCAL (développement)
    : 'https://fortniteitems.onrender.com';  // Environnement PRODUCTION (en ligne)

const PAYMENT_PROVIDER = 'lygos';  // Lygos payment provider

console.log(`🌐 Environnement détecté: ${window.location.hostname === 'localhost' ? 'LOCAL' : 'PRODUCTION'}`);
console.log(`🔗 API Backend: ${API_URL}`);

let isProcessingPayment = false;
let processingStatusTimer;
let processingHintTimer;

class CheckoutManager {
    constructor() {
        this.currentStep = 1;
        this.orderData = {};
        this.hasCrewProduct = false;
        this.init();
    }

    init() {
        this.attachModalEvents();
        this.attachFormValidation();
        this.detectProductType();
    }
    
    detectProductType() {
        // Détecter si le panier contient Fortnite Crew (id = 5)
        if (typeof cart !== 'undefined' && cart.items) {
            this.hasCrewProduct = cart.items.some(item => item.id === '5');
            this.updateFormFields();
        }
    }
    
    updateFormFields() {
        const crewFields = document.getElementById('crewFields');
        const vbucksFields = document.getElementById('vbucksFields');
        const crewMessage = document.getElementById('crewMessage');
        const vbucksMessage = document.getElementById('vbucksMessage');
        const emailHint = document.getElementById('emailHint');
        
        if (this.hasCrewProduct) {
            // Afficher les champs Fortnite Crew
            if (crewFields) {
                crewFields.style.display = 'block';
                // Rendre les champs obligatoires
                document.getElementById('epicUsername').required = true;
                document.getElementById('epicLoginEmail').required = true;
                document.getElementById('whatsappNumber').required = true;
            }
            if (vbucksFields) vbucksFields.style.display = 'none';
            if (crewMessage) crewMessage.style.display = 'block';
            if (vbucksMessage) vbucksMessage.style.display = 'none';
            if (emailHint) emailHint.textContent = 'Pour la confirmation de commande';
            
            // Retirer l'obligation du champ plateforme
            const platformField = document.getElementById('platform');
            if (platformField) platformField.required = false;
        } else {
            // Afficher les champs V-Bucks uniquement
            if (crewFields) {
                crewFields.style.display = 'none';
                // Retirer l'obligation des champs Crew
                document.getElementById('epicUsername').required = false;
                document.getElementById('epicLoginEmail').required = false;
                document.getElementById('whatsappNumber').required = false;
            }
            if (vbucksFields) vbucksFields.style.display = 'block';
            if (crewMessage) crewMessage.style.display = 'none';
            if (vbucksMessage) vbucksMessage.style.display = 'block';
            if (emailHint) emailHint.textContent = 'Pour recevoir les identifiants du compte';
            
            // Réactiver l'obligation du champ plateforme
            const platformField = document.getElementById('platform');
            if (platformField) platformField.required = true;
        }
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
        const fullName = document.getElementById('fullName').value.trim();
        const contactEmail = document.getElementById('contactEmail').value.trim();
        
        // Validation de base
        if (!fullName || !contactEmail) {
            this.showError('Veuillez remplir tous les champs requis');
            return false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contactEmail)) {
            this.showError('Email invalide');
            return false;
        }

        // Stocker les données communes
        this.orderData.fullName = fullName;
        this.orderData.contactEmail = contactEmail;
        this.orderData.productType = this.hasCrewProduct ? 'crew' : 'fortnite_item';

        if (this.hasCrewProduct) {
            // Validation des champs Fortnite Crew
            const epicUsername = document.getElementById('epicUsername').value.trim();
            const epicLoginEmail = document.getElementById('epicLoginEmail').value.trim();
            const whatsappNumber = document.getElementById('whatsappNumber').value.trim();
            
            if (!epicUsername || !epicLoginEmail || !whatsappNumber) {
                this.showError('Veuillez remplir tous les champs Fortnite Crew');
                return false;
            }
            
            if (!emailRegex.test(epicLoginEmail)) {
                this.showError('Email Epic Games invalide');
                return false;
            }
            
            // Stocker les données Crew
            this.orderData.epicUsername = epicUsername;
            this.orderData.epicLoginEmail = epicLoginEmail;
            this.orderData.whatsappNumber = whatsappNumber;
        } else {
            // Validation des champs V-Bucks
            const platform = document.getElementById('platform').value;
            
            if (!platform) {
                this.showError('Veuillez sélectionner une plateforme');
                return false;
            }
            
            // Stocker les données V-Bucks
            this.orderData.platform = platform;
        }

        // Redirection directe vers WhatsApp
        this.redirectToWhatsApp();
        return true;
    }
    
    redirectToWhatsApp() {
        const customer = this.orderData;
        const cartItems = cart.items;
        
        // Construire le message WhatsApp
        let message = `*NOUVELLE COMMANDE FORTNITEITEMS*\n\n`;
        message += `*Articles commandes:*\n`;
        
        let total = 0;
        cartItems.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            message += `- ${item.name} x${item.quantity} = ${itemTotal.toLocaleString('fr-FR')} FCFA\n`;
        });
        
        message += `\n*Total: ${total.toLocaleString('fr-FR')} FCFA*\n\n`;
        message += `*Informations client:*\n`;
        message += `- Nom: ${customer.fullName}\n`;
        message += `- Email: ${customer.contactEmail}\n`;
        
        if (this.hasCrewProduct) {
            // Informations Fortnite Crew
            message += `- Pseudo Epic: ${customer.epicUsername}\n`;
            message += `- Email Epic: ${customer.epicLoginEmail}\n`;
            message += `- WhatsApp: ${customer.whatsappNumber}\n`;
        } else {
            // Informations items Fortnite (skins, emotes, etc.)
            message += `- Plateforme: ${customer.platform}\n`;
        }
        
        message += `\nJe souhaite finaliser cette commande !`;
        
        // Encoder le message pour URL
        const whatsappURL = `https://wa.me/22965623691?text=${encodeURIComponent(message)}`;
        
        // Fermer le modal
        this.closeModal();
        
        // Vider le panier
        cart.clearCart();
        
        // Rediriger vers WhatsApp
        window.open(whatsappURL, '_blank');
        
        // Afficher un message de confirmation
        setTimeout(() => {
            alert('Votre commande a ete envoyee sur WhatsApp !\n\nVous allez etre redirige pour finaliser le paiement avec notre equipe.');
        }, 500);
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

    nextStep(step) {
        console.log('nextStep appelé avec step:', step);
        
        // Masquer toutes les étapes
        document.querySelectorAll('.checkout-step').forEach(s => {
            s.classList.remove('active');
        });

        // Afficher l'étape cible
        const targetStep = document.getElementById(`step${step}`);
        if (targetStep) {
            targetStep.classList.add('active');
            console.log('✅ Étape', step, 'affichée');
        } else {
            console.error('❌ Étape introuvable:', `step${step}`);
        }
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
            resetProcessingUI();
        }
    }

    generateOrderNumber() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `FN${timestamp}${random}`;
    }
}

function updateProcessingStatus(message) {
    const statusElement = document.getElementById('processingStatus');
    if (statusElement) {
        statusElement.textContent = message;
    }
}

function hideProcessingHint() {
    const hint = document.getElementById('processingHint');
    if (hint) {
        hint.classList.remove('show');
    }
}

function showProcessingHint() {
    const hint = document.getElementById('processingHint');
    if (hint) {
        hint.classList.add('show');
    }
    // Autoriser une nouvelle tentative
    isProcessingPayment = false;
}

function startProcessingUI() {
    updateProcessingStatus('Initialisation du paiement sécurisé...');
    hideProcessingHint();
    clearTimeout(processingStatusTimer);
    clearTimeout(processingHintTimer);

    processingStatusTimer = setTimeout(() => {
        updateProcessingStatus('Connexion à Lygos... Cela peut prendre quelques secondes.');
    }, 1200);

    processingHintTimer = setTimeout(() => {
        updateProcessingStatus('Toujours en cours... Lygos peut mettre jusqu\'à 10 secondes à s\'ouvrir.');
        showProcessingHint();
    }, 6000);
}

function resetProcessingUI() {
    clearTimeout(processingStatusTimer);
    clearTimeout(processingHintTimer);
    hideProcessingHint();
    isProcessingPayment = false;
}

function retryPaymentRedirect() {
    if (isProcessingPayment) {
        return;
    }
    isProcessingPayment = true;
    startProcessingUI();
    updateProcessingStatus('Nouvelle tentative de redirection en cours...');
    warmupBackend();

    setTimeout(() => {
        redirectToLygosPayment();
    }, 120);
}

async function warmupBackend() {
    try {
        await fetch(`${API_URL}/health`, {
            method: 'GET',
            cache: 'no-store'
        });
        console.log('🔥 Backend warmup OK');
    } catch (error) {
        console.warn('⚠️ Échec du warmup backend:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => warmupBackend(), 600);
});

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
    
    if (isProcessingPayment) {
        console.log('⚠️ Un paiement est déjà en cours');
        return false;
    }
    
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
        checkout.nextStep(3);
        startProcessingUI();
        isProcessingPayment = true;
        warmupBackend();

        console.log('🚀 Initialisation immédiate du paiement Lygos');
        setTimeout(() => {
            redirectToLygosPayment();
        }, 120);
        
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
        resetProcessingUI();
        checkout.nextStep(1);
        return false;
    }
    
    console.log('Nombre d\'articles:', cartItems.length);
    
    // Récupérer les infos du formulaire selon le type de produit
    const fullName = document.getElementById('fullName').value;
    const contactEmail = document.getElementById('contactEmail').value;
    
    // Calculer le montant total
    const totalAmount = cart.getTotal();
    
    console.log('Montant total:', totalAmount);
    
    // Préparer les données client selon le type de produit
    const customerData = {
        fullName: fullName,
        contactEmail: contactEmail,
        productType: checkout.hasCrewProduct ? 'crew' : 'vbucks'
    };
    
    if (checkout.hasCrewProduct) {
        // Données Fortnite Crew
        customerData.epicUsername = document.getElementById('epicUsername').value;
        customerData.epicLoginEmail = document.getElementById('epicLoginEmail').value;
        customerData.whatsappNumber = document.getElementById('whatsappNumber').value;
    } else {
        // Données V-Bucks
        customerData.platform = document.getElementById('platform').value;
    }
    
    // Préparer les données pour l'API
    const paymentData = {
        amount: totalAmount,
        items: cartItems,
        customer: customerData
    };
    
    console.log('Données envoyées à l\'API:', paymentData);
    updateProcessingStatus('Création de la session de paiement sécurisée...');
    
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
            console.log('✅ Lien de paiement créé:', result.order_id);
            console.log('✅ URL paiement:', result.payment_link);
            
            updateProcessingStatus('Redirection vers la page de paiement sécurisée...');
            
            // Sauvegarder les infos de commande localement pour les envoyer après paiement réussi
            localStorage.setItem('fortniteshop_pending_order', JSON.stringify({
                order_id: result.order_id,
                customer: customerData,
                items: cartItems,
                amount: totalAmount,
                timestamp: new Date().toISOString(),
                payment_provider: PAYMENT_PROVIDER
            }));
            
            // Redirection vers Lygos
            console.log(`🚀 Redirection vers Lygos...`);
            resetProcessingUI();
            window.location.href = result.payment_link;
            
            return true;
        } else {
            console.log('❌ Erreur lors de la création du paiement:', result.error);
            checkout.showError(result.error || 'Erreur lors de la création du paiement');
            resetProcessingUI();
            
            // Retourner à l'étape 2
            checkout.nextStep(2);
            return false;
        }
    } catch (error) {
        console.error('❌ Erreur réseau:', error);
        checkout.showError('Erreur de connexion. Vérifiez que le serveur backend est démarré.');
        resetProcessingUI();
        
        // Retourner à l'étape 2
        checkout.nextStep(2);
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
    checkout.nextStep(4);

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

// Initialiser les gestionnaires d'événements
// Attendre que checkout soit initialisé
setTimeout(function() {
    // Bouton Finaliser sur WhatsApp étape 1
    const step1NextBtn = document.getElementById('step1NextBtn');
    if (step1NextBtn) {
        step1NextBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔘 Bouton Finaliser sur WhatsApp cliqué');
            if (checkout.validateStep1()) {
                // La méthode validateStep1 appelle déjà redirectToWhatsApp
                console.log('✅ Redirection vers WhatsApp');
            }
        });
        console.log('✅ Bouton Finaliser sur WhatsApp (étape 1) connecté');
    } else {
        console.warn('⚠️ Bouton step1NextBtn non trouvé');
    }
}, 100);
