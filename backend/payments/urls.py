from django.urls import path
from .views import verify_signature

urlpatterns = [
    path('api/verify-signature', verify_signature, name='verify_signature'),
]