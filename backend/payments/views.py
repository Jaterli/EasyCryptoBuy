from decimal import Decimal, InvalidOperation
from django.http import Http404, JsonResponse, HttpResponse
from .utils.formatters import format_scientific_to_decimal
from .models import OrderItem, Transaction, Cart
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
from .serializers import CartSerializer, OrderItemSerializer, TransactionSerializer
from django.db import transaction
from users.decorators import wallet_required

# @api_view(["POST"])
# @permission_classes([AllowAny])
# def verify_signature(request):
#     try:
#         data = request.data
#         address = data['address']
#         message = data['message']
#         signature = data['signature']

#         encoded_message = encode_defunct(text=message)
#         recovered_address = Account.recover_message(encoded_message, signature=signature)

#         if recovered_address.lower() == address.lower():
#             return Response({'success': True, 'message': 'Firma verificada correctamente.'})
#         else:
#             return Response({'success': False, 'message': 'La firma no es válida.'}, status=400)
#     except Exception as e:
#         return Response({'success': False, 'message': str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def register_transaction(request):
    data = request.data
    wallet_address = data.get("wallet_address")
    amount = data.get("amount")
    token = data.get("token")

    if not all([wallet_address, amount, token]):
        return Response({"success": False, "message": "Faltan campos necesarios"}, status=400)

    try:
        amount = Decimal(amount)
    except (TypeError, InvalidOperation):
        return Response({"success": False, "message": "El campo 'amount' es inválido"}, status=400)

    transaction_hash = wallet_address  # Esto parece un placeholder, se actualizará después

    if Transaction.objects.filter(transaction_hash=transaction_hash).exists():
        return Response({"success": False, "message": "Ya hay una transacción pendiente para esta wallet"}, status=409)

    try:
        profile = UserProfile.objects.get(wallet_address=wallet_address)
    except UserProfile.DoesNotExist:
        return Response({"success": False, "message": "Usuario no encontrado"}, status=404)

    cart = Cart.objects.filter(user=profile, is_active=True).first()

    tx = Transaction.objects.create(
        wallet_address=wallet_address,
        amount=amount,
        transaction_hash=transaction_hash,
        token=token,
        status='pending',
    )

    if cart:
        # Relacionamos el carrito pero no lo marcamos como inactivo todavía
        cart.transaction = tx
        cart.save()

    return Response({
        "success": True,
        "message": "Transacción provisional registrada",
        "transaction_id": tx.id,
        "hash_placeholder": transaction_hash
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

    provider_url = getattr(settings, 'WEB3_PROVIDER', None)
    if not provider_url:
        return Response({"success": False, "message": "WEB3_PROVIDER_URL no configurado"}, status=500)

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

    # Actualizamos los campos básicos de la transacción
    tx.wallet_address = wallet_address
    tx.amount = amount
    tx.transaction_hash = transaction_hash
    tx.token = token
    tx.save()

    return Response({
        "success": True,
        "message": "Transacción actualizada exitosamente",
        "hash": transaction_hash,
    })



@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_transaction(request, transaction_id):
    try:
        transaction = Transaction.objects.get(id=transaction_id)

        if transaction.status != 'pending':
            return Response(
                {"success": False, "message": "Solo se pueden eliminar transacciones pendientes"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        transaction.delete()
        return Response(
            {"success": True, "message": "Transacción eliminada correctamente"},
            status=status.HTTP_200_OK
        )
        
    except Transaction.DoesNotExist:
        return Response(
            {"success": False, "message": "Transacción no encontrada"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"success": False, "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def check_pending_transactions(request, wallet_address):
    try:
        # Verificar si hay transacciones pendientes para esta wallet
        pending_transactions = Transaction.objects.filter(
            wallet_address=wallet_address,
            status='pending'
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


@api_view(["GET"])
@permission_classes([AllowAny])
def get_cart(request, wallet_address):
    wallet = wallet_address
    if not wallet:
        return Response({"error": "Wallet address is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        profile = UserProfile.objects.get(wallet_address=wallet)
        cart, _ = Cart.objects.get_or_create(user=profile, is_active=True)
        serializer = CartSerializer(cart)
        return Response(serializer.data)
    except UserProfile.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["POST"])
@permission_classes([AllowAny])
def save_cart(request):
    wallet = request.data.get("wallet")
    if not wallet:
        return Response({"error": "Wallet address is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        profile = UserProfile.objects.get(wallet_address=wallet)
        cart, _ = Cart.objects.get_or_create(user=profile, is_active=True)
        serializer = CartSerializer(cart, data=request.data, partial=False)
        if serializer.is_valid():
            serializer.save(user=profile)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except UserProfile.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["DELETE"])
@permission_classes([AllowAny])
def delete_cart(request, wallet_address):
    wallet = wallet_address
    if not wallet:
        return Response({"success": False, "error": "Wallet address is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():  # Todas las operaciones se ejecutan o ninguna. transaction viene de django.db
            profile = UserProfile.objects.get(wallet_address=wallet_address)
            cart = Cart.objects.get(user=profile)
            cart.delete_with_items()
            return Response({"success": True, "message": "Carrito eliminado"})
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

@api_view(["DELETE"])
@permission_classes([AllowAny])
def clear_cart(request, wallet_address):
    if not wallet_address:
        return Response({"success": False, "error": "Wallet address is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():
            profile = UserProfile.objects.get(wallet_address=wallet_address)
            cart = Cart.objects.get(user=profile, is_active=True)
            cart.cart_items.all().delete()  # Solo eliminamos los ítems
            return Response({"success": True, "message": "Ítems del carrito eliminados"})
    except UserProfile.DoesNotExist:
        return Response({"success": False, "error": "Perfil no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    except Cart.DoesNotExist:
        return Response({"success": False, "error": "Carrito no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_transaction_order_items(request, transaction_id):
    try:
        transaction = Transaction.objects.get(id=transaction_id)
    except Transaction.DoesNotExist:
        return Response({"success": False, "error": "Transacción no encontrada."}, status=status.HTTP_404_NOT_FOUND)

    order_items = OrderItem.objects.filter(transaction=transaction)
    serializer = OrderItemSerializer(order_items, many=True)
    return Response({"success": True, "orderItems":serializer.data}, status=status.HTTP_200_OK)