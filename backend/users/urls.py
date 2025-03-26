from django.urls import path
from .views import associate_wallet, check_wallet

urlpatterns = [
    path('api/associate-wallet', associate_wallet, name='associate_wallet'),
    path('api/check-wallet', check_wallet, name='check_wallet'),
]