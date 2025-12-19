from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from ecommerce.models import Cart, Product
from ecommerce.api.serializers import CartItemSerializer


class CartViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Shopping Cart operations
    """
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """
        Add item to cart or update quantity if item already exists
        """
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))

        if not product_id:
            return Response(
                {'error': 'product_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if item already exists in cart
        cart_item, created = Cart.objects.get_or_create(
            user=request.user,
            product=product,
            defaults={'quantity': quantity}
        )

        if not created:
            # Item already exists, add to existing quantity
            cart_item.quantity += quantity
            cart_item.save()

        serializer = self.get_serializer(cart_item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['delete'])
    def clear(self, request):
        """Clear all items from cart"""
        self.get_queryset().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def total(self, request):
        """Get cart total"""
        cart_items = self.get_queryset()
        total = sum(item.total_price for item in cart_items)
        return Response({'total': total, 'items_count': cart_items.count()})

    @action(detail=False, methods=['get'], url_path='check/(?P<product_id>[^/.]+)')
    def check_product(self, request, product_id=None):
        """Check if a product is in the cart and return its quantity"""
        try:
            cart_item = Cart.objects.get(user=request.user, product_id=product_id)
            return Response({
                'in_cart': True,
                'quantity': cart_item.quantity,
                'cart_item_id': cart_item.id
            })
        except Cart.DoesNotExist:
            return Response({
                'in_cart': False,
                'quantity': 0
            })
