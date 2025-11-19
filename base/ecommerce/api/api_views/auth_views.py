from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from ecommerce.api.serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserProfileSerializer,
)


class RegisterView(generics.CreateAPIView):
    """User registration endpoint"""
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate tokens
        refresh = RefreshToken.for_user(user)

        # Create response
        response = Response({
            'user': UserProfileSerializer(user).data,
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)

        # Set tokens in HttpOnly cookies
        response.set_cookie(
            key='access_token',
            value=str(refresh.access_token),
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite='Lax',
            max_age=3600  # 1 hour
        )
        response.set_cookie(
            key='refresh_token',
            value=str(refresh),
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite='Lax',
            max_age=86400 * 7  # 7 days
        )

        return response


class LoginView(APIView):
    """User login endpoint with JWT tokens in HttpOnly cookies"""
    permission_classes = (permissions.AllowAny,)
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data['username']
        password = serializer.validated_data['password']

        user = authenticate(username=username, password=password)

        if user is None:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Generate tokens
        refresh = RefreshToken.for_user(user)

        # Create response
        response = Response({
            'user': UserProfileSerializer(user).data,
            'message': 'Login successful'
        }, status=status.HTTP_200_OK)

        # Set tokens in HttpOnly cookies
        response.set_cookie(
            key='access_token',
            value=str(refresh.access_token),
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite='Lax',
            max_age=3600  # 1 hour
        )
        response.set_cookie(
            key='refresh_token',
            value=str(refresh),
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite='Lax',
            max_age=86400 * 7  # 7 days
        )

        return response


class LogoutView(APIView):
    """User logout endpoint - clears JWT cookies"""
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        try:
            # Get refresh token from cookie
            refresh_token = request.COOKIES.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()  # Requires 'rest_framework_simplejwt.token_blacklist' in INSTALLED_APPS
        except Exception:
            pass

        response = Response({
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)

        # Clear cookies
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')

        return response


class RefreshTokenView(APIView):
    """Refresh access token using refresh token from cookie"""
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')

        if not refresh_token:
            return Response(
                {'error': 'Refresh token not found'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)

            response = Response({
                'message': 'Token refreshed successfully'
            }, status=status.HTTP_200_OK)

            # Set new access token in HttpOnly cookie
            response.set_cookie(
                key='access_token',
                value=access_token,
                httponly=True,
                secure=False,  # Set to True in production with HTTPS
                samesite='Lax',
                max_age=3600  # 1 hour
            )

            return response

        except (TokenError, InvalidToken) as e:
            return Response(
                {'error': 'Invalid refresh token'},
                status=status.HTTP_401_UNAUTHORIZED
            )


class CurrentUserView(APIView):
    """Get current authenticated user"""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
