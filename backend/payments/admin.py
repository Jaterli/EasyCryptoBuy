from django.contrib import admin

from .models import OrderItem, Transaction

admin.site.register(Transaction)
admin.site.register(OrderItem)