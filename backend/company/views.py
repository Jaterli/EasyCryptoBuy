from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser, AllowAny
from .serializers import ProductSerializer
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_list_or_404
from users.models import UserProfile
from payments.models import Transaction
from .models import Product
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
from rest_framework.response import Response

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by("-created_at")
    serializer_class = ProductSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]  # Permite GET sin login
        return [IsAdminUser()]  # Protege POST, PUT, DELETE


# class SaleViewSet(viewsets.ReadOnlyModelViewSet):
#     queryset = Sale.objects.select_related("product").all().order_by("-created_at")
#     serializer_class = SaleSerializer
#     permission_classes = [IsAdminUser]


@api_view(['POST'])
@permission_classes([AllowAny])
def validate_cart(request):
    try:
        items = request.data 
        invalid = []

        for item in items:
            product_id = item.get("id")
            quantity_requested = item.get("quantity")
            if not product_id or not isinstance(quantity_requested, int):
                continue

            try:
                product = Product.objects.get(id=product_id)
                if quantity_requested > product.quantity:
                    invalid.append({
                        "id": product_id,
                        "available": product.quantity
                    })
            except Product.DoesNotExist:
                invalid.append({ "id": product_id, "available": 0 })

        return JsonResponse({"invalid": invalid})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_all_users(request):
    # Solo usuarios con perfil (filtra staff/admin si es necesario)
    profiles = UserProfile.objects.all().select_related('user')
    data = {
        'users': [
            {
                'id': profile.user.id,
                'username': profile.user.username,
                'wallet_address': profile.wallet_address,
                'name': profile.name,
                'email': profile.email,
                'created_at': profile.created_at
            }
            for profile in profiles
        ]
    }
    return JsonResponse(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_transactions_company(request, wallet_address):
    # Verificar que el usuario que hace la request es staff/empresa
    if not request.user.is_staff:
        return JsonResponse({'error': 'No autorizado'}, status=403)
    
    transactions = get_list_or_404(
        Transaction.objects.filter(wallet_address=wallet_address).order_by('-created_at')
    )
    data = {
        'transactions': [
            {
                'id': transaction.id,
                'wallet_address': transaction.wallet_address,
                'amount': transaction.amount,
                'status': transaction.status,
                'transaction_hash': transaction.transaction_hash,
                'created_at' : transaction.created_at,
                'token': transaction.token,
                'purchase_summary': transaction.purchase_summary,
            }
            for transaction in transactions
        ]
    }
    return JsonResponse(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def company_dashboard(request):
    # 1. KPIs principales
    thirty_days_ago = timezone.now() - timedelta(days=30)
    
    total_revenue = Transaction.objects.filter(
        status='confirmed'
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    active_users = UserProfile.objects.filter(
        transactions__status='confirmed',
        transactions__created_at__gte=thirty_days_ago
    ).distinct().count()
    
    total_transactions = Transaction.objects.count()
    
    inventory_value = Product.objects.aggregate(
        total=Sum('amount_usd')
    )['total'] or 0

    # 2. Datos para gráfico de transacciones
    transaction_data = Transaction.objects.filter(
        created_at__gte=timezone.now() - timedelta(days=7)
    ).extra({
        'date': "date(created_at)"
    }).values('date').annotate(
        amount=Sum('amount')
    ).order_by('date')

    # 3. Productos más vendidos
    top_products = Product.objects.annotate(
        sales=Sum('cartitem__quantity'),
        revenue=Sum('cartitem__quantity') * F('amount_usd')
    ).order_by('-sales')[:5]

    # 4. Últimas transacciones
    recent_transactions = Transaction.objects.select_related('cart__user').order_by('-created_at')[:10]

    return Response({
        'total_revenue': float(total_revenue),
        'active_users': active_users,
        'total_transactions': total_transactions,
        'inventory_value': float(inventory_value),
        'transaction_data': list(transaction_data),
        'top_products': [
            {
                'id': p.id,
                'name': p.name,
                'sales': p.sales or 0,
                'revenue': float(p.revenue or 0)
            }
            for p in top_products
        ],
        'recent_transactions': [
            {
                'id': t.id,
                'wallet_address': t.wallet_address,
                'amount': float(t.amount),
                'status': t.status,
                'created_at': t.created_at,
                'token': t.token
            }
            for t in recent_transactions
        ]
    })