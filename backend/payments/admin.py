from django.contrib import admin

from .models import Cart, CartItem, Transaction

admin.site.register(Transaction)
admin.site.register(Cart)
admin.site.register(CartItem)