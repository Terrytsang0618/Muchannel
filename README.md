# NFT Ecommerce Website

A modern ecommerce website built with Django 5.2.8 and Tailwind CSS for selling NFTs and digital products.

## Project Structure

```
NFT_project/
├── base/                          # Main Django project
│   ├── base/                       # Project configuration
│   │   ├── settings.py             # Django settings
│   │   ├── urls.py                 # Main URL routing
│   │   └── ...
│   ├── ecommerce/                  # Main ecommerce app
│   │   ├── templates/              # HTML templates
│   │   │   ├── layout.html         # Main layout template
│   │   │   ├── home.html           # Home page
│   │   │   └── includes/           # Reusable template components
│   │   │       ├── header.html     # Header component
│   │   │       └── sidebar.html    # Sidebar component
│   │   ├── views/
│   │   │   └── views.py            # Class-Based Views
│   │   ├── models/
│   │   │   └── models.py           # Database models
│   │   └── urls.py                 # App URL routing
│   ├── static/                     # Static files
│   │   ├── css/
│   │   │   └── styles.css          # Custom CSS styles
│   │   ├── js/
│   │   │   └── main.js             # JavaScript functions
│   │   └── assets/                 # Images, fonts, etc.
│   ├── manage.py                   # Django management script
│   └── db.sqlite3                  # SQLite database
└── venv/                           # Virtual environment

```

## Features

### Current Implementation

- **Modular Template Architecture**: Separated layout components (layout.html, header, sidebar)
- **Class-Based Views (CBV)**: Django CBVs for better code organization and reusability
- **Responsive Layout**: Header, left sidebar, and main content area
- **Tailwind CSS**: Modern utility-first CSS framework (via CDN)
- **Mobile-Friendly**: Collapsible sidebar for mobile devices
- **Interactive Elements**: JavaScript-powered sidebar toggle and search
- **Home Page**: Featured products, stats cards, and trending NFTs sections
- **Navigation**: Multi-section sidebar with main menu and account options

### Layout Components

1. **Header**
   - Logo and branding
   - Search bar (desktop and mobile)
   - Shopping cart with counter
   - Notifications
   - User profile icon

2. **Left Sidebar**
   - Main Menu: Home, Products, NFT Collection, Trending, Categories
   - Account Section: Profile, My Orders, Wishlist, Settings, Logout
   - Responsive: Slides in/out on mobile devices

3. **Home Page**
   - Welcome banner with call-to-action
   - Stats cards (Products, NFTs, Users, Sales)
   - Featured products grid
   - Trending NFTs section

## Getting Started

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. **Activate Virtual Environment**

   On Windows:
   ```bash
   cd C:\Users\fanta\Documents\Python\NFT_project
   venv\Scripts\activate
   ```

   On macOS/Linux:
   ```bash
   cd /path/to/NFT_project
   source venv/bin/activate
   ```

2. **Navigate to the Django project**
   ```bash
   cd base
   ```

3. **Install Django** (if not already installed)
   ```bash
   pip install django
   ```

4. **Run migrations**
   ```bash
   python manage.py migrate
   ```

5. **Create a superuser** (optional, for admin access)
   ```bash
   python manage.py createsuperuser
   ```

6. **Run the development server**
   ```bash
   python manage.py runserver
   ```

7. **Access the website**
   - Open your browser and go to: `http://127.0.0.1:8000/`
   - Admin panel: `http://127.0.0.1:8000/admin/`

## Technology Stack

- **Backend**: Django 5.2.8
- **Frontend**: HTML5, Tailwind CSS (CDN), JavaScript
- **Database**: SQLite3 (development)
- **Icons**: Font Awesome 6.4.0

## Development Notes

### Tailwind CSS

Currently using Tailwind CSS via CDN for quick setup. For production, consider:
- Installing Tailwind CSS locally via npm
- Setting up build process for optimized CSS
- Configuring custom theme colors

### Static Files

Static files are configured in `settings.py`:
- `STATIC_URL = 'static/'`
- `STATICFILES_DIRS = [BASE_DIR / 'static']`

### Custom JavaScript

Main JavaScript functions in `static/js/main.js`:
- `toggleSidebar()`: Toggle mobile sidebar
- `closeSidebar()`: Close sidebar when clicking overlay
- `addToCart()`: Add products to shopping cart
- `handleSearch()`: Handle search functionality

### Custom CSS

Additional styles in `static/css/styles.css`:
- Sidebar transitions
- Custom scrollbar styling
- Card hover effects

## Next Steps

### Recommended Enhancements

1. **Database Models**
   - Create Product model
   - Create Category model
   - Create Order model
   - Create User profile model

2. **Authentication**
   - User registration
   - Login/logout functionality
   - Password reset

3. **Product Management**
   - Product listing page
   - Product detail page
   - Category filtering
   - Search functionality

4. **Shopping Cart**
   - Add to cart functionality
   - Cart page
   - Checkout process
   - Payment integration

5. **NFT Features**
   - NFT collection pages
   - Blockchain integration
   - Wallet connection
   - Minting functionality

6. **Admin Dashboard**
   - Product management
   - Order management
   - User management
   - Analytics

## File Locations

- **Settings**: `base/base/settings.py`
- **URLs**: `base/base/urls.py` and `base/ecommerce/urls.py`
- **Views**: `base/ecommerce/views/views.py`
- **Templates**: `base/ecommerce/templates/`
- **Static Files**: `base/static/`

## Troubleshooting

### Django Not Found
If you get "ModuleNotFoundError: No module named 'django'", make sure to:
1. Activate the virtual environment
2. Install Django: `pip install django`

### Static Files Not Loading
If CSS/JS files aren't loading:
1. Check `STATICFILES_DIRS` in settings.py
2. Run `python manage.py collectstatic` (for production)
3. Ensure the development server is running

### Templates Not Found
If you get template errors:
1. Verify 'ecommerce' is in INSTALLED_APPS
2. Check template paths in `base/ecommerce/templates/`

## Contributing

This is a work in progress. Feel free to add features and improvements!

## License

This project is for educational and development purposes.
