from django.db import models

class Transaction(models.Model):
    wallet_address = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=18, decimal_places=8)  
    transaction_hash = models.CharField(max_length=255, unique=True)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('failed', 'Failed')
    ], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.wallet_address} - {self.amount} - {self.status}"