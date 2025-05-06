import { useEffect, useState } from "react";
import { Box, Heading, Grid, Button } from "@chakra-ui/react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { fetchProducts } from "@/features/company/api/products";
import { Product } from "@/shared/types/types";

export const ProductCatalogPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const { cart } = useCart();
  const navigate = useNavigate();

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