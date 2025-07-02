from rest_framework import serializers
from .models import Transaction, Cart, CartItem, OrderItem
from company.models import Product
from users.models import UserProfile

class ProductSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'amount_usd']
        read_only_fields = fields


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSummarySerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True
    )

    class Meta:
        model = CartItem
        fields = [
            'id', 
            'product', 
            'product_id', 
            'quantity',     
        ]

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("La cantidad debe ser mayor que cero")
        return value

class CartSerializer(serializers.ModelSerializer):
    cart_items = CartItemSerializer(many=True)
    user = serializers.PrimaryKeyRelatedField(
        queryset=UserProfile.objects.all(),
        default=serializers.CurrentUserDefault()
    )

    class Meta:
        model = Cart
        fields = [
            'id', 
            'user', 
            'is_active', 
            'cart_items', 
            'created_at', 
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


    def create(self, validated_data):
        cart_items_data = validated_data.pop('cart_items')
        cart = Cart.objects.create(**validated_data)
        
        for item_data in cart_items_data:
            product = item_data.pop('product')
            CartItem.objects.create(
                cart=cart,
                product=product,
                **item_data
            )
        return cart

    def update(self, instance, validated_data):
        cart_items_data = validated_data.pop('cart_items', None)
        
        if cart_items_data is not None:
            instance.cart_items.all().delete()
            for item_data in cart_items_data:
                product = item_data.pop('product')
                CartItem.objects.create(
                    cart=instance,
                    product=product,
                    **item_data
                )
        
        return super().update(instance, validated_data)

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSummarySerializer(read_only=True)
    subtotal = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id',
            'product',
            'quantity',
            'price_at_sale',
            'status',
            'status_display',
            'subtotal',
            'created_at'
        ]
        read_only_fields = fields

    def get_subtotal(self, obj):
        return obj.subtotal

class TransactionSerializer(serializers.ModelSerializer):
    order_items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    cart = serializers.PrimaryKeyRelatedField(
        queryset=Cart.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Transaction
        fields = [
            'id',
            'transaction_hash',
            'wallet_address',
            'token',
            'amount',
            'amount_usd',
            'status',
            'status_display',
            'created_at',
            'order_items',
            'cart'
        ]
        read_only_fields = [
            'id',
            'status_display',
            'created_at',
            'order_items',
            'amount_usd'
        ]

    def validate_transaction_hash(self, value):
        if Transaction.objects.filter(transaction_hash=value).exists():
            raise serializers.ValidationError("Esta transacción ya está registrada")
        return value