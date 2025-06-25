from rest_framework import viewsets, status
from rest_framework.permissions import IsAdminUser, AllowAny
from .serializers import OrderItemSerializer, ProductSerializer, UserProfileSerializer, TransactionSerializer
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from users.models import UserProfile
from payments.models import OrderItem, Transaction
from .models import Product
from django.db.models import Sum, Count, F, DecimalField, Max
from django.db.models.functions import TruncDay
from django.utils import timezone
from datetime import timedelta



class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by("-created_at")
    serializer_class = ProductSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]  # Permite GET sin login
        return [IsAdminUser()]  # Protege POST, PUT, DELETE


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
@permission_classes([IsAdminUser])
def get_all_users(request):
    # Solo usuarios con perfil (filtra staff/admin si es necesario)
    profiles = UserProfile.objects.all().select_related('user')
    data = {
        'users': [
            {
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
@permission_classes([IsAdminUser])
def get_transactions_by_wallet(request, wallet_address):

    try:
        transactions = Transaction.objects.filter(wallet_address=wallet_address).order_by('-created_at')

    except Transaction.DoesNotExist:
        return Response({"success": False, "error": "No se han encontrado transacciones."}, status=status.HTTP_404_NOT_FOUND)

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
            }
            for transaction in transactions
        ]
    }
    return JsonResponse(data)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def get_all_transactions(request):

    try:
        transactions = Transaction.objects.select_related('cart__user').order_by('-created_at')

    except Transaction.DoesNotExist:
        return Response({"success": False, "error": "No se han encontrado transacciones."}, status=status.HTTP_404_NOT_FOUND)

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
            }
            for transaction in transactions
        ]
    }
    return JsonResponse(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def company_dashboard(request):
    # Fechas para filtros
    thirty_days_ago = timezone.now() - timedelta(days=30)
    since_days_ago = timezone.now() - timedelta(days=365)
    
    # 1. KPIs principales
    ## Ingresos totales (solo transacciones confirmadas)
    total_revenue = Transaction.objects.filter(
        status='confirmed'
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    ## Usuarios activos (transacciones en los últimos 30 días)
    active_users = UserProfile.objects.filter(
        wallet_address__in=Transaction.objects.filter(
            status='confirmed',
            created_at__gte=thirty_days_ago
        ).values_list('wallet_address', flat=True).distinct()
    ).count()

    ## Total de transacciones históricas
    total_transactions = Transaction.objects.count()
    
    ## Valor del inventario (suma de precio * cantidad)
    inventory_value = Product.objects.aggregate(
        total_value=Sum(F('amount_usd') * F('quantity'), 
        output_field=DecimalField(max_digits=20, decimal_places=2))
    )['total_value'] or 0

    # 2. Productos más vendidos (basado en OrderItems)
    top_products = OrderItem.objects.values(
        'product__id', 'product__name'
    ).annotate(
        total_sold=Sum('quantity'),
        total_revenue=Sum(F('quantity') * F('price_at_sale'))
    ).order_by('-total_sold')[:5]

    # 3. Transacciones recientes (últimas 10 confirmadas)
    recent_transactions = Transaction.objects.select_related('cart__user').order_by('-created_at')[:10].values(
        'id', 'wallet_address', 'amount', 'token', 'status', 'created_at'
    )

    # 4. Datos para gráfico de transacciones (últimos 7 días)
    transaction_trend = Transaction.objects.filter(
        status='confirmed',
        created_at__gte=since_days_ago
    ).annotate(
        day=TruncDay('created_at')
    ).values('day').annotate(
        daily_amount=Sum('amount'),
        transaction_count=Count('id')
    ).order_by('day')

    return Response({
        'total_revenue': float(total_revenue),
        'active_users': active_users,
        'total_transactions': total_transactions,
        'inventory_value': float(inventory_value),
        'top_products': [
            {
                'id': p['product__id'],
                'name': p['product__name'],
                'units_sold': p['total_sold'],
                'revenue': float(p['total_revenue'])
            }
            for p in top_products
        ],
        'recent_transactions': [
            {
                'id': t['id'],
                'wallet_address': t['wallet_address'],
                'amount': float(t['amount']),
                'token': t['token'],
                'status': t['status'],
                'created_at': t['created_at']
            }
            for t in recent_transactions
        ],
        'transaction_trend': [
            {
                'date': t['day'],
                'amount': float(t['daily_amount']),
                'count': t['transaction_count']
            }
            for t in transaction_trend
        ]
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_all_orders(request):
    try:
        # Obtener todas las órdenes ordenadas por fecha descendente
        orders = OrderItem.objects.select_related(
            'product', 
            'transaction'
        ).order_by('-created_at')
        
        serializer = OrderItemSerializer(orders, many=True)
        return Response({
            'success': True,
            'orders': serializer.data
        })
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_transaction_order_items(request, transaction_id):
    try:
        transaction = Transaction.objects.get(id=transaction_id)
    except Transaction.DoesNotExist:
        return Response({"success": False, "error": "Transacción no encontrada."}, status=status.HTTP_404_NOT_FOUND)

    order_items = OrderItem.objects.filter(transaction=transaction)
    serializer = OrderItemSerializer(order_items, many=True)
    return Response({"success": True, "orderItems":serializer.data}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def get_users_transactions_sumary(request):
    users = UserProfile.objects.all()

    data = []
    for user in users:
        wallet = user.wallet_address        
        transactions = Transaction.objects.filter(wallet_address=wallet)  # Si tienes related_name='transactions' en UserProfile
               
        confirmed_count = transactions.filter(status='confirmed').count()
        pending_count = transactions.filter(status='pending').count()
        failed_count = transactions.filter(status='failed').count()
        total_spent = transactions.filter(status='confirmed').aggregate(total=Sum('amount'))['total'] or 0
        last_tx = transactions.aggregate(last=Max('created_at'))['last']

        data.append({
            "username": user.user.username,
            "email": user.user.email,
            "wallet_address": wallet,
            "confirmed": confirmed_count,
            "pending": pending_count,
            "failed": failed_count,
            "total_spent": float(total_spent),
            "last_transaction": last_tx
        })

    return Response({"users": data})


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_user_by_wallet(request, wallet_address):
    try:
        user_profile = UserProfile.objects.get(wallet_address__iexact=wallet_address)
        serializer = UserProfileSerializer(user_profile)
        return Response({'data': serializer.data})
    except UserProfile.DoesNotExist:
        return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_transaction_detail(request, transaction_hash):

    try:
        transaction = Transaction.objects.get(transaction_hash=transaction_hash)
        serializer = TransactionSerializer(transaction)
        return Response({'data': serializer.data})
    except Transaction.DoesNotExist:
        return Response({'error': 'Transacción no encontrada'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def update_order_item_status(request, order_item_id):
    order_item = get_object_or_404(OrderItem, id=order_item_id)
    new_status = request.data.get('status')

    if new_status not in dict(OrderItem.STATUS_CHOICES):
        return Response({'error': 'Estado inválido'}, status=status.HTTP_400_BAD_REQUEST)

    order_item.status = new_status
    order_item.save()
    return Response({'message': 'Estado actualizado'})

