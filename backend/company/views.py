from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser, AllowAny
from .models import Product, Sale
from .serializers import ProductSerializer, SaleSerializer
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by("-created_at")
    serializer_class = ProductSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]  # Permite GET sin login
        return [IsAdminUser()]  # Protege POST, PUT, DELETE


class SaleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Sale.objects.select_related("product").all().order_by("-created_at")
    serializer_class = SaleSerializer
    permission_classes = [IsAdminUser]


@api_view(['POST'])
@permission_classes([AllowAny])
def validate_cart(request):
    try:
        items = request.data 
        invalid = []

        for item in items:
            product_id = item.get("id")
            quantity_requested = item.get("quantity")
            if not product_id or not isinstance(quantity_requested, int):
                continue

            try:
                product = Product.objects.get(id=product_id)
                if quantity_requested > product.quantity:
                    invalid.append({
                        "id": product_id,
                        "available": product.quantity
                    })
            except Product.DoesNotExist:
                invalid.append({ "id": product_id, "available": 0 })

        return JsonResponse({"invalid": invalid})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
