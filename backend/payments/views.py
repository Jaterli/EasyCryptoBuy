from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from eth_account.messages import encode_defunct
from eth_account import Account
import json

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