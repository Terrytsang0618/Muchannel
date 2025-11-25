from rest_framework import serializers
from ecommerce.models import Category, Product, Artist


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model"""
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'icon', 'product_count', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class ProductListSerializer(serializers.ModelSerializer):
    """Serializer for Product list view"""
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'title', 'slug', 'price', 'product_type',
            'category_name', 'image', 'is_featured', 'is_trending',
            'in_stock', 'artist', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'in_stock']


class ProductDetailSerializer(serializers.ModelSerializer):
    """Serializer for Product detail view"""
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=False
    )
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'title', 'slug', 'description', 'price',
            'product_type', 'category', 'category_id', 'image', 'stock',
            'is_featured', 'is_trending', 'is_active',
            'artist', 'release_date', 'label', 'version',
            'average_rating', 'review_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'average_rating', 'review_count']

    def get_average_rating(self, obj):
        reviews = obj.reviews.all()
        if reviews:
            return round(sum(r.rating for r in reviews) / len(reviews), 1)
        return 0

    def get_review_count(self, obj):
        return obj.reviews.count()


class ArtistSerializer(serializers.ModelSerializer):
    """Serializer for K-pop Artist/Group"""
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Artist
        fields = [
            'id', 'name', 'slug', 'description', 'profile_image',
            'debut_date', 'company', 'is_active', 'product_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'product_count']

    def get_product_count(self, obj):
        return Product.objects.filter(artist=obj.name, is_active=True).count()
