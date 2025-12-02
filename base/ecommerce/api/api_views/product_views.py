from rest_framework import viewsets, filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from ecommerce.models import Category, Product, Artist
from ecommerce.api.serializers import (
    CategorySerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    ArtistSerializer,
)


class ReadOnlyOrAuthenticatedPermission(permissions.BasePermission):
    """
    Custom permission to allow:
    - Anonymous users: GET requests only (list, retrieve)
    - Authenticated users: All operations (POST, PUT, PATCH, DELETE)
    """
    def has_permission(self, request, view):
        # Allow GET, HEAD, OPTIONS for everyone (anonymous users)
        if request.method in permissions.SAFE_METHODS:
            return True
        # For other methods (POST, PUT, PATCH, DELETE), require authentication
        return request.user and request.user.is_authenticated


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Category CRUD operations
    GET: Available to all users (anonymous included)
    POST/PUT/PATCH/DELETE: Requires authentication

    Query Parameters:
    - parent_slug: Filter categories by parent category slug (e.g., ?parent_slug=music)
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [ReadOnlyOrAuthenticatedPermission]
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']

    def get_queryset(self):
        """
        Override to filter by parent category slug if provided
        """
        queryset = Category.objects.all()

        # Filter by parent category slug (e.g., ?parent_slug=music)
        parent_slug = self.request.query_params.get('parent_slug', None)
        if parent_slug:
            # Get parent category by slug
            try:
                parent_category = Category.objects.get(slug=parent_slug, parent__isnull=True)
                # Return only subcategories of this parent
                queryset = queryset.filter(parent=parent_category)
            except Category.DoesNotExist:
                # If parent doesn't exist, return empty queryset
                queryset = queryset.none()

        return queryset


class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Product CRUD operations with filtering and search
    GET: Available to all users (anonymous included)
    POST/PUT/PATCH/DELETE: Requires authentication

    Query Parameters:
    - category_ids: Comma-separated category IDs (e.g., ?category_ids=4,5)
    - parent_category: Filter by parent category slug (e.g., ?parent_category=music)
    """
    queryset = Product.objects.filter(is_active=True)
    permission_classes = [ReadOnlyOrAuthenticatedPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['product_type', 'category', 'is_featured', 'is_trending', 'artist']
    search_fields = ['title', 'description', 'artist__name']
    ordering_fields = ['price', 'created_at', 'title']
    lookup_field = 'slug'

    def get_queryset(self):
        """
        Override to filter by category IDs or parent category slug
        """
        queryset = Product.objects.filter(is_active=True)

        # Filter by specific category IDs (e.g., ?category_ids=4,5)
        category_ids = self.request.query_params.get('category_ids', None)
        if category_ids:
            try:
                # Parse comma-separated IDs
                id_list = [int(id.strip()) for id in category_ids.split(',')]
                queryset = queryset.filter(category_id__in=id_list)
            except (ValueError, TypeError):
                # If parsing fails, return empty queryset
                queryset = queryset.none()

        # Filter by parent category slug (e.g., ?parent_category=music)
        parent_category = self.request.query_params.get('parent_category', None)
        if parent_category:
            try:
                # Get parent category and its subcategories
                parent_cat = Category.objects.get(slug=parent_category, parent__isnull=True)
                subcategory_ids = Category.objects.filter(parent=parent_cat).values_list('id', flat=True)
                queryset = queryset.filter(category_id__in=subcategory_ids)
            except Category.DoesNotExist:
                # If parent doesn't exist, return empty queryset
                queryset = queryset.none()

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductDetailSerializer

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured products"""
        featured_products = self.queryset.filter(is_featured=True)
        serializer = ProductListSerializer(featured_products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def trending(self, request):
        """Get trending products"""
        trending_products = self.queryset.filter(is_trending=True)
        serializer = ProductListSerializer(trending_products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def albums(self, request):
        """Get all albums"""
        albums = self.queryset.filter(product_type='album')
        page = self.paginate_queryset(albums)
        if page is not None:
            serializer = ProductListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = ProductListSerializer(albums, many=True)
        return Response(serializer.data)


class ArtistViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Artist CRUD operations
    GET: Available to all users (anonymous included)
    POST/PUT/PATCH/DELETE: Requires authentication
    """
    queryset = Artist.objects.filter(is_active=True)
    serializer_class = ArtistSerializer
    permission_classes = [ReadOnlyOrAuthenticatedPermission]
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'company']
    ordering_fields = ['name', 'debut_date']

    @action(detail=True, methods=['get'])
    def products(self, request, slug=None):
        """Get all products for a specific artist"""
        artist = self.get_object()
        products = Product.objects.filter(artist=artist, is_active=True)
        page = self.paginate_queryset(products)
        if page is not None:
            serializer = ProductListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)
