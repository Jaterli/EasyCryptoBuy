import { Box, Heading, Text, Button, SimpleGrid, Card, Image, Flex, Separator, IconButton, Input, Stack } from "@chakra-ui/react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { FaTrash, FaShoppingCart, FaPlus, FaMinus } from "react-icons/fa";
import { RiDeleteBin3Line } from "react-icons/ri";
import { GrTransaction } from "react-icons/gr";
import { useState } from "react";

export const CartSummaryPage = () => {
  const { cart, removeFromCart, clearCart, updateQuantity } = useCart();
  const navigate = useNavigate();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const totalUSD = cart.reduce(
    (acc, item) => acc + item.product.amount_usd * item.quantity,
    0
  );

  const handleDecreaseQuantity = async (productId: string, currentQuantity: number) => {
    if (currentQuantity <= 1) {
      await removeFromCart(productId);
    } else {
      setUpdatingId(productId);
      await updateQuantity(productId, currentQuantity - 1);
      setUpdatingId(null);
    }
  };

  const handleIncreaseQuantity = async (productId: string, currentQuantity: number, maxStock: number) => {
    if (currentQuantity >= maxStock) {
      alert(`No puedes agregar más de ${maxStock} unidades de este producto`);
      return;
    }
    setUpdatingId(productId);
    await updateQuantity(productId, currentQuantity + 1);
    setUpdatingId(null);
  };

  const handleQuantityInput = async (productId: string, value: string, maxStock: number) => {
    const newQuantity = parseInt(value, 10);
    if (isNaN(newQuantity)) return;
    
    if (newQuantity < 1) {
      await removeFromCart(productId);
    } else if (newQuantity > maxStock) {
      alert(`No puedes agregar más de ${maxStock} unidades de este producto`);
      await updateQuantity(productId, maxStock);
    } else {
      setUpdatingId(productId);
      await updateQuantity(productId, newQuantity);
      setUpdatingId(null);
    }
  };

  if (cart.length === 0) {
    return (
      <Box p={6} textAlign="center">
        <Heading size="xl" mb={4}>Resumen del Carrito</Heading>
        <Text mb={6}>El carrito está vacío.</Text>
        <Button colorPalette="blue" onClick={() => navigate("/products-catalog")}>
          Explorar productos
        </Button>
      </Box>
    );
  }

  return (
    <Box p={{ base: 4, md: 6 }} maxW="1200px" mx="auto">
      <Heading size="xl" mb={6} textAlign={{ base: "center", md: "left" }}>
        🛒 Resumen del Carrito
      </Heading>

      <SimpleGrid 
        columns={{ base: 1, sm: 2, lg: 3 }} 
        gap={6}
        mb={6}
      >
        {cart.map(({ product, quantity }) => {
          const subtotal = product.amount_usd * quantity;
          const available = product.quantity - quantity;
          const isLoading = updatingId === product.id;

          return (
            <Card.Root 
              key={product.id} 
              variant="elevated" 
              overflow="hidden"
              position="relative"
              _hover={{ transform: "translateY(-4px)", transition: "all 0.2s" }}
            >
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  height="160px"
                  objectFit="cover"
                  width="100%"
                />
              ) : (
                <Box
                  height="160px"
                  width="100%"
                  bg="gray.100"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color="gray.400" fontSize="sm">Sin imagen</Text>
                </Box>
              )}

              <Card.Body gap={2}>
                <Card.Title fontSize="lg">{product.name}</Card.Title>
                <Card.Description fontSize="sm" lineClamp={2}>
                  {product.description || "Sin descripción"}
                </Card.Description>
                
                <Separator />

                {/* Controles de cantidad alineados horizontalmente */}
                <Flex justifyContent={"space-between"} align="center" gap={2}>
                  <Text fontWeight="bold" fontSize="sm" whiteSpace="nowrap">
                    Cantidad:
                  </Text>
                  <Stack direction="row" align="center" gap={1}>
                    <IconButton
                      aria-label="Disminuir cantidad"
                      size="xs"
                      colorPalette="red"
                      variant="outline"
                      onClick={() => handleDecreaseQuantity(product.id, quantity)}
                      loading={isLoading}
                      disabled={isLoading}
                    >
                      <FaMinus />
                    </IconButton>
                    
                    <Input
                      type="number"
                      min={1}
                      max={product.quantity}
                      value={quantity}
                      size="xs"
                      width="50px"
                      textAlign="center"
                      p={1}
                      onChange={(e) => handleQuantityInput(product.id, e.target.value, product.quantity)}
                      disabled={isLoading}
                    />
                    
                    <IconButton
                      aria-label="Aumentar cantidad"
                      size="xs"
                      colorPalette="green"
                      variant="outline"
                      onClick={() => handleIncreaseQuantity(product.id, quantity, product.quantity)}
                      loading={isLoading}
                      disabled={isLoading || available === 0}
                    >
                      <FaPlus />
                    </IconButton>
                  </Stack>
                </Flex>

                <Flex justify="space-between" align="center">
                  <Text fontWeight="bold" fontSize="sm">Precio:</Text>
                  <Text fontSize="sm">${product.amount_usd}</Text>
                </Flex>

                <Flex justify="space-between" align="center">
                  <Text fontWeight="bold" fontSize="md" color="green.600">Subtotal:</Text>
                  <Text fontWeight="bold" fontSize="md" color="green.600">
                    ${subtotal.toFixed(2)} USD
                  </Text>
                </Flex>

                <Text fontSize="xs" color={available < 3 ? "orange.500" : "gray.500"}>
                  Stock: {available}
                </Text>
              </Card.Body>

              {/* Botón eliminar reemplaza al de "Agregar más" */}
              <Card.Footer borderTopWidth="1px" pt={2} pb={2}>
                <Button 
                  width="full" 
                  size="sm" 
                  variant="solid" 
                  colorPalette="red"
                  onClick={() => removeFromCart(product.id)}
                >
                  <FaTrash />
                  Eliminar
                </Button>
              </Card.Footer>
            </Card.Root>
          );
        })}
      </SimpleGrid>

      {/* Resumen total y acciones */}
      <Box 
        p={5} 
        borderRadius="lg" 
        shadow="sm"
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

          <Stack gap={4} justify={{ base: "center", md: "flex-end" }} flexWrap="wrap">
            <Button 
              colorPalette="blue" 
              onClick={() => navigate("/payment")}
            >
              <GrTransaction />
              Proceder al pago
            </Button>
            <Button 
              variant="outline" 
              colorPalette="red" 
              onClick={clearCart}              
            >
              <RiDeleteBin3Line />
              Vaciar carrito
            </Button>
          </Stack>
        </Flex>
      </Box>

      {/* Botón flotante para seguir comprando (mobile) */}
      <Box textAlign="center" mt={6} display={{ base: "block", md: "none" }}>
        <Button 
          variant="ghost" 
          colorPalette="blue" 
          onClick={() => navigate("/products-catalog")}          
        >
          <FaShoppingCart />
          Seguir comprando
        </Button>
      </Box>
    </Box>
  );
};