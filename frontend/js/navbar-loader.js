async function loadNavbar() {
    try {
        const response = await fetch('components/navbar.html');
        if (!response.ok) throw new Error('Failed to load navbar');
        const html = await response.text();
        
        // Find placeholder or insert at top
        const navbarContainer = document.getElementById('navbar-container');
        if (navbarContainer) {
            navbarContainer.innerHTML = html;
        } else {
            // Fallback: Replace existing nav or prepend to body
            const existingNav = document.querySelector('nav.navbar');
            if (existingNav) {
                existingNav.outerHTML = html;
            } else {
                document.body.insertAdjacentHTML('afterbegin', html);
            }
        }

        initializeNavbar();
    } catch (error) {
        console.error('Navbar loading error:', error);
    }
}

function initializeNavbar() {
    // 1. Highlight active link
    const path = window.location.pathname;
    const page = path.split('/').pop().replace('.html', '') || 'home';
    
    // Default to home if index or empty
    const activePage = (page === 'index' || page === '') ? 'home' : page;
    
    // Find link with matching data-page
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === activePage) {
            link.classList.add('active');
        }
    });

    // 2. Re-bind Hamburger Menu (since we replaced the DOM)
    const hamburger = document.getElementById('hamburgerMenu');
    const navLinks = document.getElementById('navLinks');
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }

    // 3. Update Cart Count (re-run cart logic if needed)
    if (window.cart && window.cart.updateCartCount) {
        window.cart.updateCartCount();
    } else {
        // Fallback if cart not loaded yet
        const countSpan = document.getElementById('cartCount');
        if(countSpan) {
            const savedCart = JSON.parse(localStorage.getItem('fortnite_cart') || '[]');
            const count = savedCart.reduce((sum, item) => sum + item.quantity, 0);
            countSpan.textContent = count;
        }
    }
}

// Load automatically
document.addEventListener('DOMContentLoaded', loadNavbar);
