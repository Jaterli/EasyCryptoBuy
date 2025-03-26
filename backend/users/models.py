from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    wallet_address = models.CharField(max_length=42, unique=True)  # Dirección de la wallet (0x...)
    name = models.CharField(max_length=100, blank=True, null=True)  # Nombre del usuario
    email = models.EmailField(blank=True, null=True)  # Correo electrónico del usuario
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.wallet_address}"