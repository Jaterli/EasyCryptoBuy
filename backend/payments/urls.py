from django.urls import path
from .views import verify_signature, register_transaction, eth_to_fiat, generate_invoice, get_user_transactions, transaction_details

urlpatterns = [
    path('verify-signature', verify_signature, name='verify_signature'),
    path('register-transaction', register_transaction, name='register_transaction'),  
    path("eth-to-fiat/", eth_to_fiat, name="eth-to-fiat"),      
    path('generate-invoice/<int:transaction_id>/', generate_invoice, name='generate_invoice'),   
    path('transactions/<str:wallet_address>/', get_user_transactions, name='get_user_transactions'),     
    path('transaction-details', transaction_details, name='transaction_details'),     
]
