// Main JavaScript file for the K-pop Store

// ===== UI Functions =====

// Sidebar Toggle
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (sidebar && overlay) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');

        // Prevent body scroll when sidebar is open
        if (sidebar.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
}

// Toggle Sidebar Item (Collapsible menu items)
function toggleSidebarItem(element) {
    const submenu = element.nextElementSibling;

    if (submenu && submenu.classList.contains('sidebar-submenu')) {
        element.classList.toggle('active');
        submenu.classList.toggle('active');
    }
}

// Close sidebar
function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (sidebar && overlay) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Show loading spinner
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="flex justify-center items-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        `;
    }
}

// ===== Cart Functions =====

async function updateCartCount() {
    try {
        const cartData = await API.cart.getTotal();
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            cartCount.textContent = cartData.items_count || 0;
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

async function addToCart(productId) {
    // Check if user is authenticated first
    try {
        await API.auth.getCurrentUser();

        // User is authenticated, proceed with adding to cart
        try {
            await API.cart.addItem(productId, 1);
            await updateCartCount();
            showNotification('Product added to cart!', 'success');
        } catch (error) {
            console.error('Error adding to cart:', error);
            showNotification('Failed to add item to cart. Please try again.', 'error');
        }
    } catch (error) {
        // User is not authenticated, show login modal
        console.log('User not authenticated, showing login modal');
        showNotification('Please login to add items to cart', 'error');

        if (typeof openAuthModal === 'function') {
            openAuthModal('login');
        }
    }
}

// ===== Notification Function =====

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');

    // Set background color and icon based on type
    let bgColor, borderColor, icon;
    if (type === 'success') {
        bgColor = '#28a745'; // Green
        borderColor = '#218838';
        icon = '<i class="icon-check" style="margin-right: 8px;"></i>';
    } else if (type === 'error') {
        bgColor = '#dc3545'; // Red
        borderColor = '#c82333';
        icon = '<i class="icon-close" style="margin-right: 8px;"></i>';
    } else {
        bgColor = '#343a40'; // Gray
        borderColor = '#23272b';
        icon = '<i class="icon-info" style="margin-right: 8px;"></i>';
    }

    // Apply inline styles for guaranteed visibility with responsive sizing
    const isMobile = window.innerWidth <= 576;
    notification.style.cssText = `
        position: fixed;
        top: ${isMobile ? '60px' : '80px'};
        right: ${isMobile ? '10px' : '20px'};
        left: ${isMobile ? '10px' : 'auto'};
        background-color: ${bgColor};
        color: #ffffff;
        padding: ${isMobile ? '12px 15px' : '15px 20px'};
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 99999;
        min-width: ${isMobile ? 'auto' : '250px'};
        max-width: ${isMobile ? 'calc(100% - 20px)' : '400px'};
        font-size: ${isMobile ? '13px' : '14px'};
        font-weight: 500;
        opacity: 0;
        transform: translateX(400px);
        transition: all 0.3s ease-in-out;
        border-left: 4px solid ${borderColor};
        display: flex;
        align-items: center;
    `;

    notification.innerHTML = icon + message;
    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 10);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(400px)';

        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// ===== Search Functionality =====

async function handleSearch(event) {
    if (event.key === 'Enter') {
        const searchTerm = event.target.value;
        if (searchTerm.trim()) {
            try {
                const results = await API.products.search(searchTerm);
                displaySearchResults(results);
            } catch (error) {
                console.error('Search error:', error);
            }
        }
    }
}

function displaySearchResults(results) {
    console.log('Search results:', results);
    // You can implement custom search results display here
}

// ===== Data Rendering Functions =====

function renderProductCard(product) {
    const gradients = [
        'from-purple-400 to-pink-500',
        'from-blue-400 to-indigo-500',
        'from-pink-400 to-rose-500',
        'from-green-400 to-emerald-500',
        'from-yellow-400 to-orange-500'
    ];

    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

    return `
        <div class="bg-white rounded-lg shadow overflow-hidden card-hover">
            <div class="h-48 bg-gradient-to-br ${randomGradient} flex items-center justify-center">
                ${product.image_url
                    ? `<img src="${product.image_url}" alt="${product.title}" class="w-full h-full object-cover">`
                    : `<i class="fas fa-compact-disc text-white text-5xl opacity-50"></i>`
                }
            </div>
            <div class="p-4">
                <h3 class="font-bold text-lg text-gray-800 mb-1">${product.title}</h3>
                <p class="text-gray-500 text-sm mb-2">${product.artist || 'Various Artists'}</p>
                <p class="text-gray-600 text-xs mb-3">${product.product_type}</p>
                <div class="flex items-center justify-between">
                    <span class="text-xl font-bold text-gray-800">$${product.price}</span>
                    <button onclick="addToCart(${product.id})" class="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition">
                        <i class="fas fa-shopping-cart mr-1"></i>
                        Add
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderArtistCard(artist) {
    const gradients = [
        'from-purple-400 to-pink-500',
        'from-pink-400 to-rose-500',
        'from-blue-400 to-indigo-500'
    ];

    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

    return `
        <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center space-x-4 mb-4">
                <div class="w-16 h-16 bg-gradient-to-br ${randomGradient} rounded-lg flex items-center justify-center">
                    <i class="fas fa-star text-white text-2xl"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-800">${artist.name}</h3>
                    <p class="text-gray-500 text-sm">${artist.product_count || 0} products</p>
                </div>
            </div>
            <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Company:</span>
                <span class="font-bold text-gray-800">${artist.company || 'N/A'}</span>
            </div>
        </div>
    `;
}

// ===== Page Load Functions =====

async function loadFeaturedProducts() {
    try {
        showLoading('featured-products');
        const products = await API.products.getFeatured();
        const container = document.getElementById('featured-products');

        if (container && products.length > 0) {
            container.innerHTML = products.slice(0, 4).map(product => renderProductCard(product)).join('');
        }
    } catch (error) {
        console.error('Error loading featured products:', error);
    }
}

async function loadPopularArtists() {
    try {
        showLoading('popular-artists');
        const artistsData = await API.artists.getAll();
        const artists = artistsData.results || artistsData;
        const container = document.getElementById('popular-artists');

        if (container && artists.length > 0) {
            container.innerHTML = artists.slice(0, 3).map(artist => renderArtistCard(artist)).join('');
        }
    } catch (error) {
        console.error('Error loading artists:', error);
    }
}

async function loadStats() {
    try {
        // Load products count
        const productsData = await API.products.getAll();
        const totalProducts = productsData.count || 0;

        // Load artists count
        const artistsData = await API.artists.getAll();
        const totalArtists = artistsData.results?.length || artistsData.length || 0;

        // Update stats on page
        const albumsCount = document.getElementById('albums-count');
        const artistsCount = document.getElementById('artists-count');

        if (albumsCount) albumsCount.textContent = totalProducts;
        if (artistsCount) artistsCount.textContent = totalArtists;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// ===== Initialize on Page Load =====

document.addEventListener('DOMContentLoaded', async function() {
    console.log('K-pop Store loaded successfully');

    // Add active class to current navigation item
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('bg-gray-700');
        }
    });

    // Update cart count on page load
    await updateCartCount();

    // Load data if on home page
    if (currentPath === '/' || currentPath === '') {
        await loadFeaturedProducts();
        await loadPopularArtists();
        await loadStats();
    }
});
