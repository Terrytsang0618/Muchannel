// Authentication UI Handler
// Manages header menu display based on user authentication state

(function() {
    'use strict';

    console.log('🎨 [AUTH-UI] Authentication UI Handler loaded');

    // Update header menu based on authentication status
    async function updateHeaderMenu() {
        console.log('🔄 [AUTH-UI] Updating header menu...');

        try {
            // Check if user is authenticated
            const user = await API.auth.getCurrentUser();

            console.log('✅ [AUTH-UI] User is authenticated:', user.username);

            // User is logged in - show user menu items
            showElement('user-profile-link');
            showElement('user-orders-link');
            showElement('user-wishlist-link');
            showElement('user-settings-link');
            showElement('user-logout-link');

            // Hide auth links
            hideElement('auth-login-link');
            hideElement('auth-register-link');

        } catch (error) {
            console.log('❌ [AUTH-UI] User is not authenticated (anonymous)');

            // User is not logged in - show login/register links
            showElement('auth-login-link');
            showElement('auth-register-link');

            // Hide user menu items
            hideElement('user-profile-link');
            hideElement('user-orders-link');
            hideElement('user-wishlist-link');
            hideElement('user-settings-link');
            hideElement('user-logout-link');
        }
    }

    // Helper function to show element
    function showElement(id) {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = '';  // Remove inline style to use default
            element.classList.remove('hidden');
        }
    }

    // Helper function to hide element
    function hideElement(id) {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
            element.classList.add('hidden');
        }
    }

    // Handle logout
    window.handleLogout = async function() {
        console.log('🚪 [AUTH-UI] Logout initiated...');

        try {
            await API.auth.logout();

            console.log('✅ [AUTH-UI] Logout successful');

            // Show notification
            if (typeof showNotification === 'function') {
                showNotification('Logged out successfully', 'success');
            }

            // Reload page immediately after showing notification
            setTimeout(() => {
                window.location.reload();
            }, 500);

        } catch (error) {
            console.error('❌ [AUTH-UI] Logout failed:', error);

            if (typeof showNotification === 'function') {
                showNotification('Logout failed. Please try again.', 'error');
            }
        }
    };

    // Handle authentication required actions (e.g., add to cart when not logged in)
    window.requireAuth = function(callback) {
        // Check if user is authenticated
        API.auth.getCurrentUser()
            .then(user => {
                // User is authenticated, execute callback
                if (typeof callback === 'function') {
                    callback();
                }
            })
            .catch(error => {
                // User is not authenticated, show login modal
                console.log('🔒 [AUTH-UI] Authentication required');
                if (typeof openAuthModal === 'function') {
                    openAuthModal('login');
                } else {
                    if (typeof showNotification === 'function') {
                        showNotification('Please login to continue', 'error');
                    }
                }
            });
    };

    // Listen for session expired event
    window.addEventListener('auth:session-expired', function() {
        console.warn('⏰ [AUTH-UI] Session expired - showing login modal');

        if (typeof showNotification === 'function') {
            showNotification('Your session has expired. Please log in again.', 'error');
        }

        if (typeof openAuthModal === 'function') {
            openAuthModal('login');
        }
    });

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🚀 [AUTH-UI] DOM loaded - initializing header menu...');
        updateHeaderMenu();
    });

    // Export functions for global use
    window.updateHeaderMenu = updateHeaderMenu;

})();
