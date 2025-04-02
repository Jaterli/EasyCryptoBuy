from django.urls import path
from .views import register_wallet, check_wallet

urlpatterns = [
    path('register-wallet', register_wallet, name='register_wallet'),
    path('check-wallet', check_wallet, name='check_wallet'),
]