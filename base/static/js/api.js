// API Service Module for K-pop Store
// Base API URL
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Configure Axios defaults
axios.defaults.withCredentials = true; // Enable sending cookies with requests
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';

// API Service Object
const API = {
    // Authentication
    auth: {
        register: async (userData) => {
            const response = await axios.post(`${API_BASE_URL}/auth/register/`, userData);
            return response.data;
        },

        login: async (username, password) => {
            const response = await axios.post(`${API_BASE_URL}/auth/login/`, {
                username,
                password
            });
            return response.data;
        },

        logout: async () => {
            const response = await axios.post(`${API_BASE_URL}/auth/logout/`);
            return response.data;
        },

        refresh: async () => {
            const response = await axios.post(`${API_BASE_URL}/auth/refresh/`);
            return response.data;
        },

        getCurrentUser: async () => {
            const response = await axios.get(`${API_BASE_URL}/auth/me/`);
            return response.data;
        }
    },

    // Products
    products: {
        getAll: async (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            const url = `${API_BASE_URL}/products/?${queryString}`;
            const response = await axios.get(url);
            return response.data;
        },

        getFeatured: async () => {
            const response = await axios.get(`${API_BASE_URL}/products/featured/`);
            return response.data;
        },

        getTrending: async () => {
            const response = await axios.get(`${API_BASE_URL}/products/trending/`);
            return response.data;
        },

        getAlbums: async () => {
            const response = await axios.get(`${API_BASE_URL}/products/albums/`);
            return response.data;
        },

        getById: async (slug) => {
            const response = await axios.get(`${API_BASE_URL}/products/${slug}/`);
            return response.data;
        },

        search: async (query) => {
            const response = await axios.get(`${API_BASE_URL}/products/?search=${query}`);
            return response.data;
        }
    },

    // Artists
    artists: {
        getAll: async () => {
            const response = await axios.get(`${API_BASE_URL}/artists/`);
            return response.data;
        },

        getById: async (slug) => {
            const response = await axios.get(`${API_BASE_URL}/artists/${slug}/`);
            return response.data;
        },

        getProducts: async (slug) => {
            const response = await axios.get(`${API_BASE_URL}/artists/${slug}/products/`);
            return response.data;
        }
    },

    // Categories
    categories: {
        getAll: async () => {
            const response = await axios.get(`${API_BASE_URL}/categories/`);
            return response.data;
        },

        getById: async (slug) => {
            const response = await axios.get(`${API_BASE_URL}/categories/${slug}/`);
            return response.data;
        }
    },

    // Cart
    cart: {
        getItems: async () => {
            const response = await axios.get(`${API_BASE_URL}/cart/`);
            return response.data;
        },

        addItem: async (productId, quantity = 1) => {
            const response = await axios.post(`${API_BASE_URL}/cart/`, {
                product_id: productId,
                quantity: quantity
            });
            return response.data;
        },

        updateItem: async (cartItemId, quantity) => {
            const response = await axios.patch(`${API_BASE_URL}/cart/${cartItemId}/`, {
                quantity: quantity
            });
            return response.data;
        },

        removeItem: async (cartItemId) => {
            const response = await axios.delete(`${API_BASE_URL}/cart/${cartItemId}/`);
            return response.data;
        },

        getTotal: async () => {
            const response = await axios.get(`${API_BASE_URL}/cart/total/`);
            return response.data;
        },

        clear: async () => {
            const response = await axios.delete(`${API_BASE_URL}/cart/clear/`);
            return response.data;
        }
    },

    // Orders
    orders: {
        getAll: async () => {
            const response = await axios.get(`${API_BASE_URL}/orders/`);
            return response.data;
        },

        create: async (orderData) => {
            const response = await axios.post(`${API_BASE_URL}/orders/`, orderData);
            return response.data;
        },

        getById: async (orderId) => {
            const response = await axios.get(`${API_BASE_URL}/orders/${orderId}/`);
            return response.data;
        }
    },

    // Reviews
    reviews: {
        getByProduct: async (productId) => {
            const response = await axios.get(`${API_BASE_URL}/reviews/?product_id=${productId}`);
            return response.data;
        },

        create: async (reviewData) => {
            const response = await axios.post(`${API_BASE_URL}/reviews/`, reviewData);
            return response.data;
        }
    }
};

// Error handler for API calls with automatic token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

axios.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // If already refreshing, queue this request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    return axios(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Try to refresh the token
                await axios.post(`${API_BASE_URL}/auth/refresh/`);
                processQueue(null);
                return axios(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                // Redirect to login page or show login modal
                if (window.location.pathname !== '/login') {
                    console.log('Session expired. Please log in again.');
                    // You can dispatch an event here to show a login modal
                    window.dispatchEvent(new CustomEvent('auth:session-expired'));
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);
