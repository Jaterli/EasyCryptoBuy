from django.urls import path
from .views import verify_signature, register_transaction, eth_to_fiat

urlpatterns = [
    path('api/verify-signature', verify_signature, name='verify_signature'),
    path('api/register-transaction', register_transaction, name='register_transaction'),  
    path("eth-to-fiat/", eth_to_fiat, name="eth-to-fiat"),      
]