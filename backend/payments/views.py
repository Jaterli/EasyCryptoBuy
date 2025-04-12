from decimal import Decimal, InvalidOperation
from pathlib import Path
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from eth_account.messages import encode_defunct
from eth_account import Account
import json
from .utils.formatters import format_scientific_to_decimal
from .models import Transaction
from .services.coingecko import get_eth_price_in_fiat
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from django.shortcuts import get_object_or_404
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from django.shortcuts import get_list_or_404
import os
from web3 import Web3
import logging
from django.conf import settings
from django.views.decorators.http import require_GET

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



logger = logging.getLogger(__name__)
@csrf_exempt
def register_transaction(request):
    logger.debug("Iniciando register_transaction. Método: %s", request.method)
    
    if request.method != 'POST':
        logger.warning("Intento de acceso con método no permitido: %s", request.method)
        return JsonResponse({"success": False, "message": "Método no permitido"}, status=405)
    
    try:
        logger.debug("Parseando cuerpo de la solicitud...")
        data = json.loads(request.body)
        logger.debug("Datos recibidos: %s", data)
        
        # Extraer campos
        wallet_address = data.get("wallet_address")
        amount = data.get("amount")
        transaction_hash = data.get("transaction_hash")
        token = data.get("token")
        
        logger.debug(
            "Campos recibidos - wallet: %s, amount: %s, tx_hash: %s, token: %s",
            wallet_address, amount, transaction_hash, token
        )

        if not all([wallet_address, amount, transaction_hash, token]):
            logger.error("Faltan campos obligatorios. Campos recibidos: %s", data.keys())
            return JsonResponse({"success": False, "message": "Faltan campos necesarios"}, status=400)
        
        # Convertir amount a Decimal
        try:
            amount = Decimal(amount)
        except (TypeError, InvalidOperation):
            logger.error("Formato inválido para el campo amount: %s", amount)
            return JsonResponse({"success": False, "message": "El campo 'amount' es inválido"}, status=400)

        # Conexión Ethereum
        provider_url = getattr(settings, 'WEB3_PROVIDER', None)
        if not provider_url:
            logger.critical("WEB3_PROVIDER no configurado en settings.py")
            return JsonResponse({"success": False, "message": "WEB3_PROVIDER_URL no configurado"}, status=500)
        
        logger.debug("Conectando a Ethereum usando provider: %s", provider_url)
        web3 = Web3(Web3.HTTPProvider(provider_url))  
        
        if not web3.is_connected():
            logger.error("Error de conexión con el provider Ethereum: %s", provider_url)
            return JsonResponse({"success": False, "message": "No se pudo conectar a la red Ethereum"}, status=500)
        
        logger.info("Conexión exitosa a Ethereum. Chain ID: %s", web3.eth.chain_id)
        
        # Obtener recibo de la transacción
        logger.debug("Buscando recibo de transacción: %s", transaction_hash)
        try:
            tx_receipt = web3.eth.get_transaction_receipt(transaction_hash)
        except Exception as e:
            logger.exception("No se pudo obtener el recibo de la transacción")
            return JsonResponse({"success": False, "message": "Transacción no encontrada"}, status=404)
        
        if tx_receipt is None or tx_receipt.status != 1:
            logger.error("Transacción fallida o aún no confirmada. TX Hash: %s", transaction_hash)
            return JsonResponse({"success": False, "message": "Transacción fallida o no confirmada"}, status=400)

        # Obtener la transacción completa para verificar el remitente
        try:
            tx = web3.eth.get_transaction(transaction_hash)
            if tx['from'].lower() != wallet_address.lower():
                logger.warning(
                    "La dirección proporcionada (%s) no coincide con el remitente real (%s)",
                    wallet_address, tx['from']
                )
                return JsonResponse({"success": False, "message": "La dirección no coincide con el remitente"}, status=400)
        except Exception as e:
            logger.exception("Error al obtener los datos completos de la transacción")
            return JsonResponse({"success": False, "message": "No se pudo verificar el remitente de la transacción"}, status=500)

        # Verificar si la transacción ya fue registrada
        if Transaction.objects.filter(transaction_hash=transaction_hash).exists():
            logger.warning("Transacción ya registrada previamente: %s", transaction_hash)
            return JsonResponse({"success": False, "message": "La transacción ya ha sido registrada"}, status=409)

        # Cargar ABI del contrato
        base_dir = Path(__file__).resolve().parent
        abi_path = base_dir / 'abis' / 'PAYMENT_CONTRACT_ABI.json'
        logger.debug("Buscando ABI en: %s", abi_path)
        
        try:
            with open(str(abi_path), "r") as f:
                contract_abi = json.load(f)
        except FileNotFoundError:
            logger.exception("Archivo ABI no encontrado en la ruta especificada")
            return JsonResponse({"success": False, "message": "No se encontró el ABI del contrato"}, status=500)
        
        contract_address = os.environ.get("PAYMENT_CONTRACT_ADDRESS")
        if not contract_address:
            logger.critical("PAYMENT_CONTRACT_ADDRESS no configurado")
            return JsonResponse({"success": False, "message": "PAYMENT_CONTRACT_ADDRESS no configurado"}, status=500)
        
        logger.debug("Instanciando contrato en: %s", contract_address)
        try:
            contract = web3.eth.contract(
                address=web3.to_checksum_address(contract_address),
                abi=contract_abi
            )
        except Exception as e:
            logger.exception("Error instanciando el contrato")
            return JsonResponse({"success": False, "message": "No se pudo instanciar el contrato"}, status=500)
       
        # Registrar en BD
        logger.info("Creando registro de transacción en BD...")
        Transaction.objects.create(
            wallet_address=wallet_address,
            amount=amount,
            transaction_hash=transaction_hash,
            token=token,
            status='pending'
        )
        logger.info("Transacción registrada exitosamente. Hash: %s", transaction_hash)
        
        return JsonResponse({"success": True, "message": "Transacción registrada exitosamente"})
    
    except json.JSONDecodeError:
        logger.exception("Error decodificando JSON. Body recibido: %s", request.body)
        return JsonResponse({"success": False, "message": "JSON inválido"}, status=400)
    except Exception as e:
        logger.exception("Error inesperado en register_transaction")
        return JsonResponse({"success": False, "message": str(e)}, status=500)

    
def eth_to_fiat(request):
    currency = request.GET.get("currency", "usd").lower()
    price = get_eth_price_in_fiat(currency)
    if price is not None:
        return JsonResponse({"success": True, "currency": currency, "price": price})
    else:
        return JsonResponse({"success": False, "message": "Error al obtener precio"}, status=500)


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
            }
            for transaction in transactions
        ]
    }
    return JsonResponse(data)



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