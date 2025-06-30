from rest_framework import serializers
from .models import Transaction, Cart, CartItem, OrderItem
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
    cart_items = CartItemSerializer(many=True)

    class Meta:
        model = Cart
        fields = ('id', 'user', 'cart_items', 'created_at', 'updated_at')
        read_only_fields = ('user',)

    def create(self, validated_data):
        cart_items_data = validated_data.pop('cart_items')
        cart = Cart.objects.create(**validated_data)
        for item_data in cart_items_data:
            CartItem.objects.create(cart=cart, **item_data)
        return cart

    def update(self, instance, validated_data):
        cart_items_data = validated_data.pop('cart_items', [])
        instance.cart_items.all().delete()
        for item_data in cart_items_data:
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
        fields = ['id', 'product', 'quantity', 'price_at_sale', 'status', 'subtotal', 'created_at']


class TransactionSerializer(serializers.ModelSerializer):
    order_items = OrderItemSerializer(many=True)

    class Meta:
        model = Transaction
        fields = ('id','transaction_hash', 'wallet_address', 'token', 'amount', 'status', 'created_at', 'order_items')      

