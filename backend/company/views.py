from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser
from .models import Product, Sale
from .serializers import ProductSerializer, SaleSerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by("-created_at")
    serializer_class = ProductSerializer
    permission_classes = [IsAdminUser]

class SaleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Sale.objects.select_related("product").all().order_by("-created_at")
    serializer_class = SaleSerializer
    permission_classes = [IsAdminUser]
