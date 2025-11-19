from rest_framework import serializers
from ecommerce.models.models import Order, OrderItem
from .product_serializers import ProductListSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for Order items"""
    product = ProductListSerializer(read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'price', 'total_price']
        read_only_fields = ['id', 'total_price']


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for Orders"""
    items = OrderItemSerializer(many=True, read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user', 'user_username', 'total_amount',
            'status', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'order_number', 'user', 'created_at', 'updated_at']
