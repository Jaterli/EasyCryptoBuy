from django.db import models
from users.models import UserProfile
from company.models import Product

class Transaction(models.Model):
    transaction_hash = models.CharField(max_length=66, unique=True)
    wallet_address = models.CharField(max_length=42)
    token = models.CharField(max_length=10, default='USDT')
    amount = models.DecimalField(max_digits=36, decimal_places=18)
    amount_usd = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pendiente'),      # Registrada, no enviada a blockchain
        ('confirming', 'Confirmando'), # Enviada a blockchain, esperando confirmación
        ('confirmed', 'Confirmada'),   # Confirmada en blockchain
        ('failed', 'Fallida'),         # Falló o expiró
        ('cancelled', 'Cancelada'),    # Cancelada por el usuario o sistema        
    ], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.wallet_address} - {self.transaction_hash} - {self.amount} - {self.status}"
        

class OrderItem(models.Model):
    STATUS_CHOICES = [
        ('pending', 'pendiente'),
        ('processed', 'procesado'),
        ('shipped', 'enviado'),
        ('cancelled', 'cancelado'),
    ]

    transaction = models.ForeignKey(
        'Transaction', 
        on_delete=models.CASCADE,
        related_name='order_items'
    )
    product = models.ForeignKey(
        'company.Product', 
        on_delete=models.PROTECT
    )
    quantity = models.PositiveIntegerField()
    price_at_sale = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )

    def __str__(self):
        return f"Order: {self.quantity} x {self.product.name} @ {self.price_at_sale}"

    @property
    def subtotal(self):
        return self.price_at_sale * self.quantity
