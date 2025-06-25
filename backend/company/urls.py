from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, company_dashboard, get_all_orders, get_all_transactions, get_all_users, get_transaction_detail, get_transaction_order_items, get_transactions_by_wallet, get_user_by_wallet, get_users_transactions_sumary, update_order_item_status, validate_cart

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
# router.register(r'sales', SaleViewSet, basename='sale')

urlpatterns = [
    path('', include(router.urls)),
    path('validate-cart', validate_cart, name='validate_cart'),
    path('get-all-users', get_all_users, name='get_all_users'),
    path('get-all-orders', get_all_orders, name='get_all_orders'),
    path('get-all-transactions', get_all_transactions, name='get_all_transactions'),    
    path('get-transactions-by-wallet/<str:wallet_address>', get_transactions_by_wallet, name='get_transactions_by_wallet'),
    path('company-dashboard', company_dashboard, name='company_dashboard'),    
    path('get-transaction-order-items/<int:transaction_id>', get_transaction_order_items, name='get_transaction-order-items'),
    path("get-users-transactions-sumary/", get_users_transactions_sumary, name="get_users_transactions_sumary"),
    path('get-user-by-wallet/<str:wallet_address>', get_user_by_wallet, name='get_user_by_wallet'),
    path('get-transaction-detail/<str:transaction_hash>/', get_transaction_detail, name='get_transaction_detail'),
    path('update-order-item-status/<int:order_item_id>/', update_order_item_status, name='update-order-item-status'),   
]

