import { useEffect, useState } from "react";
import { Box, Heading, Grid, Button } from "@chakra-ui/react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { Product } from "@/shared/types/Product";
import { ProductCard } from "../components/ProductCard";
import { fetchProducts } from "@/features/company/api/products";
import { useCartSync } from "../hooks/useCartSync";

export const ProductCatalogPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const { cart, addToCart } = useCart();
  const navigate = useNavigate();

  useCartSync(); // Hook que sincroniza el carrito automáticamente

  useEffect(() => {
    fetchProducts().then(setProducts);
  }, []);

  return (
    <Box padding="6">
      <Heading marginBottom="4">Catálogo de Productos</Heading>

      <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap="6">
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onAddToCart={() => addToCart(product)} 
          />
        ))}
      </Grid>
        
      {cart.length > 0 && (
        <Button colorPalette="blue" marginTop="8" onClick={() => navigate("/cart-sumary")}>
          Carrito ({cart.length})
        </Button>
      )}
    </Box>
  );
};