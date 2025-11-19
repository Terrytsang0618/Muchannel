# JWT Authentication with HttpOnly Cookies - Setup Guide

This document explains the JWT authentication system implemented in the K-pop Store project.

## Overview

The authentication system uses JWT (JSON Web Tokens) stored in HttpOnly cookies for secure authentication. This approach prevents XSS attacks while maintaining a seamless user experience.

## Features

- **Secure HttpOnly Cookies**: Access and refresh tokens stored in HttpOnly cookies
- **Automatic Token Refresh**: Expired access tokens are automatically refreshed
- **User Registration & Login**: Complete authentication flow
- **Frontend Integration**: Axios interceptors for seamless API calls
- **Token Blacklisting**: Logout invalidates refresh tokens

## Backend Components

### 1. Dependencies

Added to `requirements.txt`:
```
djangorestframework-simplejwt==5.3.1
```

Install with:
```bash
pip install -r requirements.txt
```

### 2. Django Settings

**INSTALLED_APPS** (`base/settings.py`):
- `rest_framework_simplejwt`
- `rest_framework_simplejwt.token_blacklist`

**SIMPLE_JWT Configuration**:
- Access token lifetime: 1 hour
- Refresh token lifetime: 7 days
- Token rotation enabled
- Blacklist after rotation enabled

### 3. Custom Authentication Class

**File**: `ecommerce/authentication.py`

`CookieJWTAuthentication` class reads JWT tokens from cookies instead of Authorization headers.

### 4. Serializers

**File**: `ecommerce/api/serializers/auth_serializers.py`

- `RegisterSerializer`: User registration with password validation
- `LoginSerializer`: User login credentials
- `UserProfileSerializer`: User profile data

### 5. Views

**File**: `ecommerce/api/api_views/auth_views.py`

- `RegisterView`: Creates new user and sets JWT cookies
- `LoginView`: Authenticates user and sets JWT cookies
- `LogoutView`: Clears cookies and blacklists refresh token
- `RefreshTokenView`: Issues new access token using refresh token
- `CurrentUserView`: Returns current authenticated user data

### 6. URLs

**File**: `ecommerce/api/api_urls/__init__.py`

Authentication endpoints:
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login
- `POST /api/auth/logout/` - Logout
- `POST /api/auth/refresh/` - Refresh access token
- `GET /api/auth/me/` - Get current user

## Frontend Components

### 1. API Service

**File**: `static/js/api.js`

**Axios Configuration**:
```javascript
axios.defaults.withCredentials = true; // Enable cookies
```

**Authentication Methods**:
- `API.auth.register(userData)`
- `API.auth.login(username, password)`
- `API.auth.logout()`
- `API.auth.refresh()`
- `API.auth.getCurrentUser()`

**Automatic Token Refresh**:
Axios interceptor catches 401 errors and automatically refreshes the token.

### 2. Auth Manager

**File**: `static/js/auth.js`

**Features**:
- Manages authentication state
- Shows/hides login/register buttons
- Displays user menu when authenticated
- Handles login/register modals
- Automatic session check on page load

### 3. UI Components

**Updated Files**:
- `ecommerce/templates/includes/header.html` - Added auth buttons and user menu
- `ecommerce/templates/layout.html` - Included auth.js script

## Usage

### Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

3. Start the development server:
```bash
python manage.py runserver
```

### Testing Authentication

#### Register a New User
```javascript
const userData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'SecurePass123!',
    password2: 'SecurePass123!'
};

const result = await API.auth.register(userData);
console.log(result); // { user: {...}, message: '...' }
```

#### Login
```javascript
const result = await API.auth.login('testuser', 'SecurePass123!');
console.log(result); // { user: {...}, message: 'Login successful' }
```

#### Get Current User
```javascript
const user = await API.auth.getCurrentUser();
console.log(user); // { id: 1, username: 'testuser', email: '...' }
```

#### Logout
```javascript
await API.auth.logout();
```

### Using Protected Endpoints

After login, all API calls automatically include the JWT token from cookies:

```javascript
// This will work for authenticated users
const cart = await API.cart.getItems();
const orders = await API.orders.getAll();
```

If the access token expires, the interceptor automatically refreshes it and retries the request.

## Security Considerations

### Production Setup

When deploying to production, update these settings in `ecommerce/api/api_views/auth_views.py`:

```python
response.set_cookie(
    key='access_token',
    value=str(refresh.access_token),
    httponly=True,
    secure=True,  # Change to True for HTTPS
    samesite='Strict',  # Change from 'Lax' to 'Strict'
    max_age=3600
)
```

### CORS Settings

Update `base/settings.py` for production:

```python
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.com",
]
CORS_ALLOW_CREDENTIALS = True
```

## Cookie Details

### Access Token Cookie
- **Name**: `access_token`
- **HttpOnly**: Yes
- **Secure**: No (development), Yes (production)
- **SameSite**: Lax
- **Max Age**: 3600 seconds (1 hour)

### Refresh Token Cookie
- **Name**: `refresh_token`
- **HttpOnly**: Yes
- **Secure**: No (development), Yes (production)
- **SameSite**: Lax
- **Max Age**: 604800 seconds (7 days)

## Events

### Custom Events

The auth system dispatches custom events:

```javascript
// Listen for session expiration
window.addEventListener('auth:session-expired', () => {
    console.log('Session expired, please login again');
});
```

## Troubleshooting

### Issue: Cookies not being set

**Solution**: Ensure `axios.defaults.withCredentials = true` is set before making requests.

### Issue: 401 Unauthorized on every request

**Solution**: Check that `CookieJWTAuthentication` is in `DEFAULT_AUTHENTICATION_CLASSES` in settings.py.

### Issue: Token refresh fails

**Solution**: Ensure the token blacklist app is installed and migrations are run.

## File Structure

```
ecommerce/
├── authentication.py                          # Custom JWT authentication class
├── api/
│   ├── serializers/
│   │   └── auth_serializers.py               # Auth serializers
│   ├── api_views/
│   │   └── auth_views.py                     # Auth views
│   └── api_urls/
│       └── __init__.py                       # Auth URLs

static/
├── js/
│   ├── api.js                                # API service with auth methods
│   └── auth.js                               # Auth UI manager

templates/
└── includes/
    └── header.html                           # Updated with auth buttons
```

## Next Steps

1. Add password reset functionality
2. Implement email verification
3. Add OAuth social login (Google, Facebook)
4. Implement rate limiting for auth endpoints
5. Add two-factor authentication (2FA)
