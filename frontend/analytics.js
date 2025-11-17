// ===========================
// ANALYTICS & TRACKING
// ===========================

// Configuration du Pixel Facebook
const FACEBOOK_PIXEL_ID = 'VOTRE_PIXEL_ID_ICI'; // Remplacez par votre ID pixel

// Initialiser le Pixel Facebook
(function initFacebookPixel() {
    if (!FACEBOOK_PIXEL_ID || FACEBOOK_PIXEL_ID === 'VOTRE_PIXEL_ID_ICI') {
        console.log('⚠️ Pixel Facebook non configuré');
        return;
    }

    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    
    fbq('init', FACEBOOK_PIXEL_ID);
    fbq('track', 'PageView');
    
    console.log('✅ Pixel Facebook initialisé:', FACEBOOK_PIXEL_ID);
})();

// Fonction pour tracker les événements
function trackEvent(eventName, params = {}) {
    // Facebook Pixel
    if (typeof fbq !== 'undefined') {
        fbq('track', eventName, params);
        console.log('📊 Événement tracké:', eventName, params);
    }
    
    // Google Analytics (si configuré)
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, params);
    }
}

// Événements spécifiques pour l'e-commerce
const Analytics = {
    // Vue du produit
    viewProduct: function(productId, productName, price) {
        trackEvent('ViewContent', {
            content_ids: [productId],
            content_name: productName,
            content_type: 'product',
            value: price,
            currency: 'XOF'
        });
    },
    
    // Ajout au panier
    addToCart: function(productId, productName, price, quantity = 1) {
        trackEvent('AddToCart', {
            content_ids: [productId],
            content_name: productName,
            content_type: 'product',
            value: price * quantity,
            currency: 'XOF'
        });
    },
    
    // Début du checkout
    initiateCheckout: function(totalAmount, items) {
        const content_ids = items.map(item => item.id);
        const contents = items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            item_price: item.price
        }));
        
        trackEvent('InitiateCheckout', {
            content_ids: content_ids,
            contents: contents,
            value: totalAmount,
            currency: 'XOF',
            num_items: items.length
        });
    },
    
    // Informations de paiement ajoutées
    addPaymentInfo: function(totalAmount, paymentMethod) {
        trackEvent('AddPaymentInfo', {
            value: totalAmount,
            currency: 'XOF',
            payment_method: paymentMethod
        });
    },
    
    // Achat complété (IMPORTANT!)
    purchase: function(orderId, totalAmount, items) {
        const content_ids = items.map(item => item.id);
        const contents = items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            item_price: item.price
        }));
        
        trackEvent('Purchase', {
            content_ids: content_ids,
            contents: contents,
            value: totalAmount,
            currency: 'XOF',
            transaction_id: orderId,
            num_items: items.length
        });
        
        console.log('🎉 Achat tracké:', orderId, totalAmount, 'FCFA');
    }
};

// Exporter l'objet Analytics globalement
window.Analytics = Analytics;
