# K-pop Store API

This folder contains all API-related code for the K-pop Store ecommerce application.

## Structure

```
api/
├── __init__.py          # Package initialization
├── serializers.py       # DRF serializers for all models
├── views.py            # DRF ViewSets (API endpoints logic)
├── urls.py             # API URL routing
└── README.md           # This file
```

## Files Overview

### serializers.py
Contains DRF serializers for converting model instances to JSON and vice versa:
- `CategorySerializer` - Category data serialization
- `ProductListSerializer` - Product list view (minimal fields)
- `ProductDetailSerializer` - Product detail view (all fields + ratings)
- `ArtistSerializer` - Artist/Group data with product count
- `CartItemSerializer` - Shopping cart items
- `OrderSerializer` - Customer orders with items
- `ReviewSerializer` - Product reviews

### views.py
Contains DRF ViewSets defining API endpoint behavior:
- `CategoryViewSet` - CRUD operations for categories
- `ProductViewSet` - CRUD operations for products with custom actions:
  - `/featured/` - Get featured products
  - `/trending/` - Get trending products
  - `/albums/` - Get all albums
- `ArtistViewSet` - CRUD operations for artists with:
  - `/{slug}/products/` - Get all products by artist
- `CartViewSet` - Shopping cart management:
  - `/total/` - Get cart total
  - `/clear/` - Clear all cart items
- `OrderViewSet` - Order management
- `ReviewViewSet` - Product review operations

### urls.py
Defines API URL patterns using Django REST Framework's DefaultRouter:
- `/categories/` - Category endpoints
- `/products/` - Product endpoints
- `/artists/` - Artist endpoints
- `/cart/` - Shopping cart endpoints
- `/orders/` - Order endpoints
- `/reviews/` - Review endpoints

## API Endpoints

Base URL: `http://127.0.0.1:8000/api/`

### Categories
- `GET /api/categories/` - List all categories
- `POST /api/categories/` - Create category
- `GET /api/categories/{slug}/` - Get category detail
- `PUT /api/categories/{slug}/` - Update category
- `DELETE /api/categories/{slug}/` - Delete category

### Products
- `GET /api/products/` - List all products (paginated)
- `GET /api/products/featured/` - Get featured products
- `GET /api/products/trending/` - Get trending products
- `GET /api/products/albums/` - Get all albums
- `GET /api/products/{slug}/` - Get product detail
- `POST /api/products/` - Create product
- `PUT /api/products/{slug}/` - Update product
- `DELETE /api/products/{slug}/` - Delete product

#### Filtering & Search
- `?search=query` - Search products by title, description, artist
- `?product_type=album` - Filter by product type
- `?category=1` - Filter by category
- `?artist=BLACKPINK` - Filter by artist
- `?ordering=-created_at` - Order by field

### Artists
- `GET /api/artists/` - List all artists
- `GET /api/artists/{slug}/` - Get artist detail
- `GET /api/artists/{slug}/products/` - Get all products by artist
- `POST /api/artists/` - Create artist
- `PUT /api/artists/{slug}/` - Update artist
- `DELETE /api/artists/{slug}/` - Delete artist

### Cart (Requires Authentication)
- `GET /api/cart/` - Get user's cart items
- `POST /api/cart/` - Add item to cart
- `GET /api/cart/total/` - Get cart total
- `PATCH /api/cart/{id}/` - Update cart item quantity
- `DELETE /api/cart/{id}/` - Remove item from cart
- `DELETE /api/cart/clear/` - Clear entire cart

### Orders (Requires Authentication)
- `GET /api/orders/` - List user's orders
- `POST /api/orders/` - Create order
- `GET /api/orders/{id}/` - Get order detail

### Reviews
- `GET /api/reviews/` - List all reviews
- `GET /api/reviews/?product_id=1` - Get reviews for product
- `POST /api/reviews/` - Create review (requires auth)
- `GET /api/reviews/{id}/` - Get review detail
- `PUT /api/reviews/{id}/` - Update review
- `DELETE /api/reviews/{id}/` - Delete review

## Permissions

- **Public (Read-Only)**: Products, Categories, Artists, Reviews (list/detail)
- **Authenticated Required**: Cart, Orders, Creating Reviews
- **Admin Only**: Creating/Updating/Deleting Products, Categories, Artists

## Pagination

- Default page size: 12 items per page
- Use `?page=2` to get next page
- Response includes: `count`, `next`, `previous`, `results`

## Example Usage

### JavaScript (Axios)
```javascript
// Get featured products
const products = await axios.get('http://127.0.0.1:8000/api/products/featured/');

// Search products
const results = await axios.get('http://127.0.0.1:8000/api/products/?search=BLACKPINK');

// Add to cart
await axios.post('http://127.0.0.1:8000/api/cart/', {
    product_id: 1,
    quantity: 1
});
```

### Python (requests)
```python
import requests

# Get all artists
response = requests.get('http://127.0.0.1:8000/api/artists/')
artists = response.json()

# Get product detail
response = requests.get('http://127.0.0.1:8000/api/products/born-pink/')
product = response.json()
```

## Testing

You can test the API using:
1. **DRF Browsable API**: Visit endpoints in browser (e.g., `http://127.0.0.1:8000/api/products/`)
2. **Postman/Insomnia**: Import API endpoints
3. **curl**: Command-line testing
```bash
curl http://127.0.0.1:8000/api/products/
```

## Notes

- All timestamps are in UTC
- Slugs are used for user-friendly URLs
- CORS is enabled for development (configured in settings.py)
- API follows REST conventions
