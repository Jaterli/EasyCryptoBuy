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
        return f"{self.wallet_address} - {self.transaction_hash} - {self.amount} - {self.status}"
        

class Cart(models.Model):
    user = models.ForeignKey( 
        UserProfile, 
        on_delete=models.CASCADE, 
        related_name='carts' 
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    transaction = models.OneToOneField(
        'Transaction',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cart'
    )

    def __str__(self):
        return f"Cart #{self.id} for {self.user.user.username}. Active: {self.is_active}"
    
    def clear_items(self):
        self.cart_items.all().delete()

    class Meta:
        # Constraints para asegurar que solo un carrito activo por usuario
        constraints = [
            models.UniqueConstraint(
                fields=['user'], 
                condition=models.Q(is_active=True),
                name='unique_active_cart_per_user'
            )
        ]


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='cart_items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    price_at_sale = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    def __str__(self):
        return f"{self.quantity} x {self.product.name} (Cart #{self.cart.id})"
    
    class Meta:
        unique_together = ('cart', 'product')    
        verbose_name = 'Cart Item'
        verbose_name_plural = 'Cart Items'


class OrderItem(models.Model):
    STATUS_CHOICES = [
        ('pending', 'pendiente'),
        ('processed', 'tramitado'),
        ('shipped', 'enviado'),
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
