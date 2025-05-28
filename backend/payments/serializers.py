from rest_framework import serializers
from .models import Cart, CartItem, OrderItem
from company.models import Product

class CartItemSerializer(serializers.ModelSerializer):
    product_id = serializers.PrimaryKeyRelatedField(source='product', queryset=Product.objects.all())
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_description = serializers.CharField(source='product.description', read_only=True)
    product_price = serializers.DecimalField(source='product.amount_usd', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ('id', 'product_id', 'product_name', 'product_description', 'product_price', 'quantity')


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True)

    class Meta:
        model = Cart
        fields = ('id', 'user', 'items', 'created_at', 'updated_at')
        read_only_fields = ('user',)

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        cart = Cart.objects.create(**validated_data)
        for item_data in items_data:
            CartItem.objects.create(cart=cart, **item_data)
        return cart

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        instance.items.all().delete()
        for item_data in items_data:
            CartItem.objects.create(cart=instance, **item_data)
        instance.save()
        return instance


class ProductSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'description']


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSummarySerializer()

    class Meta:
        model = OrderItem
        fields = ['product', 'quantity', 'price_at_sale']