# Muchannel - K-pop E-commerce Store

## Project Overview

**Muchannel** is a modern K-pop e-commerce platform built with Django REST Framework and designed to sell K-pop albums, merchandise, photocards, lightsticks, and other K-pop products. The platform features a RESTful API backend with JWT authentication and a responsive frontend.

**Primary Purpose**: E-commerce platform for K-pop merchandise with artist-focused product organization

**Tech Stack**:
- **Backend**: Django 5.2.8, Django REST Framework 3.15.2
- **Authentication**: JWT (djangorestframework-simplejwt 5.3.1)
- **Frontend**: HTML5, Tailwind CSS, JavaScript
- **Database**: SQLite3 (development), PostgreSQL-ready (production)
- **Additional**: django-filter, django-cors-headers, django-ckeditor-5

---

## 🤖 AI Assistant Guidelines

**IMPORTANT**: When working on this project:
- **DO NOT** create `.md` documentation files unless explicitly requested by the user
- Focus on code implementation and functionality
- Provide explanations directly in responses rather than creating documentation files
- Only create markdown files when the user specifically asks for documentation

---

## Project Structure

```
Muchannel/
├── base/                           # Django project root
│   ├── base/                       # Project configuration
│   │   ├── settings.py             # Django settings
│   │   ├── urls.py                 # Root URL routing
│   │   ├── wsgi.py                 # WSGI config
│   │   └── asgi.py                 # ASGI config
│   ├── ecommerce/                  # Main application
│   │   ├── models/                 # Database models (modular)
│   │   │   ├── products.py         # Product, Category, Artist, Review
│   │   │   └── orders.py           # Cart, Order, OrderItem
│   │   ├── api/                    # REST API (modular)
│   │   │   ├── api_views/          # ViewSets
│   │   │   │   ├── product_views.py
│   │   │   │   ├── cart_views.py
│   │   │   │   ├── order_views.py
│   │   │   │   ├── review_views.py
│   │   │   │   └── auth_views.py
│   │   │   ├── serializers/        # DRF Serializers
│   │   │   │   ├── product_serializers.py
│   │   │   │   ├── cart_serializers.py
│   │   │   │   ├── order_serializers.py
│   │   │   │   ├── review_serializers.py
│   │   │   │   └── auth_serializers.py
│   │   │   └── api_urls/           # API routing
│   │   ├── admin/                  # Django admin customization
│   │   │   ├── products.py
│   │   │   └── orders.py
│   │   ├── views/                  # Template views
│   │   │   └── views.py
│   │   ├── templates/              # HTML templates
│   │   │   ├── layout.html
│   │   │   ├── home.html
│   │   │   └── includes/           # Reusable components
│   │   ├── migrations/             # Database migrations
│   │   └── urls.py                 # App URL routing
│   ├── static/                     # Static files
│   │   ├── css/
│   │   ├── js/
│   │   └── assets/
│   ├── media/                      # User-uploaded files
│   │   ├── products/               # Product images
│   │   ├── artists/                # Artist images
│   │   └── categories/             # Category images
│   ├── manage.py                   # Django management
│   └── db.sqlite3                  # SQLite database
├── venv/                           # Virtual environment
└── requirements.txt                # Python dependencies
```

---

## Database Models

### Products Module (`ecommerce/models/products.py`)

#### Category
- Hierarchical categories with parent-child relationships
- Fields: `name`, `slug`, `description`, `icon`, `parent`, `display_order`, `image`
- Auto-generated upload path: `categories/{slug}/{filename}`

#### Artist
- K-pop artist/group information
- Fields: `name`, `slug`, `description`, `artist_type`, `debut_date`, `company`, `member_count`, `fandom_name`, `official_colors`
- Social media: `instagram_url`, `twitter_url`, `youtube_url`, `weverse_url`, `official_website`
- Images: `profile_image`, `banner_image`
- Upload paths: `artists/{slug}/profile/`, `artists/{slug}/banner/`

#### Product
- Main product model with K-pop specific features
- **Product Types**: album, photocard, lightstick, clothing, poster, seasongreeting, dvd, kithno, other
- **Pricing**: `original_price`, `price` (supports discounts)
- **Stock**: `stock`, `in_stock` (property)
- **Status Flags**: `is_featured`, `is_trending`, `is_new`, `is_active`
- **Pre-order**: `is_pre_order`, `pre_order_start_date`, `pre_order_end_date`, `expected_ship_date`
- **K-pop Features**: `includes_random_item`, `random_options`, `bonus_items`, `version`, `release_date`, `label`
- **Relationships**: ForeignKey to `Artist`, `Category`, `User` (created_by)
- **Computed Properties**: `in_stock`, `is_on_sale`, `discount_percentage`
- Upload path: `products/{artist_slug}/` or `products/no-artist/`

#### Review
- Product reviews with ratings
- Fields: `product`, `user`, `rating` (1-5), `comment`
- Constraint: Unique together (product, user) - one review per user per product

### Orders Module (`ecommerce/models/orders.py`)

#### Cart
- Shopping cart items
- Fields: `user`, `product`, `quantity`, `added_at`
- Property: `total_price` (product.price * quantity)
- Constraint: Unique together (user, product)

#### Order
- Customer orders
- Fields: `user`, `order_number`, `total_amount`, `status`, `created_at`, `updated_at`
- Status choices: pending, processing, completed, cancelled

#### OrderItem
- Order line items
- Fields: `order`, `product`, `quantity`, `price`
- Property: `total_price` (price * quantity)

---

## API Architecture

### Base URL
`/api/` - All API endpoints are prefixed with `/api/`

### Authentication
- **Type**: JWT (JSON Web Tokens) via cookies
- **Custom Authentication**: `CookieJWTAuthentication` class in `ecommerce/authentication.py`
- **Token Lifetime**: Access token (1 hour), Refresh token (7 days)

### Permissions System

**Custom Permission**: `ReadOnlyOrAuthenticatedPermission` (in `product_views.py`)
- **Anonymous users**: GET, HEAD, OPTIONS (read-only access)
- **Authenticated users**: All operations (POST, PUT, PATCH, DELETE)

**Applied to**:
- CategoryViewSet
- ProductViewSet
- ArtistViewSet

**Authentication Required**:
- CartViewSet
- OrderViewSet
- ReviewViewSet (for create/update/delete)

### API Endpoints

#### Authentication (`/api/auth/`)
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - Login (returns JWT in cookie)
- `POST /api/auth/logout/` - Logout (clears JWT cookie)
- `POST /api/auth/refresh/` - Refresh access token
- `GET /api/auth/me/` - Get current user info

#### Products (`/api/products/`)
- `GET /api/products/` - List products (paginated, 12/page)
- `GET /api/products/{slug}/` - Product detail
- `GET /api/products/featured/` - Featured products
- `GET /api/products/trending/` - Trending products
- `GET /api/products/albums/` - All albums
- `POST /api/products/` - Create product (auth required)
- `PUT/PATCH /api/products/{slug}/` - Update product (auth required)
- `DELETE /api/products/{slug}/` - Delete product (auth required)

**Filtering**:
- `?product_type=album` - Filter by type
- `?category=1` - Filter by category ID
- `?is_featured=true` - Featured products
- `?is_trending=true` - Trending products
- `?artist=1` - Filter by artist ID
- `?search=query` - Search title, description, artist name
- `?ordering=-created_at` - Order by field (use `-` for descending)

#### Artists (`/api/artists/`)
- `GET /api/artists/` - List artists
- `GET /api/artists/{slug}/` - Artist detail
- `GET /api/artists/{slug}/products/` - Products by artist
- `POST /api/artists/` - Create artist (auth required)
- `PUT/PATCH /api/artists/{slug}/` - Update artist (auth required)
- `DELETE /api/artists/{slug}/` - Delete artist (auth required)

#### Categories (`/api/categories/`)
- `GET /api/categories/` - List categories
- `GET /api/categories/{slug}/` - Category detail
- `POST /api/categories/` - Create category (auth required)
- `PUT/PATCH /api/categories/{slug}/` - Update category (auth required)
- `DELETE /api/categories/{slug}/` - Delete category (auth required)

#### Cart (`/api/cart/`) - **Auth Required**
- `GET /api/cart/` - User's cart items
- `POST /api/cart/` - Add to cart
- `PATCH /api/cart/{id}/` - Update quantity
- `DELETE /api/cart/{id}/` - Remove item
- `GET /api/cart/total/` - Cart total
- `DELETE /api/cart/clear/` - Clear cart

#### Orders (`/api/orders/`) - **Auth Required**
- `GET /api/orders/` - User's orders
- `POST /api/orders/` - Create order
- `GET /api/orders/{id}/` - Order detail

#### Reviews (`/api/reviews/`)
- `GET /api/reviews/` - List reviews
- `GET /api/reviews/?product={id}` - Product reviews
- `POST /api/reviews/` - Create review (auth required)
- `PUT/PATCH /api/reviews/{id}/` - Update review (auth required)
- `DELETE /api/reviews/{id}/` - Delete review (auth required)

---

## Development Guidelines

### Virtual Environment

**Always use the virtual environment**:
```bash
# Activate (Windows)
cd C:\Users\Terry\Documents\Terry\Muchannel
venv\Scripts\activate

# Activate (Unix/macOS)
source venv/bin/activate

# Run Django commands
cd base
python manage.py <command>
```

### Running the Server

```bash
cd base
../venv/Scripts/python.exe manage.py runserver
```

### Database Migrations

**After model changes**:
```bash
python manage.py makemigrations
python manage.py migrate
```

**Check for issues**:
```bash
python manage.py check
```

### Code Organization Principles

1. **Modular Structure**: Models, views, and serializers are split into separate files
2. **DRY Principle**: Don't repeat yourself - use base classes and inheritance
3. **Clear Naming**: Use descriptive names for variables, functions, and classes
4. **Separation of Concerns**: Business logic in models, API logic in views/serializers

### File Naming Conventions

- **Models**: `{domain}.py` (e.g., `products.py`, `orders.py`)
- **Views**: `{domain}_views.py` (e.g., `product_views.py`)
- **Serializers**: `{domain}_serializers.py`
- **Admin**: `{domain}.py` in admin folder
- **Templates**: `{page_name}.html` (lowercase with underscores)

### Import Order

Follow Django's recommended import order:
```python
# 1. Standard library imports
from datetime import datetime

# 2. Related third-party imports
from rest_framework import viewsets, filters
from django.db import models

# 3. Local application imports
from ecommerce.models import Product, Artist
from ecommerce.api.serializers import ProductSerializer
```

---

## Common Development Tasks

### Adding a New Model

1. Create/update model in `ecommerce/models/{domain}.py`
2. Import in `ecommerce/models/__init__.py`
3. Create serializer in `ecommerce/api/serializers/{domain}_serializers.py`
4. Create viewset in `ecommerce/api/api_views/{domain}_views.py`
5. Register in `ecommerce/api/api_urls/__init__.py`
6. Run migrations: `makemigrations` → `migrate`
7. Register in admin: `ecommerce/admin/{domain}.py`

### Adding a New API Endpoint

1. Add method/action to appropriate ViewSet
2. Use `@action` decorator for custom endpoints:
```python
from rest_framework.decorators import action

@action(detail=False, methods=['get'])
def custom_endpoint(self, request):
    # Your logic here
    return Response(data)
```

### Adding Filtering to API

```python
# In ViewSet
filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
filterset_fields = ['field1', 'field2']
search_fields = ['field1', 'field2__nested']
ordering_fields = ['field1', 'field2']
```

### File Upload Handling

**Model Field**:
```python
image = models.ImageField(upload_to=product_image_path, blank=True, null=True)

def product_image_path(instance, filename):
    return f'products/{instance.artist.slug}/{filename}'
```

**Settings Configuration**:
- `MEDIA_URL = '/media/'`
- `MEDIA_ROOT = BASE_DIR / 'media'`

---

## Key Features & Implementations

### Artist Relationship
- Products are linked to Artists via ForeignKey
- Artist products accessible via: `GET /api/artists/{slug}/products/`
- Product serializers include `artist_name` and `artist_slug`

### Price & Discount System
- Products have `original_price` and `price` fields
- Computed properties:
  - `is_on_sale`: Returns true if `original_price > price`
  - `discount_percentage`: Calculates percentage discount
- Serializers expose these properties automatically

### Pre-order Support
- Products have `is_pre_order` flag
- Date fields: `pre_order_start_date`, `pre_order_end_date`, `expected_ship_date`
- Frontend can display pre-order status and dates

### Random Items (Photocards)
- `includes_random_item`: Boolean flag
- `random_options`: Text description (e.g., "1 of 5 random photocards")
- Common for K-pop albums with random photocards

### Product Ratings
- Average rating calculated from Review model
- Review count included in product detail serializer
- Constraint: One review per user per product

---

## Frontend Integration

### Template Structure

**Base Layout**: `ecommerce/templates/layout.html`
- Header with search, cart, notifications
- Left sidebar navigation
- Main content area
- Mobile-responsive

**Components**: `ecommerce/templates/includes/`
- `header.html` - Top navigation bar
- `sidebar.html` - Left sidebar menu

**Pages**:
- `home.html` - Homepage with featured products
- `products/` - Product listing pages (to be created)

### Static Files

**CSS**: `static/css/styles.css`
- Custom styles and overrides
- Tailwind CSS via CDN

**JavaScript**: `static/js/main.js`
- `toggleSidebar()` - Mobile sidebar
- `addToCart()` - Cart functionality
- `handleSearch()` - Search handling

**Assets**: `static/assets/`
- Images, icons, plugins

---

## Testing Guidelines

### Manual API Testing

**Using DRF Browsable API**:
1. Visit: `http://127.0.0.1:8000/api/products/`
2. Use built-in forms to test POST/PUT/DELETE
3. View formatted JSON responses

**Using curl**:
```bash
# Get products
curl http://127.0.0.1:8000/api/products/

# Get artist products
curl http://127.0.0.1:8000/api/artists/blackpink/products/

# Search products
curl "http://127.0.0.1:8000/api/products/?search=album"
```

### Authentication Testing

**Login**:
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"pass"}'
```

**Authenticated Request**:
```bash
curl http://127.0.0.1:8000/api/cart/ \
  -H "Authorization: Bearer {access_token}"
```

---

## Important Notes

### Media Files
- Product images uploaded to: `media/products/{artist_slug}/`
- Artist images uploaded to: `media/artists/{slug}/profile/` and `media/artists/{slug}/banner/`
- Category images uploaded to: `media/categories/{slug}/`
- Ensure `MEDIA_ROOT` and `MEDIA_URL` are configured in settings

### CORS Configuration
- Currently allows all origins (development only)
- **Production**: Configure specific allowed origins in `settings.py`

### Security Considerations
- JWT tokens stored in HTTP-only cookies
- CSRF protection enabled
- Sensitive data in `.env` file (not in repo)
- User passwords hashed with Django's default hasher

### Performance
- Database indexes on: `slug`, `is_featured`, `is_active`, `is_trending`, `artist`
- Pagination set to 12 items per page
- Use `select_related()` and `prefetch_related()` for query optimization

---

## Troubleshooting

### Common Issues

**ModuleNotFoundError**: Ensure virtual environment is activated

**Template/Static Files Not Found**:
- Check `INSTALLED_APPS` includes `'ecommerce'`
- Verify `STATICFILES_DIRS` in settings
- Run `collectstatic` for production

**API Returns 403 Forbidden**:
- Check permission classes
- Ensure user is authenticated for protected endpoints
- Verify JWT token is valid

**Database Errors**:
- Run migrations: `python manage.py migrate`
- Check model field definitions
- Verify foreign key relationships exist

**CORS Errors**:
- Ensure `corsheaders` in `INSTALLED_APPS`
- Check `CORS_ALLOW_ALL_ORIGINS` setting
- Verify middleware order

---

## Next Development Steps

### Immediate Priorities
1. **Product Listing Page**: Frontend template for browsing products
2. **Product Detail Page**: Detailed product view with reviews
3. **Shopping Cart Page**: Cart management interface
4. **Checkout Flow**: Order creation and payment integration

### Future Enhancements
1. **Advanced Filtering**: Multi-select filters, price range, etc.
2. **Wishlist Feature**: Save products for later
3. **Product Variants**: Size/color options for merchandise
4. **Order Tracking**: Status updates and shipping tracking
5. **Admin Dashboard**: Enhanced product/order management
6. **Analytics**: Sales reports and product performance
7. **Payment Integration**: Stripe/PayPal integration
8. **Email Notifications**: Order confirmations, shipping updates

---

## Contact & Support

**Project Location**: `C:\Users\Terry\Documents\Terry\Muchannel`

**Key Files**:
- Settings: `base/base/settings.py`
- Root URLs: `base/base/urls.py`
- Models: `base/ecommerce/models/`
- API: `base/ecommerce/api/`
- Admin: `base/ecommerce/admin/`

**Documentation**:
- API README: `base/ecommerce/api/README.md`
- JWT Setup: `base/JWT_AUTHENTICATION_SETUP.md`
- Main README: `README.md`
- Theme Documentation: See "POLO Template Theme" section below

---

## POLO Template Theme - Available UI Components

The project includes the **POLO Multi-Purpose HTML5 Template** located in the `Template/` folder at the root level. This professional theme provides a comprehensive library of pre-built UI components, layouts, and design patterns that can be integrated into the Muchannel K-pop e-commerce platform.

### Theme Overview

**Template Name**: POLO - The Multi-Purpose HTML5 Template
**Location**: `C:\Users\Terry\Documents\Terry\Muchannel\Template\`
**Author**: INSPIRO
**Purpose**: Production-ready UI components and layouts for rapid development

**Key Resources**:
- **CSS Files**: `Template/css/` (plugins.css, style.css, theme.css)
- **JavaScript**: `Template/js/`
- **Images/Assets**: `Template/images/`
- **Documentation Pages**: 64 shortcode reference pages + demos

---

### E-Commerce Components (Shop Layouts)

#### Product Listing Pages
- **shop-columns-2.html** - 2-column product grid
- **shop-columns-3.html** - 3-column product grid (recommended for K-pop albums)
- **shop-columns-4.html** - 4-column product grid
- **shop-columns-5.html** - 5-column product grid
- **shop-columns-6.html** - 6-column product grid
- **shop-fullwidth.html** - Full-width shop layout
- **shop-wide.html** - Wide layout

#### Product Pages with Filtering
- **shop-sidebar-left.html** - Shop with left sidebar filters
- **shop-sidebar-right.html** - Shop with right sidebar filters
- **shop-sidebar-both.html** - Shop with both sidebars
- **shop-sidebar-sticky.html** - Shop with sticky sidebar
- **shop-load-more.html** - Load more pagination
- **shop-load-more-sidebar.html** - Load more with sidebar
- **shop-infinite-scroll.html** - Infinite scroll pagination
- **shop-no-page-title.html** - Shop without page title

#### Product Detail Pages
- **shop-single-product.html** - Standard product detail page
- **shop-single-product-sidebar-left.html** - Product page with left sidebar
- **shop-single-product-sidebar-right.html** - Product page with right sidebar
- **shop-single-product-sidebar-both.html** - Product page with both sidebars

#### Cart & Checkout
- **shop-cart.html** - Shopping cart page
- **shop-cart-empty.html** - Empty cart state
- **shop-checkout.html** - Checkout page with form
- **shop-checkout-completed.html** - Order confirmation page
- **shop-wishlist.html** - Wishlist page
- **shop-wishlist-empty.html** - Empty wishlist state

#### Shop Homepage Variants
- **home-shop.html** - Shop homepage v1
- **home-shop-v2.html** - Shop homepage v2
- **home-shop-v3.html** - Shop homepage v3
- **home-shop-v4.html** - Shop homepage v4

---

### Available UI Components (64 Shortcodes)

#### Navigation & Layout
1. **Accordions** (`shortcode-according.html`) - Collapsible content panels
2. **Breadcrumbs** (`shortcode-breadcrumbs.html`) - Navigation trails
3. **Dropdown** (`shortcode-dropdowns.html`) - Dropdown menus
4. **Grid System** (`shortcode-grid.html`) - Responsive grid layouts
5. **Navs** (`shortcode-navs.html`) - Navigation components (tabs, pills)
6. **Pagination** (`shortcode-paginations.html`) - Page navigation
7. **Tabs** (`shortcode-tabs.html`) - Tabbed content
8. **Sections** (`shortcode-sections.html`) - Page sections and containers

#### Content Display
9. **Carousel** (`shortcode-carousel.html`) - Image/content carousels
10. **Modal** (`shortcode-modal.html`) - Pop-up modals
11. **Modal Strip** (`shortcode-modal-strip.html`) - Modal variations
12. **Lightbox** (`shortcode-lightbox.html`) - Image lightbox
13. **Images** (`shortcode-images.html`) - Image styling and effects
14. **Background Images** (`shortcode-background-image.html`) - Full background images
15. **Background Overlays** (`shortcode-background-overlays.html`) - Image overlays
16. **Parallax** (`shortcode-parallax.html`) - Parallax scrolling effects
17. **Particles** (`shortcode-particles.html`) - Particle effects
18. **Video Background** (`shortcode-video-background.html`) - Video backgrounds
19. **Lazy Load** (`shortcode-lazyload.html`) - Lazy loading images
20. **Audio/Video** (`shortcode-audio-video.html`) - Media players

#### Typography & Text
21. **Typography** (`shortcode-typography.html`) - Text styles and formatting
22. **Heading Styles** (`shortcode-heading-styles.html`) - Header variations
23. **Blockquotes** (`shortcode-blockquotes.html`) - Quote styling
24. **Lists** (`shortcode-lists.html`) - Styled lists
25. **Text Rotator** (`shortcode-text-rotator.html`) - Rotating text animations
26. **Dropcat Highlight** (`shortcode-dropcat-highlight.html`) - Text highlighting
27. **Code** (`shortcode-code.html`) - Code blocks with syntax highlighting

#### Buttons & Forms
28. **Buttons** (`shortcode-buttons.html`) - Button styles and variations
29. **Forms** (`shortcode-forms.html`) - Form elements and styling
30. **Form Layouts** (`shortcode-form-layouts.html`) - Form layout patterns
31. **Form Validation** (`shortcode-form-validation.html`) - Client-side validation
32. **File Upload** (`shortcode-file-upload.html`) - File upload components
33. **Toggles** (`shortcode-toggles.html`) - Toggle switches and accordions

#### Alerts & Notifications
34. **Alerts** (`shortcode-alerts.html`) - Alert boxes and messages
35. **Popover** (`shortcode-popover.html`) - Popover tooltips
36. **Tooltips** (`shortcode-tooltips.html`) - Tooltip components
37. **Labels & Badges** (`shortcode-labels-badgets.html`) - Label and badge components

#### Interactive Elements
38. **Animations** (`shortcode-animations.html`) - CSS animations
39. **Smooth Scrolling** (`shortcode-smooth-scrolling.html`) - Smooth scroll behavior
40. **Countdown** (`shortcode-countdown.html`) - Countdown timers
41. **Countdown Timer** (`shortcode-countdown-timer.html`) - Timer variations
42. **Progress Bar** (`shortcode-progress-bar.html`) - Progress indicators
43. **Pie Chart** (`shortcode-pie-chart.html`) - Circular charts
44. **Counters** (`shortcode-counters.html`) - Animated counters
45. **Milestone Stats** (`shortcode-milestone-stats.html`) - Statistics displays
46. **Ratings** (`shortcode-ratings.html`) - Star ratings and reviews
47. **Spinners** (`shortcode-spinners.html`) - Loading spinners

#### Business Components
48. **Call to Action** (`shortcode-calltoaction.html`) - CTA sections
49. **Icon Boxes** (`shortcode-icon-boxes.html`) - Icon with text boxes
50. **Icon Lists** (`shortcode-icon-lists.html`) - Lists with icons
51. **Client Logo** (`shortcode-client-logo.html`) - Partner/client logos
52. **Pricing Table** (`shortcode-pricing-table.html`) - Pricing plans
53. **Team Members** (`shortcode-team-members.html`) - Team/artist profiles
54. **Testimonial** (`shortcode-testimonial.html`) - Customer testimonials/reviews
55. **Timeline** (`shortcode-timeline.html`) - Timeline components
56. **Social Icons** (`shortcode-social-icons.html`) - Social media icons

#### Advanced Components
57. **Tables** (`shortcode-tables.html`) - Data tables
58. **Panels** (`shortcode-panels.html`) - Content panels
59. **Textbox** (`shortcode-textbox.html`) - Text content boxes
60. **Maps** (`shortcode-maps.html`) - Google Maps integration
61. **Shape Dividers** (`shortcode-shape-dividers.html`) - Section dividers
62. **Responsive Utilities** (`shortcode-responsive-utilities.html`) - Responsive helpers
63. **Avatar** (`shortcode-avatar.html`) - User avatars and profile images
64. **Wizard** (`shortcode-wizard.html`) - Multi-step forms

---

### Advanced Components (Data & Interaction)

#### Data Components
Located in `Template/component-*.html` files:

**Datatables** (25+ variations):
- Basic datatable with sorting and search
- Advanced search and filtering
- Ajax data source
- Server-side processing
- Column rendering and visibility
- Responsive tables
- Row grouping and reordering
- Export buttons (Excel, PDF, CSV)
- Fixed headers and scrolling
- Inline editing (AutoFill, KeyTable)

**Charts & Visualization**:
- **Chart.js** (50+ chart types):
  - Line charts (basic, multi-axis, stacked)
  - Bar charts (vertical, horizontal, grouped, stacked)
  - Pie, doughnut, polar area charts
  - Radar and scatter charts
  - Bubble charts
  - Time-series charts
  - Custom tooltips and legends
- **AmCharts**: Advanced charts and maps
- **Morris.js**: Simple, clean charts

**Calendar**:
- Full calendar with events
- Google Calendar integration
- External events
- Background events
- List view

**Date/Time Pickers**:
- Date range picker
- DateTime picker
- Calendar picker

**Other Components**:
- Ion Range Slider - Range selection sliders
- Bootstrap Notify - Toast notifications
- Bootstrap Switch - Toggle switches
- Clipboard - Copy to clipboard functionality
- Toggles, Radio, Checkboxes - Custom form controls

---

### Header & Navigation Options

#### Header Variations (30+ styles)
- **Standard**: Light, dark, transparent, colored
- **Topbar**: With/without topbar, various styles
- **Logo Position**: Left, center, right
- **Menu Position**: Left, center, right
- **Modern Header**: Modern minimal styles
- **Fixed Behavior**: Always fixed, responsive fixed, disable fixed
- **Alternative Styles**: Mini header, alternative layouts

#### Menu Styles (20+ variations)
- **Basic**: Default, left, center, right
- **Styles**: Rounded, outline, creative, lines, dots
- **Dropdowns**: Classic, on-click, hover background
- **Special**: One-page menu, overlay menu, split menu
- **Button Style**: Menu as buttons
- **Lowercase**: Lowercase menu text
- **Social Icons**: Menu with social media integration

#### Footer Variations (8 styles)
- Standard footer layouts (footer-1 through footer-6)
- Dark footer
- Different column configurations
- Newsletter integration
- Social media sections

---

### Page Layouts & Templates

#### Blog Layouts (50+ variations)
- **Grid Layouts**: 1, 2, 3, 4 columns
- **Masonry Layouts**: 2, 3, 4 columns with masonry grid
- **Sidebar Options**: Left, right, both, no sidebar
- **Pagination**: Standard, load more, infinite scroll
- **Image Styles**: Left image, full image, no image
- **Post Formats**: Standard, audio, video, slider, creative
- **Filtering**: Category/tag filtering
- **Comments**: Standard, Disqus, Facebook comments

#### Portfolio/Gallery Pages (30+ layouts)
- **Grid Options**: 2, 3, 4, 5, 6 columns
- **Styles**: Standard, wide, fullwidth
- **Loading**: Infinite scroll, load more
- **Filtering**: Category filtering
- **Sidebar**: With/without sidebar

#### General Pages
- **About Pages**: Basic, extended, creative, me pages
- **Contact Pages**: Classic, advanced, map variations
- **Services Page**: Service listings
- **Team Page**: Team member profiles
- **FAQ Page**: Frequently asked questions
- **Clients Page**: Client/partner showcase
- **Pricing**: Pricing table layouts

#### Special Pages
- **404 Error**: Standard and parallax versions
- **500 Error**: Server error page
- **Coming Soon**: 4 variations with countdown
- **Maintenance**: Under maintenance page
- **User Login**: Login page variations

---

### Home Page Templates (60+ Pre-designed)

**E-commerce Focused**:
- home-shop.html (v1-v4) - 4 shop homepage designs
- home-fashion.html - Fashion store layout
- home-wine.html - Product showcase style

**Business & Corporate**:
- home-corporate.html (v1-v8) - 8 corporate layouts
- home-business.html (v1-v3) - Business layouts
- home-startup.html - Startup/SaaS layout

**Creative & Portfolio**:
- home-creative.html (v1-v9) - 9 creative agency layouts
- home-portfolio.html (v1-v10) - 10 portfolio layouts
- home-photography.html (v1-v2) - Photography showcase
- home-architect.html - Architecture/design layout
- home-design-studio.html - Design agency layout

**Industry Specific**:
- home-hotel.html (v1-v2) - Hotel/hospitality
- home-restaurant.html - Restaurant/cafe
- home-bakery.html - Bakery/food
- home-real-estate.html - Real estate
- home-construction.html - Construction
- home-car-service.html - Automotive
- home-taxi.html - Transport/taxi service
- home-fitness.html - Gym/fitness
- home-lawyer.html - Legal/law firm
- home-event.html - Events/conferences

**Blog & Magazine**:
- home-blog.html (v1-v8) - 8 blog layouts
- home-magazine.html (v1-v4) - 4 magazine layouts

**Special Effects**:
- home-parallax.html - Parallax scrolling
- home-video-background.html - Video backgrounds
- home-text-rotator.html - Animated text
- home-particles.html - Particle effects
- home-one-page.html (v1-v4) - One-page scrolling
- home-grid.html - Grid-based layout
- home-minimal.html - Minimal design
- home-sketch.html - Sketch/wireframe style

---

### Modal Variations

**Auto-Open Modals** (10 types):
- Standard modal
- Login modal
- Video modal (YouTube, Vimeo)
- Audio modal
- Iframe modal
- Shop/product modal
- Subscription modal

**Use Cases for K-pop Store**:
- Product quick view
- Newsletter signup
- Age verification
- Pre-order notifications
- Limited edition alerts
- Artist announcements

---

### Integration Guide for Muchannel

#### Recommended Components for K-pop E-commerce

**Product Listing Pages**:
- Use `shop-columns-3.html` or `shop-columns-4.html` as base
- Integrate `shop-sidebar-left.html` for filtering by artist/category
- Implement `shop-infinite-scroll.html` for better UX
- Add `shortcode-ratings.html` for product reviews

**Product Detail Pages**:
- Base on `shop-single-product.html`
- Add `shortcode-carousel.html` for product image gallery
- Include `shortcode-tabs.html` for product details/specs/reviews
- Use `shortcode-countdown.html` for pre-order countdown
- Integrate `shortcode-modal.html` for size guides or shipping info

**Homepage Design**:
- Use `home-shop-v2.html` or `home-shop-v3.html` as template
- Add `shortcode-carousel.html` for featured albums
- Include `shortcode-icon-boxes.html` for features (free shipping, etc.)
- Use `shortcode-testimonial.html` for fan reviews
- Add `shortcode-client-logo.html` for artist/label logos

**Artist Pages**:
- Base on `shortcode-team-members.html` for artist profiles
- Use `shortcode-tabs.html` for discography/biography/shop
- Add `shortcode-social-icons.html` for social media links
- Include `shop-columns-3.html` filtered by artist

**Shopping Cart**:
- Use `shop-cart.html` as base
- Implement `shortcode-tables.html` for cart items
- Add `shortcode-progress-bar.html` for shipping threshold

**Checkout**:
- Base on `shop-checkout.html`
- Use `shortcode-wizard.html` for multi-step checkout
- Add `shortcode-form-validation.html` for form fields

**Additional Features**:
- `shortcode-countdown.html` - Pre-order/release countdowns
- `shortcode-alerts.html` - Stock alerts, promotions
- `shortcode-modal-auto-open.html` - Limited edition pop-ups
- `shortcode-lazyload.html` - Optimize product image loading
- `component-datatable.html` - Order history tables

---

### CSS Framework & Styling

**CSS Files Available**:
- `css/style.css` - Main theme styles
- `css/plugins.css` - Third-party plugin styles
- `css/theme.css` - Theme variations
- `css/fonts.css` - Typography
- `css/custom.css` - Custom overrides
- `css/rtl.css` - Right-to-left support

**Grid System**:
- Bootstrap-based responsive grid
- 12-column layout system
- Flexible container widths
- Mobile-first approach

**Color Schemes**:
- Light and dark variations
- Customizable theme colors
- Pre-built color schemes

**Responsive Breakpoints**:
- Mobile: < 576px
- Tablet: 576px - 768px
- Desktop: 768px - 992px
- Large Desktop: 992px - 1200px
- Extra Large: > 1200px

---

### JavaScript Plugins & Libraries

**Included Plugins** (in `js/` folder):
- jQuery - DOM manipulation
- Bootstrap - UI components
- Owl Carousel - Carousels and sliders
- Isotope - Filtering and sorting
- Magnific Popup - Lightboxes and modals
- Particles.js - Particle effects
- Parallax - Parallax scrolling
- Chart.js - Data visualization
- DataTables - Advanced tables
- FullCalendar - Calendar functionality
- And many more...

**Custom JavaScript**:
- Smooth scrolling
- Lazy loading
- Form validation
- AJAX functionality
- Animation triggers

---

### How to Use Template Components

#### Integration Steps:

1. **Reference Template Files**:
   ```html
   <!-- Copy HTML structure from Template/ files -->
   <!-- Example: Template/shop-columns-3.html -->
   ```

2. **Copy Required CSS**:
   ```html
   <link href="/static/Template/css/plugins.css" rel="stylesheet">
   <link href="/static/Template/css/style.css" rel="stylesheet">
   ```

3. **Copy Required JavaScript**:
   ```html
   <script src="/static/Template/js/plugins.js"></script>
   <script src="/static/Template/js/functions.js"></script>
   ```

4. **Integrate with Django Templates**:
   - Extract HTML components from Template files
   - Convert to Django template syntax (`{% %}`, `{{ }}`)
   - Replace static content with dynamic data from API
   - Maintain original CSS classes and structure

5. **Customize for K-pop Theme**:
   - Adjust color schemes for K-pop aesthetics
   - Customize fonts (consider K-pop style fonts)
   - Add K-pop specific icons and graphics
   - Integrate artist branding colors

#### Example: Product Card Component

**From Template** (`shop-columns-3.html`):
```html
<div class="product">
    <div class="product-image">
        <img src="images/product.jpg" alt="Product">
        <span class="product-badge">NEW</span>
    </div>
    <div class="product-title">Product Name</div>
    <div class="product-price">$29.99</div>
</div>
```

**Converted to Django Template**:
```html
<div class="product">
    <div class="product-image">
        <img src="{{ product.image.url }}" alt="{{ product.title }}">
        {% if product.is_new %}<span class="product-badge">NEW</span>{% endif %}
    </div>
    <div class="product-title">{{ product.title }}</div>
    <div class="product-price">${{ product.price }}</div>
</div>
```

---

### Template File Organization

```
Template/
├── css/                    # Stylesheets
│   ├── style.css          # Main styles
│   ├── plugins.css        # Plugin styles
│   └── theme.css          # Theme variations
├── js/                    # JavaScript files
│   ├── functions.js       # Main JS
│   └── plugins.js         # Plugin JS
├── images/                # Image assets
├── include/               # Reusable HTML includes
├── homepages/             # Homepage demos
├── shortcode-*.html       # Component documentation (64 files)
├── shop-*.html            # Shop page templates (38 files)
├── home-*.html            # Homepage templates (60+ files)
├── blog-*.html            # Blog templates (50+ files)
├── portfolio-*.html       # Portfolio templates
├── component-*.html       # Advanced components
├── header-*.html          # Header variations
├── footer-*.html          # Footer variations
├── menu-*.html            # Menu variations
├── modal-*.html           # Modal variations
├── page-*.html            # Standard pages
└── index.html             # Main demo page
```

---

### Quick Reference: Most Useful Templates

**For Product Pages**:
1. `shop-columns-3.html` - Main product listing
2. `shop-sidebar-left.html` - With filters
3. `shop-single-product.html` - Product detail
4. `shop-cart.html` - Shopping cart
5. `shop-checkout.html` - Checkout process

**For Homepage**:
1. `home-shop-v2.html` - Modern shop homepage
2. `home-shop-v3.html` - Featured products focus
3. `index.html` - Main demo (all components showcase)

**For Components**:
1. `shortcode-carousel.html` - Image sliders
2. `shortcode-grid.html` - Layout grid
3. `shortcode-modal.html` - Pop-ups
4. `shortcode-tabs.html` - Tabbed content
5. `shortcode-ratings.html` - Product reviews

**For Admin/Dashboard** (if needed):
1. `component-datatable.html` - Data tables
2. `component-charts-chartjs.html` - Analytics charts
3. `component-calendar.html` - Order calendar

---

### Best Practices for Integration

1. **Maintain Structure**: Keep original HTML structure and CSS classes
2. **Progressive Enhancement**: Start with basic template, add features gradually
3. **Mobile First**: Test responsive behavior on all devices
4. **Performance**: Optimize images, lazy load content, minify CSS/JS
5. **Accessibility**: Maintain ARIA labels and semantic HTML
6. **Customization**: Create `custom.css` for project-specific overrides
7. **Documentation**: Document which templates were used for each page

### Theme Reference Location

All template files and documentation can be found at:
**`C:\Users\Terry\Documents\Terry\Muchannel\Template/`**

Open any `.html` file in a browser to see live demos and copy HTML/CSS/JS patterns.
