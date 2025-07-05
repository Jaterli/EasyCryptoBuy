import { useEffect, useState } from "react";
import { Box, Heading, Grid, Button, Alert } from "@chakra-ui/react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { Product } from "@/shared/types/types";
import { API_PATHS } from "@/config/paths";
import axios from "axios";

export const ProductCatalogPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { cart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get<Product[]>(
          `${API_PATHS.company}/products/`
        );
        setProducts(response.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar los productos"
        );
        console.error("Error fetching products:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (isLoading) {
    return <Box padding="6">Cargando productos...</Box>;
  }

  if (error) {
    return (
    <Alert.Root status="error" mb={4}>
      <Alert.Indicator />
      <Alert.Title>{error}</Alert.Title>
    </Alert.Root>
    )
  }


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