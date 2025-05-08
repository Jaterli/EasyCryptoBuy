from django.urls import path
from .views import get_wallet_nonce, register_wallet, check_wallet, wallet_auth

urlpatterns = [
    path('register-wallet', register_wallet, name='register_wallet'),
    path('check-wallet/<str:wallet_address>', check_wallet, name='check_wallet'),
    path('get-wallet-nonce/<str:wallet_address>', get_wallet_nonce, name='get_wallet_nonce'),
    path('wallet-auth', wallet_auth, name='wallet_auth'),
]