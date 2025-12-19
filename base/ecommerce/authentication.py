from django.db.models.constraints import RawSQL
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication class that reads the JWT token from HttpOnly cookies
    instead of the Authorization header.
    """

    def authenticate(self, request):
        # Debug: Print request info
        print("\n" + "="*60)
        print(f"🔍 [AUTH] Request: {request.method} {request.path}")
        print(f"🔍 [AUTH] All cookies received: {dict(request.COOKIES)}")
        print(f"🔍 [AUTH] Cookie header: {request.META.get('HTTP_COOKIE', 'None')}")

        # First, try to get token from cookie
        raw_token = request.COOKIES.get('access_token')
        print(f"🔍 [AUTH] access_token cookie value: {raw_token[:50] + '...' if raw_token else 'None'}")
        print("="*60 + "\n")

        # If no token in cookie, try the standard Authorization header
        if raw_token is None:
            header = self.get_header(request)
            if header is None:
                return None

            raw_token = self.get_raw_token(header)

        if raw_token is None:
            return None

        # Validate the token
        validated_token = self.get_validated_token(raw_token)

        # Return the user and token
        return self.get_user(validated_token), validated_token
