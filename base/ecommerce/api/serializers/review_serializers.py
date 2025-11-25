from rest_framework import serializers
from ecommerce.models import Review


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for Product Reviews"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    product_title = serializers.CharField(source='product.title', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'product', 'product_title', 'user', 'user_username',
            'rating', 'comment', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value
