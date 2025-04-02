from decimal import Decimal
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from eth_account.messages import encode_defunct
from eth_account import Account
import json
from .utils.viem_client import get_transaction
from .models import Transaction
from web3 import Web3
from .services.coingecko import get_eth_price_in_fiat
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from django.shortcuts import get_object_or_404
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from django.shortcuts import get_list_or_404


@csrf_exempt
def verify_signature(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            address = data['address']
            message = data['message']
            signature = data['signature']

            # Codificar el mensaje
            encoded_message = encode_defunct(text=message)

            # Recuperar la dirección desde la firma
            recovered_address = Account.recover_message(encoded_message, signature=signature)

            # Verificar que la dirección recuperada coincida con la dirección proporcionada
            if recovered_address.lower() == address.lower():
                return JsonResponse({'success': True, 'message': 'Firma verificada correctamente.'})
            else:
                return JsonResponse({'success': False, 'message': 'La firma no es válida.'}, status=400)
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)}, status=500)
    return JsonResponse({'success': False, 'message': 'Método no permitido.'}, status=405)


@csrf_exempt
def register_transaction(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            wallet_address = data['wallet_address']
            amount = data['amount']
            transaction_hash = data['transaction_hash']

            # Obtener la transacción desde la blockchain
            blockchain_tx = get_transaction(transaction_hash)

            if not blockchain_tx:
                return JsonResponse({'success': False, 'message': 'Transacción no encontrada en la blockchain.'}, status=400)

            # Validar los datos de la transacción
            if blockchain_tx['from'].lower() != wallet_address.lower():
                return JsonResponse({'success': False, 'message': 'La dirección de la billetera no coincide con la transacción en la blockchain.'}, status=400)

            if blockchain_tx['value'] != Web3.to_wei(amount, 'ether'):
                return JsonResponse({'success': False, 'message': 'El monto de la transacción no coincide con el registrado en la blockchain.'}, status=400)

            # Si la transacción es válida, guardarla en la base de datos
            transaction = Transaction.objects.create(
                wallet_address=wallet_address,
                amount=amount,
                transaction_hash=transaction_hash,
                status='confirmed'
            )

            return JsonResponse({'success': True, 'message': 'Transacción validada y registrada correctamente.', 'transaction_id': transaction.id})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)}, status=500)

    return JsonResponse({'success': False, 'message': 'Método no permitido.'}, status=405)



def eth_to_fiat(request):
    """ Retorna el precio de ETH en una moneda fiat específica """
    currency = request.GET.get("currency", "usd").lower()
    price = get_eth_price_in_fiat(currency)
    
    if price is not None:
        return JsonResponse({"success": True, "currency": currency, "price": price})
    else:
        return JsonResponse({"success": False, "message": "Error al obtener precio"}, status=500)
    


def generate_invoice(request, transaction_id):
    # Obtener la transacción
    transaction = get_object_or_404(Transaction, id=transaction_id)

    # Crear la respuesta HTTP como PDF
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="factura_{transaction.id}.pdf"'

    # Crear un documento PDF con ReportLab
    doc = SimpleDocTemplate(response, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()

    # Título de la factura
    title = Paragraph(f'<font size=18><b>Factura de Pago - #{transaction.id}</b></font>', styles['Title'])
    elements.append(title)
    elements.append(Spacer(1, 12))

    # Crear estilo personalizado para el hash
    hash_style = styles["Normal"]
    hash_style.fontSize = 9  # Tamaño reducido

    # Información de la transacción
    transaction_info = [
        ['ID de Transacción', str(transaction.id)],
        ['Fecha', str(transaction.created_at)],
        ['Wallet', transaction.wallet_address],
        ['Monto', f'{transaction.amount} ETH'],
        ['Hash de Transacción', Paragraph(transaction.transaction_hash, hash_style)],
        ['Estado', transaction.status]
    ]

    # Crear una tabla para mostrar la información de la transacción
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
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),  # Alinear todo al tope
        ('WORDWRAP', (1, 4), (1, 4), True),  # Específico para el hash
    ]))
    elements.append(table)

    # Resto del documento (igual que antes)
    elements.append(Spacer(1, 24))
    message = Paragraph(
        "<font size=12>Gracias por realizar el pago. Si tiene alguna duda, no dude en ponerse en contacto con nosotros.</font>",
        styles['Normal']
    )
    elements.append(message)
    elements.append(Spacer(1, 12))
    footer = Paragraph(
        "<font size=10><i>Este es un documento generado automáticamente. No requiere firma.</i></font>",
        styles['Normal']
    )
    elements.append(footer)

    doc.build(elements)
    return response



def get_user_transactions(request, wallet_address):
    transactions = get_list_or_404(Transaction, wallet_address=wallet_address)
    data = {
        'transactions': [
            {
                'id': transaction.id,
                'wallet_address': transaction.wallet_address,
                'amount': transaction.amount,
                'status': transaction.status,
                'transaction_hash': transaction.transaction_hash,
                'created_at' : transaction.created_at,
            }
            for transaction in transactions
        ]
    }
    return JsonResponse(data)
