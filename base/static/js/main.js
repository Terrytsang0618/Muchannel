// Main JavaScript file for the K-pop Store

// ===== UI Functions =====

// Artists Sidebar Toggle
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
    try {
        await API.cart.addItem(productId, 1);
        await updateCartCount();
        showNotification('Product added to cart!', 'success');
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Please login to add items to cart', 'error');
    }
}

// ===== Notification Function =====

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    } text-white`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
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
                    <span class="text-xl font-bold text-purple-600">$${product.price}</span>
                    <button onclick="addToCart(${product.id})" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
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
            link.classList.add('bg-blue-700');
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
