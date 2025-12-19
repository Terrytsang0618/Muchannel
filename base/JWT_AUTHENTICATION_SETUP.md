# JWT Authentication with HttpOnly Cookies - Complete Guide

This document explains the JWT authentication system implemented in the K-pop Store project, including detailed flow diagrams, security features, and troubleshooting.

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Authentication Flow](#authentication-flow)
- [Backend Implementation](#backend-implementation)
- [Frontend Implementation](#frontend-implementation)
- [Security Features](#security-features)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Known Issues](#known-issues)
- [Troubleshooting](#troubleshooting)

---

## Overview

The authentication system uses **JWT (JSON Web Tokens)** stored in **HttpOnly cookies** for secure authentication. This approach combines the benefits of stateless JWT authentication with the security of HttpOnly cookies.

### Key Features

- ✅ **Secure HttpOnly Cookies**: Tokens cannot be accessed by JavaScript (XSS protection)
- ✅ **Automatic Token Refresh**: Expired access tokens are refreshed transparently
- ✅ **Token Rotation**: New refresh token issued on each refresh
- ✅ **Token Blacklisting**: Old tokens invalidated on refresh and logout
- ✅ **Queue Management**: Multiple simultaneous requests handled efficiently
- ✅ **CSRF Protection**: SameSite cookie attribute prevents CSRF attacks
- ✅ **Seamless UX**: Users never see authentication errors during normal browsing

---

## How It Works

### Token Types

#### Access Token
- **Lifetime**: 1 hour
- **Purpose**: Authenticate API requests
- **Storage**: HttpOnly cookie (`access_token`)
- **Validation**: Checked on every protected API endpoint
- **Auto-sent**: Browser automatically includes in requests

#### Refresh Token
- **Lifetime**: 1 day (24 hours)
- **Purpose**: Generate new access tokens
- **Storage**: HttpOnly cookie (`refresh_token`)
- **Usage**: Only sent to `/api/auth/refresh/` endpoint
- **Rotation**: New refresh token issued on each refresh

### Request Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION FLOW                          │
└─────────────────────────────────────────────────────────────────┘

1. LOGIN/REGISTER
   ┌──────────┐                           ┌──────────┐
   │ Frontend │──── POST /auth/login/ ───>│ Backend  │
   │          │<─── Set Cookies ──────────│          │
   └──────────┘     access_token (1h)     └──────────┘
                    refresh_token (1d)

2. PROTECTED API CALL (Token Valid)
   ┌──────────┐                           ┌──────────┐
   │ Browser  │──── GET /api/cart/ ──────>│ Backend  │
   │          │     + cookies              │          │
   │          │     (auto-sent)            │          │
   │          │<─── Cart data ─────────────│ ✓ Token │
   └──────────┘                            │  Valid   │
                                           └──────────┘

3. PROTECTED API CALL (Token Expired)
   ┌──────────┐                           ┌──────────┐
   │ Browser  │──── GET /api/cart/ ──────>│ Backend  │
   │          │     + expired token        │          │
   │          │<─── 401 Unauthorized ──────│ ✗ Token │
   │          │                            │  Expired │
   └──────────┘                            └──────────┘
        │
        │  Axios Interceptor Catches 401
        ↓
   ┌──────────┐                           ┌──────────┐
   │ Browser  │── POST /auth/refresh/ ───>│ Backend  │
   │          │    + refresh_token         │          │
   │          │<── New access_token ───────│ Generate │
   └──────────┘                            │   New    │
        │                                  └──────────┘
        │  Retry Original Request
        ↓
   ┌──────────┐                           ┌──────────┐
   │ Browser  │──── GET /api/cart/ ──────>│ Backend  │
   │          │     + new token            │          │
   │          │<─── Cart data ─────────────│ ✓ Token │
   └──────────┘                            │  Valid   │
                                           └──────────┘
```

### Complete Authentication Lifecycle

```
TIME      EVENT                                    STATE
─────────────────────────────────────────────────────────────────
00:00     User logs in                             ✅ Authenticated
          ├─ access_token: expires at 01:00
          └─ refresh_token: expires at 24:00

00:30     User browses products                    ✅ Authenticated
          └─ access_token valid → Request succeeds

01:00     Access token expires                     ⏳ Token Expired
          User clicks product details
          ├─ API returns 401
          ├─ Axios interceptor catches error
          ├─ Auto-calls /auth/refresh/
          ├─ New access_token generated
          └─ Original request retried → Success   ✅ Authenticated

01:30     User continues browsing                  ✅ Authenticated
          └─ New access_token valid

24:00     Refresh token expires                    ❌ Session Ended
          User tries to access cart
          ├─ access_token expired
          ├─ Tries to refresh → 401
          └─ Redirected to login                   🔐 Login Required
```

---

## Backend Implementation

### 1. Dependencies

**File**: `requirements.txt`
```
djangorestframework-simplejwt==5.3.1
```

Install:
```bash
pip install -r requirements.txt
```

### 2. Django Settings

**File**: `base/base/settings.py`

#### INSTALLED_APPS
```python
INSTALLED_APPS = [
    # ...
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',  # Required for logout
    # ...
]
```

#### REST Framework Configuration
```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'ecommerce.authentication.CookieJWTAuthentication',  # Custom class
    ),
    # ...
}
```

#### JWT Configuration
```python
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),      # Access token: 1 hour
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),      # Refresh token: 1 day
    'ROTATE_REFRESH_TOKENS': True,                    # Issue new refresh token on refresh
    'BLACKLIST_AFTER_ROTATION': True,                 # Invalidate old refresh tokens
    'UPDATE_LAST_LOGIN': True,                        # Update user.last_login field

    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,

    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
}
```

### 3. Custom Authentication Class

**File**: `ecommerce/authentication.py`

```python
from rest_framework_simplejwt.authentication import JWTAuthentication

class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication that reads tokens from HttpOnly cookies
    instead of Authorization header.

    Flow:
    1. Check for 'access_token' cookie
    2. If not found, fallback to Authorization header
    3. Validate token
    4. Return user if valid
    """

    def authenticate(self, request):
        # Try to get token from cookie first
        raw_token = request.COOKIES.get('access_token')

        # Fallback to Authorization header
        if raw_token is None:
            header = self.get_header(request)
            if header is None:
                return None
            raw_token = self.get_raw_token(header)

        if raw_token is None:
            return None

        # Validate and return user
        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token
```

**How it works**:
- Called automatically by Django REST Framework on protected endpoints
- Checks every request for valid access token
- Supports both cookie-based and header-based tokens (flexibility)

### 4. Authentication Views

**File**: `ecommerce/api/api_views/auth_views.py`

#### RegisterView
```python
class RegisterView(generics.CreateAPIView):
    """
    User registration endpoint.

    POST /api/auth/register/
    Body: { username, email, password, password2 }
    Returns: User data + sets JWT cookies
    """
```

#### LoginView
```python
class LoginView(APIView):
    """
    User login endpoint.

    POST /api/auth/login/
    Body: { username, password }
    Returns: User data + sets JWT cookies
    """
```

#### LogoutView
```python
class LogoutView(APIView):
    """
    User logout endpoint.

    POST /api/auth/logout/
    - Blacklists refresh token
    - Clears both cookies
    """
```

#### RefreshTokenView
```python
class RefreshTokenView(APIView):
    """
    Token refresh endpoint.

    POST /api/auth/refresh/
    - Reads refresh_token from cookie
    - Validates refresh token
    - Issues new access_token
    - Sets new access_token cookie
    """

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')

        if not refresh_token:
            return Response({'error': 'Refresh token not found'},
                          status=401)

        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)

            response = Response({'message': 'Token refreshed'})

            # Set new access token in cookie
            response.set_cookie(
                key='access_token',
                value=access_token,
                httponly=True,
                secure=False,  # Set to True in production
                samesite='Lax',
                max_age=3600  # 1 hour
            )

            return response

        except (TokenError, InvalidToken):
            return Response({'error': 'Invalid refresh token'},
                          status=401)
```

#### CurrentUserView
```python
class CurrentUserView(APIView):
    """
    Get current authenticated user.

    GET /api/auth/me/
    Returns: User profile data
    """
```

### 5. API Endpoints

**File**: `ecommerce/api/api_urls/__init__.py`

```python
urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/refresh/', RefreshTokenView.as_view(), name='refresh'),
    path('auth/me/', CurrentUserView.as_view(), name='current-user'),
]
```

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/auth/register/` | POST | No | Register new user |
| `/api/auth/login/` | POST | No | Login user |
| `/api/auth/logout/` | POST | Yes | Logout user |
| `/api/auth/refresh/` | POST | No | Refresh access token |
| `/api/auth/me/` | GET | Yes | Get current user |

---

## Frontend Implementation

### 1. Axios Configuration

**File**: `static/js/api.js`

```javascript
// Enable sending cookies with all requests
axios.defaults.withCredentials = true;

// CSRF token configuration
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
```

**Why this is needed**:
- `withCredentials: true` tells the browser to send cookies with cross-origin requests
- Without this, cookies won't be sent to the API

### 2. Automatic Token Refresh (Axios Interceptor)

**File**: `static/js/api.js` (lines 181-239)

```javascript
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
    response => response,  // Success - pass through
    async error => {
        const originalRequest = error.config;

        // If 401 error and haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {

            // If already refreshing, queue this request
            if (isRefreshing) {
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
                return axios(originalRequest);  // Retry original request
            } catch (refreshError) {
                processQueue(refreshError);
                // Dispatch session expired event
                window.dispatchEvent(new CustomEvent('auth:session-expired'));
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);
```

**How it works**:

1. **All API responses** pass through this interceptor
2. **On 401 error**: Automatically tries to refresh token
3. **Queue management**: If multiple requests fail simultaneously, only one refresh is triggered
4. **Retry logic**: After successful refresh, original request is retried automatically
5. **User experience**: Completely transparent - user doesn't notice token expiration

### 3. API Service Methods

**File**: `static/js/api.js`

```javascript
const API = {
    auth: {
        register: async (userData) => {
            const response = await axios.post(`${API_BASE_URL}/auth/register/`, userData);
            return response.data;
        },

        login: async (username, password) => {
            const response = await axios.post(`${API_BASE_URL}/auth/login/`, {
                username, password
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

    // Protected endpoints automatically include token from cookies
    cart: {
        getItems: async () => {
            const response = await axios.get(`${API_BASE_URL}/cart/`);
            return response.data;
        },
        // ... other cart methods
    },

    orders: {
        getAll: async () => {
            const response = await axios.get(`${API_BASE_URL}/orders/`);
            return response.data;
        },
        // ... other order methods
    }
};
```

### 4. Session Expired Event

**File**: `static/js/api.js` (line 228)

```javascript
// Listen for session expiration
window.addEventListener('auth:session-expired', () => {
    console.log('Session expired. Please log in again.');
    // Show login modal or redirect to login page
    // Example: window.location.href = '/login';
});
```

---

## Security Features

### 1. HttpOnly Cookies

```python
response.set_cookie(
    key='access_token',
    value=str(refresh.access_token),
    httponly=True,  # 🔒 Cannot be accessed by JavaScript
    secure=False,   # ⚠️ Set to True in production (HTTPS)
    samesite='Lax', # 🛡️ CSRF protection
    max_age=3600    # Expires in 1 hour
)
```

**Benefits**:
- ✅ **XSS Protection**: JavaScript cannot read the token (even if XSS vulnerability exists)
- ✅ **CSRF Protection**: `SameSite='Lax'` prevents cross-site requests
- ✅ **Automatic Sending**: Browser handles token transmission (no manual code)

### 2. Token Rotation

**Configuration**: `ROTATE_REFRESH_TOKENS = True`

- New refresh token issued on every refresh
- Old refresh token is immediately invalidated
- Prevents token reuse attacks

### 3. Token Blacklisting

**Configuration**: `BLACKLIST_AFTER_ROTATION = True`

- Old tokens added to blacklist on refresh
- Logout blacklists the refresh token
- Prevents stolen tokens from being reused

### 4. Queue Management

**Prevents Race Conditions**:
- Multiple simultaneous API calls that fail
- Only one token refresh triggered
- Other requests wait in queue
- All retried after successful refresh

### 5. CSRF Protection

**SameSite Cookie Attribute**:
- `Lax`: Allows cookies in top-level navigation (normal links)
- Blocks cookies in cross-site POST requests
- Production: Consider `Strict` for maximum security

---

## Configuration

### Cookie Settings Breakdown

#### Access Token Cookie
```python
response.set_cookie(
    key='access_token',           # Cookie name
    value=str(refresh.access_token),  # JWT token string
    httponly=True,                # JavaScript cannot access
    secure=False,                 # HTTPS only (set True in production)
    samesite='Lax',              # CSRF protection
    max_age=3600                 # Expires in 1 hour (seconds)
)
```

#### Refresh Token Cookie
```python
response.set_cookie(
    key='refresh_token',         # Cookie name
    value=str(refresh),          # JWT refresh token string
    httponly=True,               # JavaScript cannot access
    secure=False,                # HTTPS only (set True in production)
    samesite='Lax',             # CSRF protection
    max_age=86400 * 7           # ⚠️ 7 days (should be 1 day - see issues)
)
```

### Token Lifetimes

| Token Type | Lifetime | Cookie Max Age | Storage Location |
|------------|----------|----------------|------------------|
| Access Token | 1 hour | 1 hour (3600s) | `access_token` cookie |
| Refresh Token | 1 day | 7 days (604800s) ⚠️ | `refresh_token` cookie |

⚠️ **See Known Issues** for cookie lifetime mismatch

---

## Usage Examples

### Register New User

```javascript
const userData = {
    username: 'kpopfan123',
    email: 'fan@example.com',
    password: 'SecurePass123!',
    password2: 'SecurePass123!'
};

try {
    const result = await API.auth.register(userData);
    console.log(result);
    // {
    //   user: { id: 1, username: 'kpopfan123', email: 'fan@example.com' },
    //   message: 'User registered successfully'
    // }
    // Cookies automatically set by browser
} catch (error) {
    console.error('Registration failed:', error.response.data);
}
```

### Login

```javascript
try {
    const result = await API.auth.login('kpopfan123', 'SecurePass123!');
    console.log(result);
    // {
    //   user: { id: 1, username: 'kpopfan123', ... },
    //   message: 'Login successful'
    // }
} catch (error) {
    console.error('Login failed:', error.response.data);
}
```

### Get Current User

```javascript
try {
    const user = await API.auth.getCurrentUser();
    console.log(user);
    // { id: 1, username: 'kpopfan123', email: 'fan@example.com' }
} catch (error) {
    console.error('Not authenticated');
}
```

### Logout

```javascript
try {
    await API.auth.logout();
    console.log('Logged out successfully');
    // Cookies cleared, refresh token blacklisted
} catch (error) {
    console.error('Logout failed:', error);
}
```

### Using Protected Endpoints

```javascript
// After login, all authenticated requests work automatically
// The access_token cookie is sent automatically by the browser

// Get cart items (requires authentication)
const cart = await API.cart.getItems();

// Get user's orders (requires authentication)
const orders = await API.orders.getAll();

// Add product to cart (requires authentication)
await API.cart.addItem(productId, quantity);
```

**Note**: If the access token expires during any of these requests:
1. API returns 401 Unauthorized
2. Axios interceptor catches the 401
3. Automatically calls `/auth/refresh/`
4. Retries the original request
5. User never notices the token expiration

---

## Known Issues

### Issue 1: Cookie Lifetime Mismatch ⚠️

**Problem**: Refresh token cookie lifetime (7 days) doesn't match token lifetime (1 day)

**Location**: `ecommerce/api/api_views/auth_views.py:101`

```python
# Current (Incorrect)
response.set_cookie(
    key='refresh_token',
    value=str(refresh),
    max_age=86400 * 7  # ❌ 7 days - Cookie lifetime
)

# settings.py
SIMPLE_JWT = {
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1)  # ❌ 1 day - Token lifetime
}
```

**Impact**:
- After 1 day, the cookie still exists but contains an expired token
- Attempting to use it returns 401 error
- User sees unexpected logout behavior

**Recommended Fix**:
```python
# Change in auth_views.py (LoginView and RegisterView)
response.set_cookie(
    key='refresh_token',
    value=str(refresh),
    max_age=86400  # ✅ 1 day (matches token lifetime)
)
```

**OR** change settings.py to match:
```python
SIMPLE_JWT = {
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7)  # ✅ 7 days
}
```

### Issue 2: Token Blacklist Dependency

**Verify Installation**: Check that token blacklist is properly installed

```python
# base/settings.py
INSTALLED_APPS = [
    # ...
    'rest_framework_simplejwt.token_blacklist',  # ✅ Must be present
]
```

**Run migrations**:
```bash
python manage.py migrate
```

**Without this**: Logout will fail to blacklist tokens, allowing reuse of old tokens

---

## Troubleshooting

### Cookies Not Being Set

**Symptoms**:
- Login/register succeeds but subsequent requests return 401
- Can't access protected endpoints after login

**Solutions**:

1. **Check axios configuration**:
```javascript
// Must be set BEFORE any axios requests
axios.defaults.withCredentials = true;
```

2. **Check browser console**: Look for CORS errors

3. **Check Django CORS settings**:
```python
# base/settings.py
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = True  # For development
```

4. **Check cookie in DevTools**:
   - Open browser DevTools → Application → Cookies
   - Should see `access_token` and `refresh_token` cookies
   - Domain should match your API domain

### 401 Unauthorized on Every Request

**Symptoms**: Even protected endpoints return 401 immediately after login

**Solutions**:

1. **Check authentication class is registered**:
```python
# base/settings.py
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'ecommerce.authentication.CookieJWTAuthentication',  # ✅ Must be present
    ),
}
```

2. **Check cookie names match**:
```python
# In authentication.py
raw_token = request.COOKIES.get('access_token')  # Must match cookie name

# In auth_views.py
response.set_cookie(key='access_token', ...)  # Must match
```

3. **Check token is valid**:
```bash
# Django shell
python manage.py shell

>>> from rest_framework_simplejwt.tokens import RefreshToken
>>> from django.contrib.auth.models import User
>>> user = User.objects.first()
>>> refresh = RefreshToken.for_user(user)
>>> print(refresh.access_token)
# Should print a long token string
```

### Token Refresh Fails

**Symptoms**:
- Initial login works
- After 1 hour, requests start failing permanently
- No automatic refresh happening

**Solutions**:

1. **Check interceptor is registered**:
   - Ensure `api.js` is loaded before making any requests
   - Interceptor must be registered before API calls

2. **Check refresh endpoint**:
```bash
# Test refresh endpoint manually
curl -X POST http://127.0.0.1:8000/api/auth/refresh/ \
  -H "Cookie: refresh_token=YOUR_REFRESH_TOKEN"
```

3. **Check for JavaScript errors**:
   - Open browser console
   - Look for errors during token refresh

4. **Check token blacklist app**:
```bash
python manage.py migrate token_blacklist
```

### Session Expires Unexpectedly

**Symptoms**: User logged out before expected time

**Causes**:

1. **Cookie lifetime mismatch** (see Known Issues above)
2. **Browser cleared cookies**
3. **Server restarted** (tokens in blacklist cleared)

**Debug steps**:

1. Check token expiration times:
```javascript
// In browser console
document.cookie.split(';').forEach(c => console.log(c));
```

2. Check settings match:
```python
# settings.py
'ACCESS_TOKEN_LIFETIME': timedelta(hours=1)   # 1 hour
'REFRESH_TOKEN_LIFETIME': timedelta(days=1)   # 1 day

# auth_views.py
max_age=3600        # 1 hour (access token)
max_age=86400       # 1 day (refresh token) - should match
```

### CORS Errors

**Symptoms**:
- Browser console shows CORS policy errors
- Requests fail with CORS errors
- Cookies not sent with requests

**Solutions**:

```python
# base/settings.py

# Development
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# Production
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
]
CORS_ALLOW_CREDENTIALS = True
```

---

## Production Deployment

### Security Checklist

Before deploying to production, update these settings:

#### 1. Enable HTTPS-only Cookies

**File**: `ecommerce/api/api_views/auth_views.py`

Change in **LoginView**, **RegisterView**, and **RefreshTokenView**:

```python
response.set_cookie(
    key='access_token',
    value=str(refresh.access_token),
    httponly=True,
    secure=True,      # ✅ Change to True
    samesite='Strict', # ✅ Change to 'Strict' for maximum security
    max_age=3600
)
```

#### 2. Update CORS Settings

**File**: `base/settings.py`

```python
# Remove
CORS_ALLOW_ALL_ORIGINS = True

# Add
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
]
CORS_ALLOW_CREDENTIALS = True
```

#### 3. Use Environment Variables

```python
# Don't hardcode secrets
SECRET_KEY = os.environ.get('SECRET_KEY')

# Use environment-specific settings
DEBUG = os.environ.get('DEBUG', 'False') == 'True'
```

#### 4. Enable CSRF Protection

```python
# base/settings.py
CSRF_COOKIE_SECURE = True      # HTTPS only
CSRF_COOKIE_HTTPONLY = True    # JavaScript cannot access
SESSION_COOKIE_SECURE = True   # HTTPS only
```

#### 5. Add Rate Limiting

Consider adding rate limiting for auth endpoints:

```bash
pip install django-ratelimit
```

```python
from ratelimit.decorators import ratelimit

class LoginView(APIView):
    @ratelimit(key='ip', rate='5/m', method='POST')
    def post(self, request):
        # ... existing code
```

---

## File Structure

```
base/
├── base/
│   └── settings.py                      # JWT configuration
├── ecommerce/
│   ├── authentication.py                # CookieJWTAuthentication class
│   ├── api/
│   │   ├── serializers/
│   │   │   └── auth_serializers.py      # Auth serializers
│   │   ├── api_views/
│   │   │   └── auth_views.py            # Auth views (login, register, etc.)
│   │   └── api_urls/
│   │       └── __init__.py              # Auth URL routing
│   └── templates/
│       └── includes/
│           └── header.html              # Auth UI components
└── static/
    └── js/
        ├── api.js                       # API service + interceptors
        └── auth.js                      # Auth UI manager
```

---

## Next Steps & Enhancements

### Immediate Actions

1. ✅ Fix cookie lifetime mismatch (see Known Issues)
2. ✅ Verify token blacklist app is installed and migrated
3. ✅ Test automatic token refresh flow
4. ✅ Add session expired UI notification

### Future Enhancements

1. **Password Reset**: Email-based password reset flow
2. **Email Verification**: Verify email addresses on registration
3. **Social Login**: OAuth integration (Google, Facebook, Kakao)
4. **Two-Factor Authentication**: SMS or TOTP-based 2FA
5. **Rate Limiting**: Prevent brute force attacks
6. **Login History**: Track user login locations and devices
7. **Remember Me**: Optional extended session duration
8. **Account Lockout**: Lock account after failed login attempts

---

## Testing Checklist

### Manual Testing

- [ ] User can register successfully
- [ ] User can login successfully
- [ ] User can access protected endpoints after login
- [ ] User can logout successfully
- [ ] Cookies are set correctly (check DevTools)
- [ ] Access token expires after 1 hour
- [ ] Token is automatically refreshed after expiration
- [ ] Multiple simultaneous requests work correctly
- [ ] Session expires after refresh token expires
- [ ] Invalid credentials return proper error messages

### Browser Console Checks

```javascript
// Check cookies are set
document.cookie.split(';').forEach(c => console.log(c.trim()));

// Check API service is available
console.log(API);

// Test login
await API.auth.login('username', 'password');

// Check user is authenticated
await API.auth.getCurrentUser();

// Test protected endpoint
await API.cart.getItems();
```

### API Testing (curl)

```bash
# Register
curl -X POST http://127.0.0.1:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"SecurePass123!","password2":"SecurePass123!"}' \
  -c cookies.txt

# Login
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"SecurePass123!"}' \
  -c cookies.txt

# Access protected endpoint
curl http://127.0.0.1:8000/api/cart/ \
  -b cookies.txt

# Refresh token
curl -X POST http://127.0.0.1:8000/api/auth/refresh/ \
  -b cookies.txt \
  -c cookies.txt

# Logout
curl -X POST http://127.0.0.1:8000/api/auth/logout/ \
  -b cookies.txt
```

---

## Reference Links

- [Django REST Framework SimpleJWT](https://django-rest-framework-simplejwt.readthedocs.io/)
- [JWT.io](https://jwt.io/) - JWT token decoder and debugger
- [MDN: HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [OWASP: Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review browser console and network tab for errors
3. Check Django logs for backend errors
4. Verify all configuration settings match this documentation

**Last Updated**: 2025-12-04
