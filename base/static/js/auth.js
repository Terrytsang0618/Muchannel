// Authentication UI Module
// Handles login, register, and user state

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        // Check if user is already authenticated
        await this.checkAuth();
        this.setupEventListeners();
    }

    async checkAuth() {
        try {
            this.currentUser = await API.auth.getCurrentUser();
            this.updateUI(true);
        } catch (error) {
            this.currentUser = null;
            this.updateUI(false);
        }
    }

    updateUI(isAuthenticated) {
        const userMenuEl = document.getElementById('user-menu');
        const authButtonsEl = document.getElementById('auth-buttons');

        if (isAuthenticated && this.currentUser) {
            // Show user menu, hide auth buttons
            if (userMenuEl) {
                userMenuEl.innerHTML = `
                    <div class="relative">
                        <button id="user-menu-button" class="flex items-center space-x-2 text-gray-700 hover:text-purple-600">
                            <i class="fas fa-user-circle text-2xl"></i>
                            <span class="font-medium">${this.currentUser.username}</span>
                            <i class="fas fa-chevron-down text-sm"></i>
                        </button>
                        <div id="user-dropdown" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                            <a href="/profile" class="block px-4 py-2 text-gray-700 hover:bg-purple-50">
                                <i class="fas fa-user mr-2"></i>Profile
                            </a>
                            <a href="/orders" class="block px-4 py-2 text-gray-700 hover:bg-purple-50">
                                <i class="fas fa-shopping-bag mr-2"></i>My Orders
                            </a>
                            <button id="logout-btn" class="w-full text-left px-4 py-2 text-gray-700 hover:bg-purple-50">
                                <i class="fas fa-sign-out-alt mr-2"></i>Logout
                            </button>
                        </div>
                    </div>
                `;
                this.setupUserMenuListeners();
            }

            if (authButtonsEl) {
                authButtonsEl.classList.add('hidden');
            }
        } else {
            // Show auth buttons, hide user menu
            if (userMenuEl) {
                userMenuEl.innerHTML = '';
            }

            if (authButtonsEl) {
                authButtonsEl.classList.remove('hidden');
            }
        }
    }

    setupEventListeners() {
        // Listen for session expired event
        window.addEventListener('auth:session-expired', () => {
            this.showLoginModal('Your session has expired. Please log in again.');
        });

        // Setup login/register button listeners
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');

        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLoginModal());
        }

        if (registerBtn) {
            registerBtn.addEventListener('click', () => this.showRegisterModal());
        }
    }

    setupUserMenuListeners() {
        const menuButton = document.getElementById('user-menu-button');
        const dropdown = document.getElementById('user-dropdown');
        const logoutBtn = document.getElementById('logout-btn');

        if (menuButton && dropdown) {
            menuButton.addEventListener('click', () => {
                dropdown.classList.toggle('hidden');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!menuButton.contains(e.target) && !dropdown.contains(e.target)) {
                    dropdown.classList.add('hidden');
                }
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async handleLogin(username, password) {
        try {
            const data = await API.auth.login(username, password);
            this.currentUser = data.user;
            this.updateUI(true);
            this.closeModal();
            showNotification('Login successful!', 'success');

            // Reload cart count
            if (typeof updateCartCount === 'function') {
                await updateCartCount();
            }
        } catch (error) {
            const message = error.response?.data?.error || 'Login failed. Please try again.';
            showNotification(message, 'error');
        }
    }

    async handleRegister(userData) {
        try {
            const data = await API.auth.register(userData);
            this.currentUser = data.user;
            this.updateUI(true);
            this.closeModal();
            showNotification('Registration successful! Welcome to K-pop Store!', 'success');

            // Reload cart count
            if (typeof updateCartCount === 'function') {
                await updateCartCount();
            }
        } catch (error) {
            const errors = error.response?.data;
            let message = 'Registration failed. Please try again.';

            if (errors) {
                message = Object.entries(errors)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                    .join('\n');
            }

            showNotification(message, 'error');
        }
    }

    async handleLogout() {
        try {
            await API.auth.logout();
            this.currentUser = null;
            this.updateUI(false);
            showNotification('Logged out successfully', 'success');

            // Reload cart count
            if (typeof updateCartCount === 'function') {
                await updateCartCount();
            }
        } catch (error) {
            showNotification('Logout failed', 'error');
        }
    }

    showLoginModal(message = '') {
        const modal = this.createModal('Login', `
            ${message ? `<p class="text-red-600 mb-4">${message}</p>` : ''}
            <form id="login-form" class="space-y-4">
                <div>
                    <label class="block text-gray-700 mb-2">Username</label>
                    <input type="text" name="username" required
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600">
                </div>
                <div>
                    <label class="block text-gray-700 mb-2">Password</label>
                    <input type="password" name="password" required
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600">
                </div>
                <button type="submit" class="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
                    Login
                </button>
            </form>
        `);

        const form = modal.querySelector('#login-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            await this.handleLogin(formData.get('username'), formData.get('password'));
        });
    }

    showRegisterModal() {
        const modal = this.createModal('Register', `
            <form id="register-form" class="space-y-4">
                <div>
                    <label class="block text-gray-700 mb-2">Username</label>
                    <input type="text" name="username" required
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600">
                </div>
                <div>
                    <label class="block text-gray-700 mb-2">Email</label>
                    <input type="email" name="email" required
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600">
                </div>
                <div>
                    <label class="block text-gray-700 mb-2">Password</label>
                    <input type="password" name="password" required
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600">
                </div>
                <div>
                    <label class="block text-gray-700 mb-2">Confirm Password</label>
                    <input type="password" name="password2" required
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600">
                </div>
                <button type="submit" class="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
                    Register
                </button>
            </form>
        `);

        const form = modal.querySelector('#register-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            await this.handleRegister({
                username: formData.get('username'),
                email: formData.get('email'),
                password: formData.get('password'),
                password2: formData.get('password2')
            });
        });
    }

    createModal(title, content) {
        // Remove existing modal if any
        this.closeModal();

        const modalHTML = `
            <div id="auth-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold text-gray-800">${title}</h2>
                        <button id="close-modal" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    ${content}
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('auth-modal');

        // Close modal on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        // Close modal on close button click
        const closeBtn = modal.querySelector('#close-modal');
        closeBtn.addEventListener('click', () => this.closeModal());

        return modal;
    }

    closeModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.remove();
        }
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getUser() {
        return this.currentUser;
    }
}

// Initialize auth manager when DOM is ready
let authManager;
document.addEventListener('DOMContentLoaded', () => {
    authManager = new AuthManager();
});
