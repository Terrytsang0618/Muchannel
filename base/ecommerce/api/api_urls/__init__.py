from django.urls import path, include
from rest_framework.routers import DefaultRouter
from ecommerce.api.api_views import (
    CategoryViewSet, ProductViewSet, ArtistViewSet,
    CartViewSet, OrderViewSet, ReviewViewSet,
    RegisterView, LoginView, LogoutView, RefreshTokenView, CurrentUserView
)

# Create a router and register viewsets
router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'artists', ArtistViewSet, basename='artist')
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'reviews', ReviewViewSet, basename='review')

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/refresh/', RefreshTokenView.as_view(), name='auth-refresh'),
    path('auth/me/', CurrentUserView.as_view(), name='auth-current-user'),

    # Router URLs (products, categories, etc.)
    path('', include(router.urls)),
]
