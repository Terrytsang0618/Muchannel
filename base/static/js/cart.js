// Cart Management JavaScript for K-pop Store
// Handles cart page operations: load, update, remove, clear

// Global cart state
let cartItems = [];
let cartTotal = 0;

/**
 * Load cart items from API and display them
 */
async function loadCart() {
    console.log('📦 Loading cart...');
    const loadingEl = document.getElementById('cart-loading');
    const emptyCartEl = document.getElementById('empty-cart');
    const cartContentEl = document.getElementById('cart-content');

    try {
        // Show loading state
        loadingEl.style.display = 'block';
        emptyCartEl.style.display = 'none';
        cartContentEl.style.display = 'none';

        // Fetch cart items from API
        const response = await API.cart.getItems();
        cartItems = response.results || response || [];

        console.log('✅ Cart loaded:', cartItems.length, 'items');

        // Hide loading
        loadingEl.style.display = 'none';

        // Check if cart is empty
        if (cartItems.length === 0) {
            emptyCartEl.style.display = 'block';
            return;
        }

        // Display cart items
        displayCartItems();
        updateCartSummary();
        cartContentEl.style.display = 'block';

    } catch (error) {
        console.error('❌ Error loading cart:', error);
        loadingEl.style.display = 'none';

        // Check if it's an authentication error
        if (error.response?.status === 401) {
            showAuthRequiredMessage();
        } else {
            showErrorMessage('Failed to load cart. Please try again.');
        }
    }
}

/**
 * Display cart items in the table
 */
function displayCartItems() {
    const cartItemsContainer = document.getElementById('cart-items');
    cartItemsContainer.innerHTML = '';

    cartItems.forEach(item => {
        const row = createCartItemRow(item);
        cartItemsContainer.appendChild(row);
    });
}

/**
 * Create a table row for a cart item
 */
function createCartItemRow(item) {
    const tr = document.createElement('tr');
    tr.setAttribute('data-cart-item-id', item.id);

    const product = item.product;
    // ProductListSerializer provides primary_image as a single URL string
    const imageUrl = product.primary_image || '/static/assets/images/placeholder.jpg';

    tr.innerHTML = `
        <td class="cart-product-remove">
            <a href="javascript:void(0)" onclick="removeCartItem(${item.id})">
                <i class="fa fa-times"></i>
            </a>
        </td>
        <td class="cart-product-thumbnail">
            <a href="/products/${product.slug}/">
                <img src="${imageUrl}" alt="${product.title}">
            </a>
        </td>
        <td class="cart-product-description">
            <p>
                <span><strong>${product.title}</strong></span>
                <span>Artist: ${product.artist_name || 'Unknown'}</span>
                <span>Type: ${product.product_type || 'Product'}</span>
                ${product.version ? `<span>Version: ${product.version}</span>` : ''}
            </p>
        </td>
        <td class="cart-product-price">
            <span class="amount">$${parseFloat(product.price).toFixed(2)}</span>
        </td>
        <td class="cart-product-quantity">
            <div class="quantity">
                <input type="button" class="minus" value="-" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">
                <input type="text" class="qty" value="${item.quantity}" readonly>
                <input type="button" class="plus" value="+" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">
            </div>
        </td>
        <td class="cart-product-subtotal">
            <span class="amount">$${parseFloat(item.total_price).toFixed(2)}</span>
        </td>
    `;

    return tr;
}

/**
 * Update item quantity
 */
async function updateQuantity(cartItemId, newQuantity) {
    // Validate quantity
    if (newQuantity < 1) {
        if (confirm('Remove this item from cart?')) {
            await removeCartItem(cartItemId);
        }
        return;
    }

    console.log(`📝 Updating cart item ${cartItemId} to quantity ${newQuantity}`);

    try {
        // Show loading indicator on the row
        const row = document.querySelector(`tr[data-cart-item-id="${cartItemId}"]`);
        if (row) {
            row.style.opacity = '0.5';
        }

        // Update via API
        const updatedItem = await API.cart.updateItem(cartItemId, newQuantity);
        console.log('✅ Quantity updated:', updatedItem);

        // Update local state
        const itemIndex = cartItems.findIndex(item => item.id === cartItemId);
        if (itemIndex !== -1) {
            cartItems[itemIndex] = updatedItem;
        }

        // Refresh display
        displayCartItems();
        updateCartSummary();
        updateCartBadge();

    } catch (error) {
        console.error('❌ Error updating quantity:', error);
        showErrorMessage('Failed to update quantity. Please try again.');

        // Reload cart to reset to correct state
        await loadCart();
    }
}

/**
 * Remove item from cart
 */
async function removeCartItem(cartItemId) {
    console.log(`🗑️ Removing cart item ${cartItemId}`);

    try {
        // Show loading indicator
        const row = document.querySelector(`tr[data-cart-item-id="${cartItemId}"]`);
        if (row) {
            row.style.opacity = '0.5';
        }

        // Remove via API
        await API.cart.removeItem(cartItemId);
        console.log('✅ Item removed from cart');

        // Update local state
        cartItems = cartItems.filter(item => item.id !== cartItemId);

        // Refresh display
        if (cartItems.length === 0) {
            document.getElementById('cart-content').style.display = 'none';
            document.getElementById('empty-cart').style.display = 'block';
        } else {
            displayCartItems();
            updateCartSummary();
        }

        updateCartBadge();
        showSuccessMessage('Item removed from cart');

    } catch (error) {
        console.error('❌ Error removing item:', error);
        showErrorMessage('Failed to remove item. Please try again.');

        // Reload cart to reset to correct state
        await loadCart();
    }
}

/**
 * Clear all items from cart
 */
async function clearCart() {
    if (!confirm('Are you sure you want to clear your entire cart?')) {
        return;
    }

    console.log('🗑️ Clearing cart...');

    try {
        // Clear via API
        await API.cart.clear();
        console.log('✅ Cart cleared');

        // Update local state
        cartItems = [];

        // Show empty cart
        document.getElementById('cart-content').style.display = 'none';
        document.getElementById('empty-cart').style.display = 'block';

        updateCartBadge();
        showSuccessMessage('Cart cleared successfully');

    } catch (error) {
        console.error('❌ Error clearing cart:', error);
        showErrorMessage('Failed to clear cart. Please try again.');
    }
}

/**
 * Update cart summary (subtotal and total)
 */
function updateCartSummary() {
    // Calculate subtotal
    const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
    cartTotal = subtotal; // For now, total = subtotal (no taxes/shipping)

    // Update display
    document.getElementById('cart-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('cart-total').textContent = `$${cartTotal.toFixed(2)}`;

    console.log('💰 Cart summary updated - Total:', cartTotal);
}

/**
 * Update cart badge in header (both desktop and mobile)
 * Shows the number of DISTINCT products, not total quantity
 */
function updateCartBadge() {
    // Count number of distinct products (not total quantity)
    const itemCount = cartItems.length;

    // Update desktop cart badge
    const badge = document.getElementById('cart-count');
    if (badge) {
        badge.textContent = itemCount;
        badge.style.display = itemCount > 0 ? 'inline-block' : 'none';
    }

    // Update mobile cart badge
    const mobileBadge = document.getElementById('mobile-cart-count');
    if (mobileBadge) {
        mobileBadge.textContent = itemCount;
        mobileBadge.style.display = itemCount > 0 ? 'flex' : 'none';
    }

    console.log('🔄 Cart badge updated:', itemCount, 'distinct products');
}

/**
 * Proceed to checkout
 */
function proceedToCheckout() {
    if (cartItems.length === 0) {
        showErrorMessage('Your cart is empty');
        return;
    }

    // TODO: Implement checkout page
    alert('Checkout functionality coming soon!\n\n' +
          `You have ${cartItems.length} items totaling $${cartTotal.toFixed(2)}`);

    // For now, redirect to home
    // window.location.href = '/checkout/';
}

/**
 * Show authentication required message
 */
function showAuthRequiredMessage() {
    const emptyCartEl = document.getElementById('empty-cart');
    emptyCartEl.innerHTML = `
        <div class="empty-cart">
            <i class="fas fa-lock"></i>
            <h3>Authentication Required</h3>
            <p class="text-muted">Please log in to view your shopping cart</p>
            <button class="btn btn-primary mt-3" onclick="showLoginModal()">
                <i class="fas fa-sign-in-alt me-2"></i>Log In
            </button>
        </div>
    `;
    emptyCartEl.style.display = 'block';
}

/**
 * Show success message
 */
function showSuccessMessage(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 end-0 mt-3 me-3';
    toast.style.zIndex = '9999';
    toast.style.minWidth = '300px';
    toast.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

/**
 * Show error message
 */
function showErrorMessage(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 end-0 mt-3 me-3';
    toast.style.zIndex = '9999';
    toast.style.minWidth = '300px';
    toast.innerHTML = `
        <i class="fas fa-exclamation-circle me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(toast);

    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// Export functions for use in HTML onclick attributes
window.loadCart = loadCart;
window.updateQuantity = updateQuantity;
window.removeCartItem = removeCartItem;
window.clearCart = clearCart;
window.proceedToCheckout = proceedToCheckout;
