import time
from venv import logger
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from .models import UserProfile
import json
import re
import uuid
from django.core.cache import cache
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from hexbytes import HexBytes
from web3 import Web3
from eth_account.messages import encode_defunct
from rest_framework_simplejwt.tokens import RefreshToken

@api_view(['GET'])
@permission_classes([AllowAny]) 
def get_wallet_nonce(request, wallet_address):
    nonce = str(uuid.uuid4())
    # Guardar el nonce temporalmente (5 min) asociado a la wallet
    cache.set(f"wallet_nonce_{wallet_address}", nonce, timeout=300)
    logger.error(f"Nonce cacheado: {nonce}")

    return Response({'nonce': nonce})


@api_view(['POST'])
@permission_classes([AllowAny]) 
def wallet_auth(request):
    wallet = request.data.get('wallet_address', '')
    signature = request.data.get('signature')
    signed_message = request.data.get('message')
    
    if not all([wallet, signature, signed_message]):
        return Response({'error': 'Missing authentication data'}, status=400)

    try:
        # Verificar wallet
        if not Web3.is_address(wallet):
            return Response({'error': 'Invalid wallet address'}, status=400)
            
        # Parsear mensaje JSON
        try:
            message_data = json.loads(signed_message)
            texto = message_data.get('texto', '')
            nonce = message_data.get('nonce')
            timestamp = message_data.get('timestamp')
            context = message_data.get('context', 'login')
            domain = message_data.get('domain', '')
            
            if not all([texto, nonce, timestamp]):
                return Response({'error': 'Missing required message fields'}, status=400)
                
        except json.JSONDecodeError:
            return Response({'error': 'Message must be valid JSON'}, status=400)
        except Exception as e:
            return Response({'error': f'Message parsing error: {str(e)}'}, status=400)
            
        # Verificar timestamp (2 minutos de validez)
        if int(time.time()) - int(timestamp) > 120:
            return Response({'error': 'Message expired'}, status=400)
            
        # Verificar nonce en caché
        cached_nonce = cache.get(f"wallet_nonce_{wallet}")
        if cached_nonce != nonce:
            return Response({'error': 'Invalid or expired nonce'}, status=401)
            
        # Verificar firma con el mensaje completo
        w3 = Web3()
        encoded_message = encode_defunct(text=signed_message)  # Usamos el JSON completo
        recovered_addr = w3.eth.account.recover_message(
            encoded_message,
            signature=HexBytes(signature)
        )
        
        if recovered_addr != wallet:
            return Response({'error': 'Signature verification failed'}, status=401)
            
        # Verificar dominio si es necesario
        allowed_domains = ["localhost"]  # Configurar según necesidad
        if domain and allowed_domains and domain not in allowed_domains:
            return Response({'error': 'Unauthorized domain'}, status=403)
            
        # Obtener usuario
        try:
            profile = UserProfile.objects.get(wallet_address__iexact=wallet)
        except UserProfile.DoesNotExist:
            return Response({'error': 'Wallet not registered'}, status=401)
            
        # Invalidar nonce
        cache.delete(f"wallet_nonce_{wallet}")
        
        # Generar tokens (igual que antes)
        refresh = RefreshToken.for_user(profile.user)
        refresh['wallet'] = wallet
        refresh['auth_type'] = 'wallet'
        
        return Response({
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh)
        })
        
    except Exception as e:
        logger.error(f"Auth error: {str(e)}", exc_info=True)
        return Response({'error': 'Authentication failed'}, status=500)    
    

@csrf_exempt
def register_wallet(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            wallet_address = data['wallet_address']
            name = data.get('name')  # Nombre del usuario (opcional)
            email = data.get('email')  # Correo electrónico del usuario (opcional)

            # Validar que la dirección de la wallet esté presente
            if not wallet_address:
                return JsonResponse({'success': False, 'message': 'La dirección de la wallet es obligatoria.'}, status=400)

            # Validar que el nombre no esté vacío
            if name and not name.strip():
                return JsonResponse({'success': False, 'message': 'El nombre no puede estar vacío.'}, status=400)

            # Validar el formato del correo electrónico
            if email:
                email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
                if not re.match(email_regex, email):
                    return JsonResponse({'success': False, 'message': 'El correo electrónico no es válido.'}, status=400)

                # Validar que el correo electrónico no esté asociado a otra cuenta
                if UserProfile.objects.filter(email=email).exists():
                    return JsonResponse({'success': False, 'message': 'El correo electrónico ya está asociado a otra cuenta.'}, status=400)

            # Verificar si la wallet ya está asociada a un usuario
            if UserProfile.objects.filter(wallet_address=wallet_address).exists():
                return JsonResponse({'success': False, 'message': 'La wallet ya está asociada a un usuario.'}, status=400)

            # Crear un nuevo usuario (o usar uno existente)
            user, created = User.objects.get_or_create(
                username=wallet_address,  # Usar la wallet como nombre de usuario
                defaults={'email': email} if email else {}
            )

            # Si se proporciona un nombre, actualizar el campo `first_name` del usuario
            if name:
                user.first_name = name
                user.save()

            # Crear el perfil de usuario y asociar la wallet
            UserProfile.objects.create(
                user=user,
                wallet_address=wallet_address,
                name=name,
                email=email
            )

            return JsonResponse({'success': True, 'message': 'Wallet asociada correctamente.'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)}, status=500)
    return JsonResponse({'success': False, 'message': 'Método no permitido.'}, status=405)



@api_view(["GET"])
@permission_classes([AllowAny])
def check_wallet(request, wallet_address):
    if request.method == 'GET':
        if not wallet_address:
            return JsonResponse({'success': False, 'message': 'La dirección de la wallet es obligatoria.'}, status=400)

        is_registered = UserProfile.objects.filter(wallet_address=wallet_address).exists()
        return JsonResponse({'success': True, 'isRegistered': is_registered})
    return JsonResponse({'success': False, 'message': 'Método no permitido.'}, status=405)