from django.contrib import admin

from .models import Cart, CartItem, OrderItem, Transaction

admin.site.register(Transaction)
admin.site.register(Cart)
admin.site.register(CartItem)
admin.site.register(OrderItem)