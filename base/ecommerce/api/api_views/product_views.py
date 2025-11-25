from rest_framework import viewsets, filters
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


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Category CRUD operations
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']


class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Product CRUD operations with filtering and search
    """
    queryset = Product.objects.filter(is_active=True)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['product_type', 'category', 'is_featured', 'is_trending', 'artist']
    search_fields = ['title', 'description', 'artist']
    ordering_fields = ['price', 'created_at', 'title']
    lookup_field = 'slug'

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
    """
    queryset = Artist.objects.filter(is_active=True)
    serializer_class = ArtistSerializer
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'company']
    ordering_fields = ['name', 'debut_date']

    @action(detail=True, methods=['get'])
    def products(self, request, slug=None):
        """Get all products for a specific artist"""
        artist = self.get_object()
        products = Product.objects.filter(artist=artist.name, is_active=True)
        page = self.paginate_queryset(products)
        if page is not None:
            serializer = ProductListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)
