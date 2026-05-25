from rest_framework import serializers
from .models import Transaction, OrderItem
from company.models import Product

class ProductSummarySerializer(serializers.ModelSerializer):
    stock_quantity = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'amount_usd', 'stock_quantity'] 
        read_only_fields = fields


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