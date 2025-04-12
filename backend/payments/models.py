from django.db import models

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