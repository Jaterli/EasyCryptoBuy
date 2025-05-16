from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, company_dashboard, get_all_users, get_user_transactions_company, validate_cart

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
# router.register(r'sales', SaleViewSet, basename='sale')

urlpatterns = [
    path('', include(router.urls)),
    path('validate-cart', validate_cart, name='validate_cart'),
    path('get-all-users', get_all_users, name='get_all_users'),
    path('get-user-transactions-company/<str:wallet_address>', get_user_transactions_company, name='get-user-transactions-company'),
    path('dashboard', company_dashboard, name='company_dashboard'),    

]

