

# Creamos un decorador reutilizable que verifique el JWT enviado en la cabecera 
# Authorization: Bearer <token>, extraiga la wallet y la inserte en request.wallet_address. 

from functools import wraps
from django.http import JsonResponse
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from users.models import UserProfile

def wallet_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        header = request.META.get('HTTP_AUTHORIZATION', '')
        if not header.startswith('Bearer '):
            return JsonResponse({'error': 'Token JWT no proporcionado'}, status=401)
        token = header.split()[1]
        try:
            # Validar y decodificar el token
            auth = JWTAuthentication()
            validated_token = auth.get_validated_token(token)
            wallet = validated_token.get('wallet')
            if not wallet:
                return JsonResponse({'error': 'Token JWT sin wallet'}, status=401)
        except (InvalidToken, AuthenticationFailed) as e:
            return JsonResponse({'error': 'Token inválido'}, status=401)

        # Verificar que la wallet exista en UserProfile
        if not UserProfile.objects.filter(wallet_address__iexact=wallet).exists():
            return JsonResponse({'error': 'Wallet no registrada'}, status=401)

        # Inyectar la wallet en el request
        request.wallet_address = wallet
        return view_func(request, *args, **kwargs)
    return _wrapped_view
