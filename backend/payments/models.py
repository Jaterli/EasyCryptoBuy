from django.db import models
from users.models import UserProfile
from company.models import Product

class Transaction(models.Model):
    transaction_hash = models.CharField(max_length=66, unique=True)
    wallet_address = models.CharField(max_length=42)
    token = models.CharField(max_length=10, default='USDT')
    amount = models.DecimalField(max_digits=36, decimal_places=18)  
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('failed', 'Failed')
    ], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.wallet_address} - {self.amount} - {self.status}"
    

class Cart(models.Model):
    user = models.OneToOneField(UserProfile, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()

    class Meta:
        unique_together = ('cart', 'product')    