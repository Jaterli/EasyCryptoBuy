from django.urls import path
from .views import check_pending_transactions, delete_transaction, get_transaction_detail, get_transaction_order_items, get_transactions_by_wallet, register_transaction, update_transaction, generate_invoice

urlpatterns = [
    path('register-transaction', register_transaction, name='register_transaction'),  
    path('update-transaction/<int:transaction_id>', update_transaction, name='update_transaction'),  
    path('delete-transaction/<int:transaction_id>', delete_transaction, name='delete-transaction'),    
    path('generate-invoice/<int:transaction_id>', generate_invoice, name='generate_invoice'),   
    path('get-transactions-by-wallet/<str:wallet_address>', get_transactions_by_wallet, name='get_transactions_by_wallet'),     
    path('check-pending-transactions/<str:wallet_address>/', check_pending_transactions, name='check_pending_transactions'),    
    path('get-transaction-detail/<str:tx_hash>', get_transaction_detail, name='get_transaction_detail'),
    path('get-transaction-order-items/<int:transaction_id>', get_transaction_order_items, name='get_transaction-order-items'),
]

