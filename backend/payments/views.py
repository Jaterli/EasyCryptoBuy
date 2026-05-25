from decimal import Decimal, InvalidOperation
from django.http import Http404, JsonResponse, HttpResponse
from .utils.formatters import format_scientific_to_decimal
from .models import OrderItem, Transaction, Product
from reportlab.lib.pagesizes import letter
from django.shortcuts import get_object_or_404
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from django.conf import settings
from web3 import Web3
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from users.models import UserProfile
from .serializers import OrderItemSerializer, TransactionSerializer
from django.db import transaction
import logging

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def register_transaction(request):
    data = request.data
    wallet_address = data.get("wallet_address")
    amount = data.get("amount")
    token = data.get("token")
    cart_items_data = data.get("cart_items", [])  # Recibir items del frontend

    if not all([wallet_address, amount, token]):
        return Response({"success": False, "message": "Faltan campos necesarios"}, status=400)

    if not cart_items_data:
        return Response({"success": False, "message": "El carrito está vacío"}, status=400)

    try:
        amount = Decimal(amount)
    except (TypeError, InvalidOperation):
        return Response({"success": False, "message": "El campo 'amount' es inválido"}, status=400)

    # Verificación de WEB3_PROVIDER
    provider_url = getattr(settings, 'WEB3_PROVIDER', None)
    if not provider_url:
        return Response({"success": False, "message": "Servicio WEB3_PROVIDER sin servicio"}, status=500)

    web3 = Web3(Web3.HTTPProvider(provider_url))
    if not web3.is_connected():
        return Response({"success": False, "message": "No se pudo conectar a la red Ethereum"}, status=500)

    transaction_hash = wallet_address

    if Transaction.objects.filter(transaction_hash=transaction_hash, status='pending').exists():
        return Response({"success": False, "message": "Hay una transacción pendiente para esta wallet."}, status=409)

    try:
        profile = UserProfile.objects.get(wallet_address=wallet_address)
    except UserProfile.DoesNotExist:
        return Response({"success": False, "message": "Usuario no encontrado"}, status=404)

    # Validar stock y construir productos
    products_to_buy = []
    total_usd = Decimal('0')
    
    for item_data in cart_items_data:
        product_id = item_data.get('product_id')
        quantity = item_data.get('quantity')
        
        if not product_id or not quantity:
            return Response({"success": False, "message": "Datos de producto inválidos"}, status=400)
        
        try:
            product = Product.objects.get(id=product_id)
            
            # Verificar stock
            if product.stock_quantity < quantity:
                return Response({
                    "success": False,
                    "message": f"Stock insuficiente para {product.name}. Disponible: {product.stock_quantity}"
                }, status=400)
            
            products_to_buy.append({
                'product': product,
                'quantity': quantity
            })
            
            total_usd += product.amount_usd * quantity
            
        except Product.DoesNotExist:
            return Response({"success": False, "message": f"Producto {product_id} no encontrado"}, status=404)

    # Crear transacción y OrderItems
    with transaction.atomic():
        tx = Transaction.objects.create(
            wallet_address=wallet_address,
            amount=amount,
            amount_usd=total_usd,
            transaction_hash=transaction_hash,
            token=token,
            status='pending',
        )
        
        # Crear OrderItems y actualizar stock
        for item in products_to_buy:
            product = item['product']
            quantity = item['quantity']
            
            OrderItem.objects.create(
                transaction=tx,
                product=product,
                quantity=quantity,
                price_at_sale=product.amount_usd,
                status='pending'
            )
            
            # Actualizar stock
            product.stock_quantity = max(product.stock_quantity - quantity, 0)
            product.save()

    return Response({
        "success": True,
        "message": "Transacción registrada exitosamente",
        "transaction_id": tx.id,
        "hash_placeholder": transaction_hash,
        "items_count": len(products_to_buy)
    })


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_transaction(request, transaction_id):
    data = request.data
    wallet_address = data.get("wallet_address")
    amount = data.get("amount")
    transaction_hash = data.get("transaction_hash")
    token = data.get("token")

    if not all([transaction_id, wallet_address, amount, transaction_hash, token]):
        return Response({"success": False, "message": "Faltan campos necesarios"}, status=400)

    try:
        amount = Decimal(amount)
    except (TypeError, InvalidOperation):
        return Response({"success": False, "message": "El campo 'amount' es inválido"}, status=400)

    # Verificación de la transacción en blockchain
    provider_url = getattr(settings, 'WEB3_PROVIDER', None)
    if not provider_url:
        return Response({"success": False, "message": "Servicio WEB3_PROVIDER sin servicio"}, status=500)

    web3 = Web3(Web3.HTTPProvider(provider_url))
    if not web3.is_connected():
        return Response({"success": False, "message": "No se pudo conectar a la red Ethereum"}, status=500)

    try:
        tx_receipt = web3.eth.get_transaction_receipt(transaction_hash)
    except Exception:
        return Response({"success": False, "message": "Transacción no encontrada"}, status=404)

    if tx_receipt is None or tx_receipt.status != 1:
        return Response({"success": False, "message": "Transacción fallida o no confirmada"}, status=400)

    try:
        tx_data = web3.eth.get_transaction(transaction_hash)
        if tx_data['from'].lower() != wallet_address.lower():
            return Response({"success": False, "message": "La dirección no coincide con el remitente"}, status=400)
    except Exception:
        return Response({"success": False, "message": "No se pudo verificar el remitente de la transacción"}, status=500)

    try:
        tx = Transaction.objects.get(id=transaction_id)
    except Transaction.DoesNotExist:
        return Response({"success": False, "message": "Transacción no encontrada"}, status=404)

    if Transaction.objects.exclude(id=tx.id).filter(transaction_hash=transaction_hash).exists():
        return Response({"success": False, "message": "El hash ya está registrado en otra transacción"}, status=409)

    # Actualizar campos básicos de la transacción
    tx.wallet_address = wallet_address
    tx.amount = amount
    tx.transaction_hash = transaction_hash
    tx.token = token
    tx.save()

    return Response({
        "success": True,
        "message": "Transacción actualizada exitosamente",
        "hash": transaction_hash,
        "transaction_id": tx.id,
    })


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_transaction(request, transaction_id):
    try:
        # Obtener la transacción
        tx = Transaction.objects.get(id=transaction_id)

        # Solo permitir eliminar transacciones pendientes
        if tx.status != 'pending':
            return Response(
                {"success": False, "message": "Solo se pueden eliminar transacciones pendientes"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Usar atomic para asegurar que todo se ejecute correctamente o nada
        with transaction.atomic():
            # Obtener los OrderItems asociados a esta transacción
            order_items = OrderItem.objects.filter(transaction=tx)
            
            # Reponer el stock de cada producto
            items_restored = 0
            for order_item in order_items:
                product = order_item.product
                # Restaurar la cantidad que se había descontado
                product.stock_quantity += order_item.quantity
                product.save()
                items_restored += 1
                       
            # Eliminar la transacción (esto eliminará los OrderItems por CASCADE)
            tx.delete()
            
            return Response(
                {
                    "success": True, 
                    "message": f"Transacción eliminada correctamente. Se repusieron {items_restored} items al inventario."
                },
                status=status.HTTP_200_OK
            )
        
    except Transaction.DoesNotExist:
        return Response(
            {"success": False, "message": "Transacción no encontrada"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error al eliminar transacción {transaction_id}: {str(e)}")
        return Response(
            {"success": False, "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    

@api_view(["GET"])
@permission_classes([AllowAny])
def check_pending_transactions(request, wallet_address):
    try:
        # Verificar si hay transacciones pendientes o confirmando para esta wallet
        pending_transactions = Transaction.objects.filter(
            wallet_address=wallet_address,
            status__in=['pending', 'confirming']
        ).order_by('-created_at')
        
        return Response({
            "success": True,
            "has_pending": pending_transactions.exists(),
        })
        
    except Exception as e:
        return Response({
            "success": False,
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

@permission_classes([IsAuthenticated])
def generate_invoice(request, transaction_id):
    transaction = get_object_or_404(Transaction, id=transaction_id)
    order_items = transaction.order_items.select_related('product').all()

    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="factura_{transaction.id}.pdf"'
    
    doc = SimpleDocTemplate(response, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()

    # Título
    title = Paragraph(f'<font size=18><b>Factura de Pago - #{transaction.id}</b></font>', styles['Title'])
    elements.append(title)
    elements.append(Spacer(1, 12))

    # Información general de la transacción
    hash_style = styles["Normal"]
    hash_style.fontSize = 9
    transaction_info = [
        ['ID de Transacción', str(transaction.id)],
        ['Fecha', transaction.created_at.strftime('%Y-%m-%d %H:%M:%S')],
        ['Wallet', transaction.wallet_address],
        ['Monto', f'{format_scientific_to_decimal(transaction.amount)} {transaction.token}'],
        ['Hash de Transacción', Paragraph(transaction.transaction_hash, hash_style)],
        ['Estado', transaction.status.title()],
    ]
    table = Table(transaction_info, colWidths=[200, 350])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 24))

    # Tabla de productos
    if order_items:
        elements.append(Paragraph("<b>Productos Comprados:</b>", styles['Heading4']))
        elements.append(Spacer(1, 6))

        product_data = [['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal']]
        total = 0

        for item in order_items:
            subtotal = item.subtotal
            total += subtotal
            product_data.append([
                item.product.name,
                str(item.quantity),
                f"{item.price_at_sale:.2f} {transaction.token}",
                f"{subtotal:.2f} {transaction.token}"
            ])

        product_data.append(['', '', 'Total:', f"{total:.2f} {transaction.token}"])

        product_table = Table(product_data, colWidths=[200, 100, 120, 130])
        product_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ALIGN', (1, 1), (-1, -2), 'CENTER'),
            ('ALIGN', (-2, -1), (-1, -1), 'RIGHT'),
        ]))
        elements.append(product_table)
        elements.append(Spacer(1, 24))
    else:
        elements.append(Paragraph("<i>No se encontraron productos asociados a esta transacción.</i>", styles['Normal']))
        elements.append(Spacer(1, 24))

    # Mensaje final
    elements.append(Paragraph(
        "<font size=12>Gracias por realizar el pago. Si tiene alguna duda, no dude en ponerse en contacto con nosotros.</font>",
        styles['Normal']
    ))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(
        "<font size=10><i>Este es un documento generado automáticamente. No requiere firma.</i></font>",
        styles['Normal']
    ))

    doc.build(elements)
    return response


@api_view(["GET"])
@permission_classes([IsAuthenticated])
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
@permission_classes([AllowAny])
def get_transaction_detail(request, tx_hash):
    try:
        transaction = Transaction.objects.get(transaction_hash=tx_hash)
        serializer = TransactionSerializer(transaction)
        return Response({'success': True, 'data': serializer.data})
    except Transaction.DoesNotExist:
        return Response({'success': False, 'error': f'Transacción con hash {tx_hash} no encontrada'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_transaction_order_items(request, transaction_id):
    try:
        transaction = Transaction.objects.get(id=transaction_id)
    except Transaction.DoesNotExist:
        return Response({"success": False, "error": "Transacción no encontrada."}, status=status.HTTP_404_NOT_FOUND)

    order_items = OrderItem.objects.filter(transaction=transaction)
    serializer = OrderItemSerializer(order_items, many=True)
    return Response({"success": True, "orderItems": serializer.data}, status=status.HTTP_200_OK)