// ===========================
// MOTION PREFERENCES HELPERS
// ===========================

const motionMediaQuery = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false, addEventListener: () => {}, addListener: () => {} };

const shouldReduceMotion = () => {
    const prefersReduced = motionMediaQuery.matches;
    const isSmallScreen = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
    return prefersReduced || isSmallScreen;
};

function updateBodyMotionPreference(shouldReduce) {
    if (typeof document !== 'undefined' && document.body) {
        document.body.classList.toggle('prefers-reduced-motion', shouldReduce);
    }
}

// ===========================
// PARTICLE SYSTEM
// ===========================

class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 40; // Réduit de 80 à 40
        
        this.resize();
        this.init();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    init() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                color: this.getRandomColor(),
                opacity: Math.random() * 0.5 + 0.3
            });
        }
    }
    
    getRandomColor() {
        const colors = [
            'rgba(0, 217, 255, ',    // Electric blue
            'rgba(255, 29, 203, ',   // Neon pink
            'rgba(43, 0, 99, '       // Deep purple
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    update() {
        this.particles.forEach(particle => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            
            // Wrap around screen
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.y > this.canvas.height) particle.y = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
        });
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw connections
        this.particles.forEach((p1, i) => {
            this.particles.slice(i + 1).forEach(p2 => {
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(0, 217, 255, ${0.2 * (1 - distance / 150)})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            });
        });
        
        // Draw particles
        this.particles.forEach(particle => {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color + particle.opacity + ')';
            this.ctx.fill();
            
            // Add glow effect
            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size * 3
            );
            gradient.addColorStop(0, particle.color + particle.opacity + ')');
            gradient.addColorStop(1, particle.color + '0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// ===========================
// SCROLL ANIMATIONS
// ===========================

class ScrollAnimations {
    constructor() {
        this.observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };
        
        this.init();
    }
    
    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, this.observerOptions);
        
        // Observe all sections and cards
        const elements = document.querySelectorAll('.product-card, .feature-card, .testimonial-card');
        elements.forEach(el => observer.observe(el));
    }
}

// ===========================
// SMOOTH SCROLL
// ===========================

class SmoothScroll {
    constructor() {
        this.init();
    }
    
    init() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                
                if (target) {
                    const offsetTop = target.offsetTop - 80;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: shouldReduceMotion() ? 'auto' : 'smooth'
                    });
                }
            });
        });
    }
}

// ===========================
// NAVBAR EFFECTS
// ===========================

class NavbarEffects {
    constructor() {
        this.navbar = document.querySelector('.navbar');
        this.lastScroll = 0;
        this.init();
    }
    
    init() {
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 100) {
                this.navbar.style.background = 'rgba(10, 0, 20, 0.95)';
                this.navbar.style.boxShadow = '0 5px 30px rgba(0, 217, 255, 0.2)';
            } else {
                this.navbar.style.background = 'rgba(10, 0, 20, 0.8)';
                this.navbar.style.boxShadow = 'none';
            }
            
            this.lastScroll = currentScroll;
        });
    }
}

// ===========================
// PRODUCT CARD INTERACTIONS
// ===========================

class ProductCards {
    constructor() {
        this.cards = document.querySelectorAll('.product-card');
        this.init();
    }
    
    init() {
        this.cards.forEach(card => {
            // Add 3D tilt effect
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / 20;
                const rotateY = (centerX - x) / 20;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px) scale(1.02)`;
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0) scale(1)';
            });
            
            // Add click animation
            const button = card.querySelector('.product-button');
            if (button && button.dataset.disableProductAnimation !== 'true') {
                button.addEventListener('click', () => {
                    button.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        button.style.transform = 'scale(1)';
                        this.showNotification('Added to cart! ✨');
                    }, 150);
                });
            }
        });
    }
    
    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 30px;
            background: linear-gradient(135deg, #25D366, #128C7E);
            color: white;
            padding: 15px 30px;
            border-radius: 50px;
            font-weight: 700;
            font-family: 'Poppins', 'Rajdhani', sans-serif;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 5px 30px rgba(37, 211, 102, 0.5);
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// ===========================
// WHATSAPP INTEGRATION
// ===========================

class WhatsAppIntegration {
    constructor() {
        this.whatsappNumber = '22965623691';
        this.prefilledButtons = document.querySelectorAll('[data-whatsapp-message]');
        this.init();
    }
    
    init() {
        this.updatePrefilledButtons();
        
        // Track clicks on WhatsApp buttons
        const whatsappButtons = document.querySelectorAll('a[href*="wa.me"]');
        whatsappButtons.forEach(button => {
            button.addEventListener('click', () => {
                console.log('🎮 WhatsApp button clicked - VBucks Benin');
            });
        });
    }
    
    updatePrefilledButtons() {
        if (!this.prefilledButtons.length) return;
        
        this.prefilledButtons.forEach(button => {
            const message = button.getAttribute('data-whatsapp-message') || "Bonjour, j'ai besoin d'aide avec ma commande FortniteItems.";
            button.setAttribute('href', this.generateWhatsAppLink(message));
            if (!button.getAttribute('target')) {
                button.setAttribute('target', '_blank');
            }
            button.setAttribute('rel', 'noopener');
        });
    }
    
    // Helper to generate WhatsApp links
    generateWhatsAppLink(message = '') {
        const sanitizedNumber = this.whatsappNumber.replace(/\D/g, '');
        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/${sanitizedNumber}?text=${encodedMessage}`;
    }
}

// ===========================
// CURSOR TRAIL EFFECT
// ===========================

class CursorTrail {
    constructor() {
        this.trail = [];
        this.maxTrail = 15;
        this.init();
    }
    
    init() {
        document.addEventListener('mousemove', (e) => {
            this.createTrailDot(e.clientX, e.clientY);
        });
    }
    
    createTrailDot(x, y) {
        const dot = document.createElement('div');
        dot.style.cssText = `
            position: fixed;
            width: 6px;
            height: 6px;
            background: radial-gradient(circle, rgba(0, 217, 255, 0.8), transparent);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            left: ${x}px;
            top: ${y}px;
            transform: translate(-50%, -50%);
            animation: trailFade 0.8s ease-out forwards;
        `;
        
        document.body.appendChild(dot);
        
        setTimeout(() => dot.remove(), 800);
    }
}

// ===========================
// DYNAMIC TEXT EFFECTS
// ===========================

class TextEffects {
    constructor() {
        this.init();
    }
    
    init() {
        const heroTitle = document.querySelector('.title-highlight');
        if (heroTitle) {
            this.typeWriter(heroTitle);
        }
    }
    
    typeWriter(element) {
        const text = element.textContent;
        element.textContent = '';
        element.style.opacity = '1';
        
        let i = 0;
        const speed = 100;
        
        const type = () => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        };
        
        setTimeout(type, 500);
    }
}

// ===========================
// STATS COUNTER ANIMATION
// ===========================

class StatsCounter {
    constructor() {
        this.animated = false;
        this.init();
    }
    
    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.animated) {
                    this.animateStats();
                    this.animated = true;
                }
            });
        });
        
        const statsSection = document.querySelector('.hero-stats');
        if (statsSection) {
            observer.observe(statsSection);
        }
    }
    
    animateStats() {
        const stats = [
            { element: document.querySelectorAll('.stat-number')[0], target: '50K+' },
            { element: document.querySelectorAll('.stat-number')[1], target: '24/7' },
            { element: document.querySelectorAll('.stat-number')[2], target: '100%' }
        ];
        
        stats.forEach((stat, index) => {
            setTimeout(() => {
                stat.element.style.transform = 'scale(1.2)';
                stat.element.style.color = '#FF1DCB';
                
                setTimeout(() => {
                    stat.element.style.transform = 'scale(1)';
                    stat.element.style.color = '#00D9FF';
                }, 200);
            }, index * 200);
        });
    }
}

// ===========================
// PARALLAX EFFECT
// ===========================

class ParallaxEffect {
    constructor() {
        this.init();
    }
    
    init() {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            
            // Parallax for hero visual
            const heroVisual = document.querySelector('.hero-visual');
            if (heroVisual) {
                heroVisual.style.transform = `translateY(${scrolled * 0.3}px)`;
            }
            
            // Parallax for energy rings
            const rings = document.querySelectorAll('.energy-ring');
            rings.forEach((ring, index) => {
                ring.style.transform = `translateY(${scrolled * (0.1 * (index + 1))}px) rotate(${scrolled * 0.1}deg)`;
            });
        });
    }
}

// ===========================
// LOADING ANIMATION
// ===========================

class LoadingAnimation {
    constructor() {
        // Only show loading animation on first visit or page refresh
        // Not when navigating within the same page
        const isPageRefresh = performance.navigation.type === 1; // Refresh
        const isFirstLoad = !sessionStorage.getItem('siteLoaded');
        
        if (isFirstLoad || isPageRefresh) {
            this.init();
            sessionStorage.setItem('siteLoaded', 'true');
        }
    }
    
    init() {
        // Create loading screen
        const loader = document.createElement('div');
        loader.id = 'loader';
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #0A0014, #2B0063);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            flex-direction: column;
            gap: 20px;
        `;
        
        loader.innerHTML = `
            <div style="font-size: clamp(32px, 8vw, 64px); font-weight: 900; font-family: 'Orbitron', sans-serif; background: linear-gradient(135deg, #00D4FF, #7B68EE); -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: pulse 2s infinite; text-align: center; padding: 0 20px;">
                FortniteItems
            </div>
            <div style="font-size: clamp(16px, 4vw, 24px); color: #FFD700; margin-top: 10px; font-weight: 600; text-align: center;">
                Chargement...
            </div>
            <div style="width: min(200px, 80%); height: 4px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; overflow: hidden; margin-top: 20px;">
                <div style="width: 0%; height: 100%; background: linear-gradient(90deg, #7B68EE, #00D4FF); animation: loadBar 2s ease-out forwards; border-radius: 10px;"></div>
            </div>
        `;
        
        document.body.appendChild(loader);
        
        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes loadBar {
                0% { width: 0%; }
                100% { width: 100%; }
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes trailFade {
                0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0); }
            }
        `;
        document.head.appendChild(style);
        
        // Remove loader after page loads
        window.addEventListener('load', () => {
            setTimeout(() => {
                loader.style.opacity = '0';
                loader.style.transition = 'opacity 0.5s';
                setTimeout(() => loader.remove(), 500);
            }, 2000);
        });
    }
}

// ===========================
// MOBILE MENU
// ===========================

class MobileMenu {
    constructor() {
        this.hamburger = document.getElementById('hamburgerMenu');
        this.navLinks = document.getElementById('navLinks');
        
        if (this.hamburger && this.navLinks) {
            this.init();
        }
    }
    
    init() {
        // Toggle menu on hamburger click
        this.hamburger.addEventListener('click', () => {
            this.toggleMenu();
        });
        
        // Close menu when clicking on a link
        this.navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                this.closeMenu();
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.hamburger.contains(e.target) && 
                !this.navLinks.contains(e.target) && 
                this.navLinks.classList.contains('active')) {
                this.closeMenu();
            }
        });
    }
    
    toggleMenu() {
        this.hamburger.classList.toggle('active');
        this.navLinks.classList.toggle('active');
        
        // Prevent body scroll when menu is open
        if (this.navLinks.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
    
    closeMenu() {
        this.hamburger.classList.remove('active');
        this.navLinks.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ===========================
// NAVIGATION LINK NORMALIZER
// ===========================

class NavLinkRouter {
    constructor() {
        this.links = document.querySelectorAll('[data-nav-target]');
        this.init();
    }

    init() {
        if (!this.links.length) return;
        const isIndexPage = this.isIndexPage();

        this.links.forEach((link) => {
            const target = link.getAttribute('data-nav-target');
            if (!target) return;

            const normalized = target.startsWith('#') ? target : `#${target}`;
            if (isIndexPage) {
                link.setAttribute('href', normalized);
            } else {
                link.setAttribute('href', `index.html${normalized}`);
            }
        });
    }

    isIndexPage() {
        const path = window.location.pathname || '';
        return path.endsWith('/') || path.endsWith('/index.html');
    }
}

// ===========================
// SHOP PREVIEW (HOMEPAGE)
// ===========================

class ShopPreview {
    constructor() {
        this.grid = document.getElementById('shopPreviewGrid');
        if (!this.grid) return;
        this.apiBaseUrl = this.resolveBackendBaseUrl();
        this.loadPreview();
    }

    resolveBackendBaseUrl() {
        if (window.FORTNITE_ITEMS_BACKEND) {
            return window.FORTNITE_ITEMS_BACKEND;
        }
        const host = window.location.hostname;
        const isLocalhost = ['localhost', '127.0.0.1'].includes(host);
        return isLocalhost ? 'http://localhost:5000' : 'https://fortniteitems.onrender.com';
    }

    async loadPreview() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/shop`);
            if (!response.ok) throw new Error('API shop preview error');
            const payload = await response.json();
            
            console.log('📦 ShopPreview - Payload reçu:', payload);
            
            // Si l'API renvoie explicitement success:false (ex: clé manquante), masquer la section
            if (payload && payload.success === false) {
                console.info('Shop preview désactivé:', payload.error || payload.message || 'API non disponible');
                this.hideSection();
                return;
            }
            
            // Si le payload a des items, les utiliser
            const previewItems = this.preparePreviewItems(payload);
            console.log('📦 ShopPreview - Items préparés:', previewItems);
            
            if (!previewItems.length) {
                console.warn('ShopPreview - Aucun item disponible après préparation');
                this.hideSection();
                return;
            }
            
            this.render(previewItems);
        } catch (error) {
            console.warn('Shop preview unavailable:', error);
            this.hideSection();
        }
    }
    
    hideSection() {
        const section = document.getElementById('shopPreview');
        if (section) {
            section.style.display = 'none';
        }
    }

    preparePreviewItems(payload = {}) {
        if (Array.isArray(payload.items) && payload.items.length) {
            return this.pickFromNormalizedItems(payload.items);
        }
        const entries = payload?.entries || payload?.data?.entries || [];
        return this.pickPreviewItems(entries);
    }

    pickPreviewItems(entries) {
        const picked = [];
        entries.forEach((entry) => {
            if (picked.length >= 3) return;
            const brItem = Array.isArray(entry.brItems) ? entry.brItems[0] || {} : {};
            picked.push({
                itemId: brItem.id || entry.offerId || entry.id,
                name: brItem.name || entry.devName || 'Skin Fortnite',
                description: brItem.description || 'Disponible aujourd\'hui',
                price: entry.finalPrice ?? entry.price?.finalPrice ?? 0,
                rarity: brItem.rarity?.displayValue || 'Classique',
                image: entry.newDisplayAsset?.renderImages?.[0]?.image
                    || brItem.images?.featured
                    || brItem.images?.icon
                    || 'assets/5000vbucks.png'
            });
        });
        return picked.slice(0, 3);
    }

    pickFromNormalizedItems(items) {
        const cleaned = [];
        items.some((item) => {
            if (cleaned.length >= 3) return true;
            cleaned.push({
                itemId: item.id || item.itemId,
                name: item.name || item.devName || 'Skin Fortnite',
                description: item.description || item.section || 'Disponible aujourd\'hui',
                price: item.vbucks ?? item.price ?? 0,
                rarity: item.rarity || 'Classique',
                image: item.images?.featured
                    || item.images?.icon
                    || item.images?.smallIcon
                    || 'assets/5000vbucks.png'
            });
            return false;
        });
        return cleaned.slice(0, 3);
    }

    render(items) {
        const markup = items.map((item) => this.createCard(item)).join('');
        this.grid.innerHTML = markup;
    }

    createCard(item) {
        return `
            <article class="shop-preview-card">
                <div class="preview-media" style="background-image:url('${item.image}')"></div>
                <div class="preview-content">
                    <h3>${this.escapeHtml(item.name)}</h3>
                    <p>${this.escapeHtml(item.description)}</p>
                    <a href="shop-item.html?name=${encodeURIComponent(item.name)}" class="preview-button">
                        Voir détails
                    </a>
                </div>
            </article>
        `;
    }

    renderError() {
        this.grid.innerHTML = `
            <article class="shop-preview-card">
                <h3>Boutique indisponible</h3>
                <p>Impossible de charger la boutique live pour le moment. Réessaie dans quelques minutes.</p>
            </article>
        `;
    }

    formatPrice(vbucks) {
        if (!Number.isFinite(vbucks)) return '--';
        // Conversion V-Bucks -> USD -> FCFA (même formule que shop.js)
        const DEFAULT_USD_TO_XOF = 580;
        const usd = vbucks * 0.00357 * 1.5;
        const rate = Number(window.FORTNITE_ITEMS_USD_TO_XOF) || DEFAULT_USD_TO_XOF;
        const fcfa = usd * rate;
        const rounded = Math.round(fcfa / 100) * 100; // Arrondir à la centaine
        return `${rounded.toLocaleString('fr-FR')} FCFA`;
    }

    escapeHtml(value) {
        const div = document.createElement('div');
        div.textContent = value ?? '';
        return div.innerHTML;
    }
}

// ===========================
// SMOOTH SCROLL FOR MENU LINKS
// ===========================

function initSmoothScrollMenu() {
    const links = document.querySelectorAll('.nav-links a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // Close mobile menu if open
                const hamburger = document.getElementById('hamburgerMenu');
                const navLinks = document.getElementById('navLinks');
                if (hamburger && navLinks) {
                    hamburger.classList.remove('active');
                    navLinks.classList.remove('active');
                    document.body.style.overflow = '';
                }
                
                // Smooth scroll to target
                targetElement.scrollIntoView({
                    behavior: shouldReduceMotion() ? 'auto' : 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ===========================
// INITIALIZE ALL SYSTEMS
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    let reduceMotion = shouldReduceMotion();
    updateBodyMotionPreference(reduceMotion);

    const handleMotionPreferenceChange = () => {
        const nextPreference = shouldReduceMotion();
        if (nextPreference !== reduceMotion) {
            reduceMotion = nextPreference;
            updateBodyMotionPreference(reduceMotion);
        }
    };

    if (typeof motionMediaQuery.addEventListener === 'function') {
        motionMediaQuery.addEventListener('change', handleMotionPreferenceChange);
    } else if (typeof motionMediaQuery.addListener === 'function') {
        motionMediaQuery.addListener(handleMotionPreferenceChange);
    }

    window.addEventListener('resize', handleMotionPreferenceChange);

    // Initialize particle system (only if canvas exists - index page)
    const canvas = document.getElementById('particleCanvas');
    if (canvas) {
        if (reduceMotion) {
            canvas.remove();
        } else {
            const particleSystem = new ParticleSystem(canvas);
            particleSystem.animate();
        }
    }
    
    // Initialize mobile menu (all pages)
    new MobileMenu();
    new NavLinkRouter();
    new ShopPreview();
    
    // Initialize smooth scroll for menu (all pages)
    initSmoothScrollMenu();
    
    // Initialize other features (only if they exist on the page)
    if (typeof ScrollAnimations !== 'undefined') new ScrollAnimations();
    if (!reduceMotion && typeof SmoothScroll !== 'undefined') new SmoothScroll();
    if (typeof NavbarEffects !== 'undefined') new NavbarEffects();
    if (!reduceMotion && typeof ProductCards !== 'undefined') new ProductCards();
    if (typeof WhatsAppIntegration !== 'undefined') new WhatsAppIntegration();
    if (!reduceMotion && typeof CursorTrail !== 'undefined') new CursorTrail();
    if (typeof TextEffects !== 'undefined') new TextEffects();
    
    // Load and display reviews from localStorage
    loadReviews();
});

// ===========================
// REVIEWS LOADER
// ===========================

function loadReviews() {
    const grid = document.getElementById('testimonialsGrid');
    if (!grid) return;

    try {
        const reviews = JSON.parse(localStorage.getItem('fortniteshop_reviews') || '[]');
        if (reviews.length === 0) return;

        // Prendre les 3 avis les plus récents
        const recentReviews = reviews
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 3);

        // Générer les cartes d'avis
        const reviewCards = recentReviews.map(review => {
            const avatars = ['🎮', '⚔️', '🏆', '🎯', '💎', '🔥', '⭐', '🌟'];
            const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
            const stars = '⭐'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
            const name = review.customerName.split(' ')[0] + ' ' + (review.customerName.split(' ')[1]?.[0] || '') + '.';
            
            return `
                <div class="testimonial-card">
                    <div class="chat-bubble">
                        <div class="bubble-header">
                            <div class="user-avatar">${randomAvatar}</div>
                            <div class="user-info">
                                <div class="user-name">${escapeHtml(name)}</div>
                                <div class="user-level">Client vérifié</div>
                            </div>
                        </div>
                        <div class="bubble-message">
                            ${escapeHtml(review.comment || 'Excellent service !')}
                        </div>
                        <div class="bubble-rating">${stars}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Ajouter les avis au début de la grille (avant les avis statiques)
        grid.insertAdjacentHTML('afterbegin', reviewCards);
    } catch (error) {
        console.warn('Erreur lors du chargement des avis:', error);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===========================
// EASTER EGG: KONAMI CODE
// ===========================

let konamiCode = [];
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    konamiCode = konamiCode.slice(-10);
    
    if (konamiCode.join(',') === konamiSequence.join(',')) {
        activateEasterEgg();
    }
});

function activateEasterEgg() {
    // Create confetti effect
    for (let i = 0; i < 100; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.textContent = ['⚡', '🎮', '👑', '💎', '🔥'][Math.floor(Math.random() * 5)];
            confetti.style.cssText = `
                position: fixed;
                font-size: 30px;
                left: ${Math.random() * 100}vw;
                top: -50px;
                z-index: 10000;
                pointer-events: none;
                animation: fall ${Math.random() * 3 + 2}s linear forwards;
            `;
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 5000);
        }, i * 50);
    }
    
    // Add fall animation
    if (!document.getElementById('confetti-style')) {
        const style = document.createElement('style');
        style.id = 'confetti-style';
        style.textContent = `
            @keyframes fall {
                to {
                    transform: translateY(100vh) rotate(360deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Show easter egg message
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #25D366, #00D4FF);
        padding: 30px 60px;
        border-radius: 20px;
        font-size: 32px;
        font-weight: 900;
        font-family: 'Orbitron', sans-serif;
        color: white;
        z-index: 10001;
        box-shadow: 0 20px 60px rgba(37, 211, 102, 0.5);
        animation: pulse 1s infinite;
    `;
    message.textContent = '🎉🇧🇯 VBUCKS GRATUITS! 🇧🇯🎉';
    document.body.appendChild(message);
    
    setTimeout(() => message.remove(), 3000);
}


