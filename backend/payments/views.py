from decimal import Decimal
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from eth_account.messages import encode_defunct
from eth_account import Account
import json
from .utils.viem_client import get_transaction
from .models import Transaction
from web3 import Web3
from .services.coingecko import get_eth_price_in_fiat


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