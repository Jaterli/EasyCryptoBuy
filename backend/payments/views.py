from decimal import Decimal, InvalidOperation
from pathlib import Path
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
import json

from .utils.formatters import format_scientific_to_decimal
from .models import Transaction, Cart, CartItem
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from django.shortcuts import get_object_or_404
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from django.shortcuts import get_list_or_404
import logging
from django.conf import settings
from django.views.decorators.http import require_GET
from web3 import Web3
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from users.models import UserProfile
from .serializers import CartSerializer, TransactionSerializer
from django.db import transaction


@csrf_exempt
def verify_signature(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            address = data['address']
            message = data['message']
            signature = data['signature']

            encoded_message = encode_defunct(text=message)
            recovered_address = Account.recover_message(encoded_message, signature=signature)

            if recovered_address.lower() == address.lower():
                return JsonResponse({'success': True, 'message': 'Firma verificada correctamente.'})
            else:
                return JsonResponse({'success': False, 'message': 'La firma no es válida.'}, status=400)
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)}, status=500)
    return JsonResponse({'success': False, 'message': 'Método no permitido.'}, status=405)



# logger = logging.getLogger(__name__)
@csrf_exempt
def register_transaction(request):
    if request.method != 'POST':
        return JsonResponse({"success": False, "message": "Método no permitido"}, status=405)

    try:
        data = json.loads(request.body)
        wallet_address = data.get("wallet_address")
        amount = data.get("amount")
        transaction_hash = data.get("transaction_hash")
        token = data.get("token")

        if not all([wallet_address, amount, transaction_hash, token]):
            return JsonResponse({"success": False, "message": "Faltan campos necesarios"}, status=400)

        try:
            amount = Decimal(amount)
        except (TypeError, InvalidOperation):
            return JsonResponse({"success": False, "message": "El campo 'amount' es inválido"}, status=400)

        provider_url = getattr(settings, 'WEB3_PROVIDER', None)
        if not provider_url:
            return JsonResponse({"success": False, "message": "WEB3_PROVIDER_URL no configurado"}, status=500)

        web3 = Web3(Web3.HTTPProvider(provider_url))
        if not web3.is_connected():
            return JsonResponse({"success": False, "message": "No se pudo conectar a la red Ethereum"}, status=500)

        try:
            tx_receipt = web3.eth.get_transaction_receipt(transaction_hash)
        except Exception:
            return JsonResponse({"success": False, "message": "Transacción no encontrada"}, status=404)

        if tx_receipt is None or tx_receipt.status != 1:
            return JsonResponse({"success": False, "message": "Transacción fallida o no confirmada"}, status=400)

        try:
            tx = web3.eth.get_transaction(transaction_hash)
            if tx['from'].lower() != wallet_address.lower():
                return JsonResponse({"success": False, "message": "La dirección no coincide con el remitente"}, status=400)
        except Exception:
            return JsonResponse({"success": False, "message": "No se pudo verificar el remitente de la transacción"}, status=500)

        if Transaction.objects.filter(transaction_hash=transaction_hash).exists():
            return JsonResponse({"success": False, "message": "La transacción ya ha sido registrada"}, status=409)

        profile = UserProfile.objects.get(wallet_address=wallet_address)
        cart = Cart.objects.filter(user=profile).first()

        # Crear la transacción
        tx = Transaction.objects.create(
            wallet_address=wallet_address,
            amount=amount,
            transaction_hash=transaction_hash,
            token=token,
            status='pending',
            cart=cart
        )

        # Generar y guardar el resumen de compra
        if cart:
            tx.purchase_summary = tx.generate_purchase_summary()
            tx.save()

            # Actualizar stock de productos
            for item in cart.items.all():
                product = item.product
                product.quantity = max(product.quantity - item.quantity, 0)
                product.save()

            # # Crear registro de venta para cada producto
            # for item in cart.items.all():
            #     Sale.objects.create(
            #         product=item.product,
            #         customer_name=profile.name if profile.name else "",
            #         customer_wallet=wallet_address,
            #         usd_price=item.product.amount_usd,
            #         token_symbol=token,
            #         token_amount=amount,
            #     )

        return JsonResponse({"success": True, "message": "Transacción registrada exitosamente", "hash": transaction_hash})

    except json.JSONDecodeError:
        return JsonResponse({"success": False, "message": "JSON inválido"}, status=400)
    except UserProfile.DoesNotExist:
        return JsonResponse({"success": False, "message": "Usuario no encontrado"}, status=404)
    except Exception as e:
        return JsonResponse({"success": False, "message": str(e)}, status=500)
    
    
    
def generate_invoice(request, transaction_id):
    transaction = get_object_or_404(Transaction, id=transaction_id)
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="factura_{transaction.id}.pdf"'
    doc = SimpleDocTemplate(response, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()
    title = Paragraph(f'<font size=18><b>Factura de Pago - #{transaction.id}</b></font>', styles['Title'])
    elements.append(title)
    elements.append(Spacer(1, 12))
    hash_style = styles["Normal"]
    hash_style.fontSize = 9
    transaction_info = [
        ['ID de Transacción', str(transaction.id)],
        ['Fecha', str(transaction.created_at)],
        ['Wallet', transaction.wallet_address],
        ['Monto', f'{format_scientific_to_decimal(transaction.amount)} {transaction.token}'],
        ['Hash de Transacción', Paragraph(transaction.transaction_hash, hash_style)],
        ['Estado', transaction.status]
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
        ('WORDWRAP', (1, 4), (1, 4), True),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 24))
    message = Paragraph("<font size=12>Gracias por realizar el pago. Si tiene alguna duda, no dude en ponerse en contacto con nosotros.</font>", styles['Normal'])
    elements.append(message)
    elements.append(Spacer(1, 12))
    footer = Paragraph("<font size=10><i>Este es un documento generado automáticamente. No requiere firma.</i></font>", styles['Normal'])
    elements.append(footer)
    doc.build(elements)
    return response


def get_user_transactions(request, wallet_address):
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
@permission_classes([AllowAny])
def get_transaction_details(request, tx_hash):
    try:
        transaction = Transaction.objects.get(transaction_hash=tx_hash)
        serializer = TransactionSerializer(transaction)
        return Response({
            "success": True,
            "transaction": serializer.data
        })
    except Transaction.DoesNotExist:
        return Response({
            "success": False,
            "message": "Transacción no encontrada"
        }, status=status.HTTP_404_NOT_FOUND)
    


@require_GET
def transaction_details(request):
    """
    Endpoint para obtener todos los datos de una transacción registrada.
    Se requiere el parámetro GET 'txHash'.
    """
    tx_hash = request.GET.get("txHash")
    if not tx_hash:
        return JsonResponse({
            "success": False,
            "message": "El parámetro 'txHash' es obligatorio."
        }, status=400)
    
    try:
        transaction = Transaction.objects.get(transaction_hash=tx_hash)
    except Transaction.DoesNotExist:
        return JsonResponse({
            "success": False,
            "message": "Transacción no encontrada."
        }, status=404)
    
    # Se arman los datos a retornar.
    data = {
        "wallet_address": transaction.wallet_address,
        "amount": transaction.amount,
        "token": transaction.token,
        "transaction_hash": transaction.transaction_hash,
        "status": transaction.status,
        "created_at": transaction.created_at.isoformat() if hasattr(transaction, 'created_at') else None,
        "updated_at": transaction.updated_at.isoformat() if hasattr(transaction, 'updated_at') else None,
    }
    
    return JsonResponse({
        "success": True,
        "transaction": data
    })



@api_view(["GET"])
@permission_classes([AllowAny])
def get_cart(request, wallet_address):
    wallet = wallet_address
    if not wallet:
        return Response({"error": "Wallet address is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        profile = UserProfile.objects.get(wallet_address=wallet)
        cart, _ = Cart.objects.get_or_create(user=profile)
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
        cart, _ = Cart.objects.get_or_create(user=profile)
        serializer = CartSerializer(cart, data=request.data, partial=False)
        if serializer.is_valid():
            serializer.save(user=profile)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except UserProfile.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(["DELETE"])
@permission_classes([AllowAny])
def clear_cart(request, wallet_address):
    wallet = wallet_address
    if not wallet:
        return Response({"error": "Wallet address is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():  # Todas las operaciones se ejecutan o ninguna
            profile = UserProfile.objects.get(wallet_address=wallet_address)
            cart = Cart.objects.get(user=profile)
            cart.delete_with_items()
            return Response({"success": True, "message": "Carrito vaciado"})
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)