// ProductCatalogPage.tsx (actualizado)
import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Button,
  Alert,
  Input,
  HStack,
  VStack,
  Text,
  Select,
  Portal,
  createListCollection,
  SimpleGrid,
} from "@chakra-ui/react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { ProductCard } from "../components/ProductCard";
import { Product } from "@/shared/types/types";
import { API_PATHS } from "@/config/paths";
import axios from "axios";

export const ProductCatalogPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);

  const { cart } = useCart();
  const navigate = useNavigate();

  const categoryCollection = createListCollection({
    items: categories.map((cat) => ({
      label: cat === "all" ? "Todas las categorías" : cat,
      value: cat,
    })),
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get<Product[]>(
          `${API_PATHS.company}/products/`
        );
        setProducts(response.data);
        const uniqueCategories = Array.from(
          new Set(response.data.map((p) => p.category).filter(Boolean))
        ).sort();
        setCategories(["all", ...uniqueCategories]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar los productos"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    let filtered = [...products];
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(term) ||
          product.description?.toLowerCase().includes(term)
      );
    }
    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, products]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
  };

  if (isLoading) {
    return <Box p={6}>Cargando productos...</Box>;
  }

  if (error) {
    return (
      <Alert.Root status="error" m={4}>
        <Alert.Indicator />
        <Alert.Title>{error}</Alert.Title>
      </Alert.Root>
    );
  }

  return (
    <Box p={{ base: 4, md: 6 }} maxW="1400px" mx="auto">
      <Heading size="xl" mb={6}>Catálogo de Productos</Heading>

      <VStack align="stretch" mb={6} gap={4}>
        <HStack gap={4} flexWrap="wrap">
          <Box flex="2" minW="200px">
            <Input
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Box>

          <Box flex="1" minW="200px">
            <Select.Root
              collection={categoryCollection}
              value={[selectedCategory]}
              onValueChange={(e) => setSelectedCategory(e.value[0])}
            >
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder="Seleccionar categoría" />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content>
                    {categoryCollection.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        {item.label}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
          </Box>

          {(searchTerm || selectedCategory !== "all") && (
            <Button onClick={handleResetFilters} variant="ghost">
              Limpiar filtros
            </Button>
          )}
        </HStack>

        <Text fontSize="sm" color="gray.500">
          {filteredProducts.length} producto(s) encontrado(s)
        </Text>
      </VStack>

      {filteredProducts.length === 0 ? (
        <Box textAlign="center" py={10}>
          <Text fontSize="lg" color="gray.500">
            No se encontraron productos con los filtros seleccionados.
          </Text>
          <Button onClick={handleResetFilters} mt={4} variant="outline">
            Ver todos los productos
          </Button>
        </Box>
      ) : (
        <SimpleGrid 
          columns={{ base: 1, sm: 2, md: 3, lg: 4 }} 
          gap={6}
        >
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} variant="catalog" />
          ))}
        </SimpleGrid>
      )}

      {cart.length > 0 && (
        <Button
          colorScheme="blue"
          mt={8}
          onClick={() => navigate("/cart-summary")}
          position="fixed"
          bottom={4}
          right={4}
          boxShadow="lg"
          zIndex={100}
        >
          Carrito ({cart.length})
        </Button>
      )}
    </Box>
  );
};