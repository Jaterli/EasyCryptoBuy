from django.db import models
from users.models import UserProfile
from company.models import Product
import json

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
    cart = models.ForeignKey("Cart", on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    purchase_summary = models.JSONField(null=True, blank=True)  # Nuevo campo para el resumen
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.wallet_address} - {self.amount} - {self.status}"

    def generate_purchase_summary(self):
        if not self.cart:
            return None
        
        summary = {
            'products': [],
            'total_usd': 0,
            'items_count': 0
        }
        
        for item in self.cart.items.all():
            product_data = {
                'id': item.product.id,
                'name': item.product.name,
                'description': item.product.description,
                'price_usd': str(item.product.amount_usd),
                'quantity': item.quantity,
                'subtotal': str(item.product.amount_usd * item.quantity)
            }
            summary['products'].append(product_data)
            summary['total_usd'] += float(product_data['subtotal'])
            summary['items_count'] += item.quantity
        
        summary['total_usd'] = str(summary['total_usd'])
        return summary
        

class Cart(models.Model):
    user = models.OneToOneField(UserProfile, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clear(self):
        """Elimina todos los items del carrito."""
        self.items.all().delete()  # Gracias a related_name='items'
        # Opcional: Reiniciar campos adicionales si es necesario
        self.save()
        
    def delete_with_items(self):
        """Elimina el carrito y todos sus items (eliminación completa)."""
        self.clear()  # Primero borra los items
        super().delete()  # Luego borra el carrito

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()

    class Meta:
        unique_together = ('cart', 'product')    