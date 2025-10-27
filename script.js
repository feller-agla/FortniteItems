// ===========================
// PARTICLE SYSTEM
// ===========================

class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 80;
        
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
                        behavior: 'smooth'
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
            button.addEventListener('click', () => {
                button.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    button.style.transform = 'scale(1)';
                    this.showNotification('Added to cart! ✨');
                }, 150);
            });
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
        this.whatsappNumber = '229XXXXXXXX'; // Replace with actual number
        this.init();
    }
    
    init() {
        // Track clicks on WhatsApp buttons
        const whatsappButtons = document.querySelectorAll('a[href*="wa.me"]');
        whatsappButtons.forEach(button => {
            button.addEventListener('click', () => {
                console.log('🎮 WhatsApp button clicked - VBucks Benin');
            });
        });
    }
    
    // Helper to generate WhatsApp links
    generateWhatsAppLink(message) {
        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/${this.whatsappNumber}?text=${encodedMessage}`;
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
        this.init();
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
            <div style="font-size: 64px; font-weight: 900; font-family: 'Orbitron', sans-serif; background: linear-gradient(135deg, #00D4FF, #7B68EE); -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: pulse 2s infinite;">
                VBUCKS BENIN 🇧🇯
            </div>
            <div style="font-size: 24px; color: #FFD700; margin-top: 10px; font-weight: 600;">
                Chargement...
            </div>
            <div style="width: 200px; height: 4px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; overflow: hidden; margin-top: 20px;">
                <div style="width: 0%; height: 100%; background: linear-gradient(90deg, #25D366, #00D4FF); animation: loadBar 2s ease-out forwards; border-radius: 10px;"></div>
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
// INITIALIZE ALL SYSTEMS
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize particle system
    const canvas = document.getElementById('particleCanvas');
    const particleSystem = new ParticleSystem(canvas);
    particleSystem.animate();
    
    // Initialize all interactive features
    new ScrollAnimations();
    new SmoothScroll();
    new NavbarEffects();
    new ProductCards();
    new WhatsAppIntegration();
    new CursorTrail();
    new TextEffects();
    new StatsCounter();
    new ParallaxEffect();
    new LoadingAnimation();
    
    console.log('🎮🇧🇯 VBucks Benin - Site chargé avec succès!');
});

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

