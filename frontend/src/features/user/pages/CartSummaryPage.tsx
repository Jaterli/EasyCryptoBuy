// CartSummaryPage.tsx (simplificado)
import { Box, Heading, Text, Button, SimpleGrid, Flex, Stack } from "@chakra-ui/react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { FaShoppingCart } from "react-icons/fa";
import { RiDeleteBin3Line } from "react-icons/ri";
import { GrTransaction } from "react-icons/gr";
import { ProductCard } from "../components/ProductCard";

export const CartSummaryPage = () => {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();

  const totalUSD = cart.reduce(
    (acc, item) => acc + item.product.amount_usd * item.quantity,
    0
  );

  if (cart.length === 0) {
    return (
      <Box p={{ base: 4, md: 6 }} textAlign="center">
        <Heading size="xl" mb={4}>Resumen del Carrito</Heading>
        <Text mb={6}>El carrito está vacío.</Text>
        <Button colorScheme="blue" onClick={() => navigate("/products-catalog")}>
          Explorar productos
        </Button>
      </Box>
    );
  }

  return (
    <Box p={{ base: 4, md: 6 }} maxW="1400px" mx="auto">
      <Heading size="xl" mb={6}>
        🛒 Resumen del Carrito
      </Heading>

      <SimpleGrid 
        columns={{ base: 1, sm: 2, md: 3, lg: 4 }} 
        gap={6}
        mb={6}
      >
        {cart.map(({ product }) => (
          <ProductCard key={product.id} product={product} variant="summary" />
        ))}
      </SimpleGrid>

      <Box 
        p={5} 
        borderRadius="lg" 
        boxShadow="sm"
        borderWidth="1px"
        mt={4}
      >
        <Flex 
          direction={{ base: "column", md: "row" }} 
          justify="space-between" 
          align={{ base: "stretch", md: "center" }}
          gap={4}
        >
          <Text fontWeight="bold" fontSize="2xl">
            Total: ${totalUSD.toFixed(2)} USD
          </Text>

          <Stack direction={{ base: "column", sm: "row" }} gap={4}>
            <Button 
              colorScheme="blue" 
              onClick={() => navigate("/payment")}
              size={{ base: "md", sm: "lg" }}
            >
              <GrTransaction />
              Proceder al pago
            </Button>
            <Button 
              variant="outline" 
              colorScheme="red" 
              onClick={clearCart}
              size={{ base: "md", sm: "lg" }}
            >
              <RiDeleteBin3Line />
              Vaciar carrito
            </Button>
          </Stack>
        </Flex>
      </Box>

      <Box textAlign="center" mt={6}>
        <Button 
          variant="ghost" 
          colorScheme="blue" 
          onClick={() => navigate("/products-catalog")}
        >
          <FaShoppingCart />
          Seguir comprando
        </Button>
      </Box>
    </Box>
  );
};