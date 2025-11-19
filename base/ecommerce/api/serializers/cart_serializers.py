from rest_framework import serializers
from ecommerce.models.models import Cart, Product
from .product_serializers import ProductListSerializer


class CartItemSerializer(serializers.ModelSerializer):
    """Serializer for Cart items"""
    product = ProductListSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True
    )
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'product', 'product_id', 'quantity', 'total_price', 'added_at']
        read_only_fields = ['id', 'user', 'added_at', 'total_price']
