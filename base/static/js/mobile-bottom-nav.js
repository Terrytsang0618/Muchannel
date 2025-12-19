/**
 * Mobile Bottom Tab Bar Functionality
 * Handles navigation, cart updates, search, and user authentication
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    initMobileBottomNav();
});

/**
 * Initialize mobile bottom navigation
 */
function initMobileBottomNav() {
    // Handle tab clicks and active states
    handleTabClicks();

    // Handle search button
    handleSearchButton();

    // Handle cart button
    handleCartButton();

    // Handle user button
    handleUserButton();

    // Update cart count on page load
    updateMobileCartCount();

    // Set active tab based on current page
    setActiveTab();
}

/**
 * Handle tab clicks and active state management
 */
function handleTabClicks() {
    const tabItems = document.querySelectorAll('.mobile-bottom-tab-bar .tab-item');

    tabItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Don't prevent default for home tab (let it navigate)
            if (this.dataset.tab === 'home') {
                return;
            }

            // For other tabs, handle click events
            e.preventDefault();

            // Remove active class from all tabs
            tabItems.forEach(tab => tab.classList.remove('active'));

            // Add active class to clicked tab
            this.classList.add('active');
        });
    });
}

/**
 * Handle search button click
 */
function handleSearchButton() {
    const searchBtn = document.getElementById('mobile-search-btn');

    if (searchBtn) {
        searchBtn.addEventListener('click', function(e) {
            e.preventDefault();

            // Trigger the existing search functionality
            const desktopSearchBtn = document.getElementById('btn-search');
            if (desktopSearchBtn) {
                desktopSearchBtn.click();
            }
        });
    }
}

/**
 * Handle cart button click
 */
function handleCartButton() {
    const cartBtn = document.getElementById('mobile-cart-btn');

    if (cartBtn) {
        cartBtn.addEventListener('click', function(e) {
            e.preventDefault();

            // TODO: Navigate to cart page or show cart modal
            // For now, we'll just show an alert
            // Replace this with actual cart navigation later
            window.location.href = '/cart/'; // Update with your cart URL
        });
    }
}

/**
 * Handle user button click
 */
function handleUserButton() {
    const userBtn = document.getElementById('mobile-user-btn');

    if (userBtn) {
        userBtn.addEventListener('click', function(e) {
            e.preventDefault();

            // Check if user is logged in
            const isLoggedIn = checkAuthStatus();

            if (isLoggedIn) {
                // Show user menu/profile options
                showMobileUserMenu();
            } else {
                // Show login modal
                if (typeof openAuthModal === 'function') {
                    openAuthModal('login');
                }
            }
        });
    }
}

/**
 * Show mobile user menu (when logged in)
 */
function showMobileUserMenu() {
    // Create a simple menu overlay
    const menuHTML = `
        <div class="mobile-user-menu-overlay" id="mobileUserMenuOverlay">
            <div class="mobile-user-menu">
                <div class="mobile-user-menu-header">
                    <h4>My Account</h4>
                    <button class="close-btn" onclick="closeMobileUserMenu()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="mobile-user-menu-content">
                    <a href="#" class="menu-item">
                        <i class="fas fa-user"></i>
                        <span>Profile</span>
                    </a>
                    <a href="#" class="menu-item">
                        <i class="fas fa-shopping-bag"></i>
                        <span>My Orders</span>
                    </a>
                    <a href="#" class="menu-item">
                        <i class="fas fa-heart"></i>
                        <span>Wishlist</span>
                    </a>
                    <a href="#" class="menu-item">
                        <i class="fas fa-cog"></i>
                        <span>Settings</span>
                    </a>
                    <a href="#" class="menu-item logout" onclick="handleLogout(); return false;">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Logout</span>
                    </a>
                </div>
            </div>
        </div>
    `;

    // Remove existing menu if present
    const existingMenu = document.getElementById('mobileUserMenuOverlay');
    if (existingMenu) {
        existingMenu.remove();
    }

    // Add menu to body
    document.body.insertAdjacentHTML('beforeend', menuHTML);

    // Close menu when clicking overlay
    document.getElementById('mobileUserMenuOverlay').addEventListener('click', function(e) {
        if (e.target === this) {
            closeMobileUserMenu();
        }
    });
}

/**
 * Close mobile user menu
 */
function closeMobileUserMenu() {
    const menu = document.getElementById('mobileUserMenuOverlay');
    if (menu) {
        menu.remove();
    }
}

/**
 * Check authentication status
 */
function checkAuthStatus() {
    // Check if auth.js has the isAuthenticated function
    if (typeof isAuthenticated === 'function') {
        return isAuthenticated();
    }

    // Fallback: check if user data exists in localStorage
    const userData = localStorage.getItem('user');
    return userData !== null && userData !== 'null';
}

/**
 * Update mobile cart count badge
 */
function updateMobileCartCount() {
    const mobileCartBadge = document.getElementById('mobile-cart-count');
    const desktopCartBadge = document.getElementById('cart-count');

    if (mobileCartBadge && desktopCartBadge) {
        // Sync with desktop cart count
        mobileCartBadge.textContent = desktopCartBadge.textContent;

        // Hide badge if count is 0
        const count = parseInt(desktopCartBadge.textContent) || 0;
        if (count === 0) {
            mobileCartBadge.style.display = 'none';
        } else {
            mobileCartBadge.style.display = 'flex';
        }
    }
}

/**
 * Set active tab based on current page URL
 */
function setActiveTab() {
    const currentPath = window.location.pathname;
    const tabItems = document.querySelectorAll('.mobile-bottom-tab-bar .tab-item');

    tabItems.forEach(tab => {
        tab.classList.remove('active');

        // Check if tab href matches current path
        const href = tab.getAttribute('href');
        if (href && currentPath.includes(href) && href !== '#') {
            tab.classList.add('active');
        }
    });

    // Default to home tab if no match
    const activeTab = document.querySelector('.mobile-bottom-tab-bar .tab-item.active');
    if (!activeTab) {
        const homeTab = document.querySelector('.mobile-bottom-tab-bar .tab-item[data-tab="home"]');
        if (homeTab) {
            homeTab.classList.add('active');
        }
    }
}

/**
 * Public function to update cart count from external code
 */
window.updateMobileCartCount = updateMobileCartCount;

/**
 * Listen for cart updates from desktop cart
 */
if (typeof MutationObserver !== 'undefined') {
    const desktopCartBadge = document.getElementById('cart-count');
    if (desktopCartBadge) {
        const observer = new MutationObserver(function(mutations) {
            updateMobileCartCount();
        });

        observer.observe(desktopCartBadge, {
            childList: true,
            characterData: true,
            subtree: true
        });
    }
}
