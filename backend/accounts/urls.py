from django.urls import path
from .views import AdminLoginView

urlpatterns = [
    path("company-login/", AdminLoginView.as_view(), name="company-login"),
]
