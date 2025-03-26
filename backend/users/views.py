from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from .models import UserProfile
import json
import re

@csrf_exempt
def associate_wallet(request):
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



@csrf_exempt
def check_wallet(request):
    if request.method == 'GET':
        wallet_address = request.GET.get('wallet_address')
        if not wallet_address:
            return JsonResponse({'success': False, 'message': 'La dirección de la wallet es obligatoria.'}, status=400)

        is_registered = UserProfile.objects.filter(wallet_address=wallet_address).exists()
        return JsonResponse({'success': True, 'isRegistered': is_registered})
    return JsonResponse({'success': False, 'message': 'Método no permitido.'}, status=405)