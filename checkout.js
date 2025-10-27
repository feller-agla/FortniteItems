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

        // Payment method selection
        document.querySelectorAll('.payment-option input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                document.querySelectorAll('.payment-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                e.target.closest('.payment-option').classList.add('selected');
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
    document.querySelectorAll('.checkout-step').forEach(s => {
        s.classList.remove('active');
    });

    // Show selected step
    document.getElementById(`step${step}`).classList.add('active');
}

// Process payment
function processPayment() {
    const selectedPayment = document.querySelector('input[name="payment"]:checked');
    
    if (!selectedPayment) {
        checkout.showError('Veuillez sélectionner un mode de paiement');
        return;
    }

    // Show processing step
    nextStep(3);

    // Simulate payment processing
    setTimeout(() => {
        completeOrder();
    }, 3000);
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

