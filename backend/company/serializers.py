from rest_framework import serializers
from .models import Product
from payments.models import OrderItem, Transaction, UserProfile


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class OrderItemSerializer(serializers.ModelSerializer):
    product = serializers.SerializerMethodField()
    transaction = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            'id',
            'product',
            'quantity',
            'price_at_sale',
            'subtotal',
            'status',
            'created_at',
            'transaction'
        ]

    def get_product(self, obj):
        return {
            'id': obj.product.id,
            'name': obj.product.name
        }

    def get_transaction(self, obj):
        return {
            'id': obj.transaction.id,
            'transaction_hash': obj.transaction.transaction_hash,
            'amount': str(obj.transaction.amount),
            'token': obj.transaction.token
        }

    def get_subtotal(self, obj):
        return str(obj.subtotal)
    

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['wallet_address', 'name', 'email', 'address', 'phone_number', 'birth_date', 'created_at', 'updated_at']

class TransactionSerializer(serializers.ModelSerializer):
    order_items = OrderItemSerializer(many=True)

    class Meta:
        model = Transaction
        fields = ('transaction_hash', 'wallet_address', 'token', 'amount', 'status', 'created_at', 'order_items')      
