from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication class that reads the JWT token from HttpOnly cookies
    instead of the Authorization header.
    """

    def authenticate(self, request):
        # First, try to get token from cookie
        raw_token = request.COOKIES.get('access_token')

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
