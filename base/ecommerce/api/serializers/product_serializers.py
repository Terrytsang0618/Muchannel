from rest_framework import serializers
from ecommerce.models import Category, Product, ProductImage, Artist


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model"""
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'icon', 'product_count', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer for Product Images"""
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'display_order', 'is_primary', 'created_at']
        read_only_fields = ['id', 'created_at']


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
        return Product.objects.filter(artist=obj, is_active=True).count()


class ProductListSerializer(serializers.ModelSerializer):
    """Serializer for Product list view"""
    category_id = serializers.CharField(source='category.id', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    artist_name = serializers.CharField(source='artist.name', read_only=True)
    artist_slug = serializers.CharField(source='artist.slug', read_only=True)
    original_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    discount_percentage = serializers.IntegerField(read_only=True)
    is_on_sale = serializers.BooleanField(read_only=True)
    is_new = serializers.BooleanField(read_only=True)
    is_pre_order = serializers.BooleanField(read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'title', 'slug', 'price', 'original_price', 'discount_percentage',
            'is_on_sale', 'product_type', 'category_id', 'category_name', 'primary_image',
            'is_featured', 'is_trending', 'is_new', 'is_pre_order', 'in_stock',
            'artist_name', 'artist_slug', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'in_stock']

    def get_primary_image(self, obj):
        """Get primary image from gallery"""
        # Try primary image first
        primary_img = obj.images.filter(is_primary=True).first()
        if primary_img:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(primary_img.image.url)
            return primary_img.image.url
        # Fallback to first image if no primary set
        first_img = obj.images.first()
        if first_img:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(first_img.image.url)
            return first_img.image.url
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    """Serializer for Product detail view"""
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=False
    )
    category_name = serializers.CharField(source='category.name', read_only=True)
    artist_details = ArtistSerializer(source='artist', read_only=True)
    artist_name = serializers.CharField(source='artist.name', read_only=True)
    artist_slug = serializers.CharField(source='artist.slug', read_only=True)
    artist_id = serializers.PrimaryKeyRelatedField(
        queryset=Artist.objects.all(),
        source='artist',
        write_only=True,
        required=False
    )
    images = ProductImageSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    original_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    discount_percentage = serializers.IntegerField(read_only=True)
    is_on_sale = serializers.BooleanField(read_only=True)
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'title', 'slug', 'description', 'price', 'original_price',
            'discount_percentage', 'is_on_sale', 'product_type', 'category',
            'category_id', 'category_name', 'images', 'stock', 'in_stock',
            'is_featured', 'is_trending', 'is_new', 'is_active', 'is_pre_order',
            'pre_order_start_date', 'pre_order_end_date', 'expected_ship_date',
            'artist_details', 'artist_name', 'artist_slug', 'artist_id', 'release_date',
            'label', 'version', 'includes_random_item', 'random_options',
            'bonus_items', 'average_rating', 'review_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'average_rating', 'review_count', 'in_stock']

    def get_average_rating(self, obj):
        reviews = obj.reviews.all()
        if reviews:
            return round(sum(r.rating for r in reviews) / len(reviews), 1)
        return 0

    def get_review_count(self, obj):
        return obj.reviews.count()
