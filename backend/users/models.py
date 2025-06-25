from django.db import models
from django.contrib.auth.models import User
from django.core.validators import RegexValidator
from datetime import date

class UserProfile(models.Model):
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='profile'
    )
    wallet_address = models.CharField(
        max_length=42, 
        unique=True,
        verbose_name="Dirección de Wallet"
    )
    name = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        verbose_name="Nombre completo"
    )
    email = models.EmailField(
        blank=True, 
        null=True,
        verbose_name="Correo electrónico"
    )
    
    # Nuevos campos
    address = models.TextField(
        blank=True,
        null=True,
        verbose_name="Dirección postal"
    )
    
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="El teléfono debe tener formato: '+999999999'. Hasta 15 dígitos."
    )
    phone_number = models.CharField(
        validators=[phone_regex],
        max_length=17,
        blank=True,
        null=True,
        verbose_name="Teléfono"
    )
    
    birth_date = models.DateField(
        blank=True,
        null=True,
        verbose_name="Fecha de nacimiento"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de creación"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Última actualización"
    )

    def __str__(self):
        return f"{self.user.username} - {self.wallet_address}"

    @property
    def age(self):
        """Calcula la edad basada en la fecha de nacimiento"""
        if self.birth_date:
            today = date.today()
            return today.year - self.birth_date.year - (
                (today.month, today.day) < (self.birth_date.month, self.birth_date.day)
            )
        return None

    class Meta:
        verbose_name = "Perfil de Usuario"
        verbose_name_plural = "Perfiles de Usuario"
        ordering = ['-created_at']