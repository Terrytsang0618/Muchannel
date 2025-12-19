# Login Modal Implementation

## Overview

The login/register modal system provides a seamless authentication experience for users. The modal appears automatically when:
1. User clicks "Login" or "Register" in the header menu
2. User tries to perform an action that requires authentication (e.g., adding to cart)
3. User's session expires

## File Structure

```
base/
├── ecommerce/
│   └── templates/
│       ├── includes/
│       │   ├── header.html           # Header with auth menu
│       │   └── login_modal.html      # Login/Register modal template
│       └── layout.html                # Main layout (includes modal)
└── static/
    └── js/
        ├── api.js                     # API service with auth endpoints
        ├── auth.js                    # Original auth manager (backup)
        ├── auth-ui.js                 # Authentication UI state handler
        └── main.js                    # Main app logic
```

## Components

### 1. Login Modal Template (`includes/login_modal.html`)

A reusable modal component that includes:
- **Login Form**: Username/email and password fields
- **Register Form**: Username, email, password, and password confirmation
- **Form Switching**: Easy toggle between login and register modes
- **Error Handling**: Displays API error messages
- **Success Feedback**: Shows success messages before redirecting

**Features:**
- Responsive design with POLO template styling
- Client-side form validation
- Password confirmation matching
- Remember me checkbox
- Forgot password link placeholder
- Terms & conditions checkbox for registration

### 2. Header Menu (`includes/header.html`)

Updated header with dynamic menu items:

**For Anonymous Users:**
- Login link (opens modal)
- Register link (opens modal)

**For Authenticated Users:**
- Profile
- My Orders
- Wishlist
- Settings
- Logout

### 3. Authentication UI Handler (`js/auth-ui.js`)

Manages header menu visibility based on authentication state:

**Functions:**
- `updateHeaderMenu()` - Updates menu items based on auth status
- `handleLogout()` - Handles user logout
- `requireAuth(callback)` - Requires authentication before action
- Listens for `auth:session-expired` event

### 4. Updated Main.js

Modified `addToCart()` function to:
1. Check authentication status
2. Show login modal if not authenticated
3. Proceed with cart operation if authenticated

## API Integration

### Authentication Endpoints

```javascript
// Login
POST /api/auth/login/
Body: { username: string, password: string }
Response: { user: {...}, message: string }
Cookies: access_token, refresh_token (HttpOnly)

// Register
POST /api/auth/register/
Body: { username: string, email: string, password: string, password2: string }
Response: { user: {...}, message: string }
Cookies: access_token, refresh_token (HttpOnly)

// Logout
POST /api/auth/logout/
Response: { message: string }
Cookies: Cleared

// Get Current User
GET /api/auth/me/
Response: { id, username, email, ... }
```

### Cookie-Based Authentication

- JWT tokens stored in **HttpOnly cookies** for security
- `access_token`: 1 hour lifetime
- `refresh_token`: 7 days lifetime
- Automatic token refresh on 401 errors (handled in `api.js`)

## Usage

### Opening the Modal Programmatically

```javascript
// Open login form
openAuthModal('login');

// Open register form
openAuthModal('register');
```

### Closing the Modal

```javascript
closeAuthModal();
```

### Requiring Authentication

```javascript
// Wrap action in authentication check
requireAuth(function() {
    // This code only runs if user is authenticated
    addToCart(productId);
});
```

## User Flow

### Login Flow

1. User clicks "Login" in header menu
2. Modal opens with login form
3. User enters credentials
4. Form submits to `/api/auth/login/`
5. On success:
   - Cookies are set automatically
   - Success message displays
   - Page reloads after 1 second
   - Header menu updates to show user menu
6. On error:
   - Error message displays in modal
   - User can retry

### Register Flow

1. User clicks "Register" in header menu
2. Modal opens with register form
3. User fills out form
4. Client-side validation (password match)
5. Form submits to `/api/auth/register/`
6. On success:
   - Account created and user automatically logged in
   - Cookies are set
   - Welcome message displays
   - Page reloads after 1 second
7. On error:
   - Detailed error messages display
   - User can correct and retry

### Logout Flow

1. User clicks "Logout" in header menu
2. API call to `/api/auth/logout/`
3. Cookies are cleared
4. Success message displays
5. Page reloads
6. Header menu shows login/register links

### Protected Action Flow (Add to Cart)

1. User clicks "Add to Cart" button
2. `addToCart()` checks authentication
3. If NOT authenticated:
   - Login modal opens automatically
   - Error notification displays
4. If authenticated:
   - Item added to cart
   - Cart count updates
   - Success notification displays

## Styling

The modal uses POLO template styling with custom enhancements:

- **Modal Backdrop**: Semi-transparent black overlay
- **Modal Dialog**: Centered, max-width 500px
- **Form Controls**: Rounded corners, focus states
- **Buttons**: Primary color with hover effects
- **Alerts**: Bootstrap-style success/error messages

## Security Features

1. **HttpOnly Cookies**: Prevents XSS attacks
2. **CSRF Protection**: Built into Django and axios
3. **Password Confirmation**: Validates matching passwords
4. **Secure Flags**: Can be enabled for HTTPS in production
5. **Token Refresh**: Automatic refresh on expiration

## Testing

### Manual Testing Steps

1. **Test Login:**
   - Click login → enter valid credentials → should login
   - Click login → enter invalid credentials → should show error

2. **Test Register:**
   - Click register → fill form → should create account
   - Try registering with existing username → should show error

3. **Test Logout:**
   - While logged in → click logout → should logout

4. **Test Protected Actions:**
   - While logged out → try adding to cart → should show login modal
   - While logged in → try adding to cart → should work

5. **Test Modal:**
   - Click backdrop → should close modal
   - Press ESC key → should close modal
   - Switch between login/register → should work

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## Known Limitations

1. Password reset functionality is placeholder (not implemented)
2. "Remember me" checkbox doesn't extend token lifetime (future enhancement)
3. Social login not implemented (future enhancement)

## Future Enhancements

- [ ] Password reset functionality
- [ ] Email verification
- [ ] Social authentication (Google, Facebook, etc.)
- [ ] Two-factor authentication
- [ ] Remember me persistence
- [ ] User profile avatars in header
- [ ] Real-time session monitoring

## Troubleshooting

### Modal doesn't appear
- Check browser console for JavaScript errors
- Verify `login_modal.html` is included in layout
- Verify `auth-ui.js` is loaded

### Login fails
- Check API endpoint is accessible
- Verify CORS settings in Django
- Check credentials are correct
- Check browser cookies are enabled

### Session expires too quickly
- Adjust token lifetime in Django settings
- Check refresh token is working

### Styling issues
- Verify POLO template CSS is loaded
- Check for CSS conflicts
- Clear browser cache

## Debug Mode

Enable console logging by checking browser console:
- `🔐 [AUTH]` - Authentication events
- `🎨 [AUTH-UI]` - UI state changes
- `🌐 [API]` - API calls
- `✅` - Success events
- `❌` - Error events

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify API endpoints are working
3. Test with network tab open
4. Check Django logs for server errors
