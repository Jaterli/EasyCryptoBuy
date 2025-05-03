import { Box, Heading, Text, Button, Table, IconButton, HStack } from "@chakra-ui/react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { FaTrash } from "react-icons/fa";
import { RiDeleteBin3Line } from "react-icons/ri";
import { GrTransaction } from "react-icons/gr";

export const CartSummaryPage = () => {
  const { cart, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  const totalUSD = cart.reduce(
    (acc, item) => acc + item.product.amount_usd * item.quantity,
    0
  );

  return (
    <Box p={6}>
      <Heading size="xl" mb={4}>Resumen del Carrito</Heading>

      {cart.length === 0 ? (
        <Text>No has agregado productos aún.</Text>
      ) : (
        <>
          <Table.Root variant="outline" size="md">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Producto</Table.ColumnHeader>
                <Table.ColumnHeader>Cantidad</Table.ColumnHeader>
                <Table.ColumnHeader>Subtotal (USD)</Table.ColumnHeader>
                <Table.ColumnHeader width="120px"></Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {cart.map(({ product, quantity }) => (
                <Table.Row key={product.id}>
                  <Table.Cell>{product.name}</Table.Cell>
                  <Table.Cell>{quantity}</Table.Cell>
                  <Table.Cell>${(product.amount_usd * quantity).toFixed(2)}</Table.Cell>
                  <Table.Cell>
                    <IconButton
                        aria-label="Eliminar"
                        size={{ base: "xs", md: "sm" }}
                        colorPalette="red"
                        variant="ghost"
                        onClick={() => removeFromCart(product.id)}                          
                    >
                        <FaTrash />
                    </IconButton>


                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>

          <Text fontWeight="bold" mt={4} fontSize="lg">
            Total: ${totalUSD.toFixed(2)} USD
          </Text>

          <HStack mt={6} spaceX={4}>
            <Button colorPalette="blue" onClick={() => navigate("/payment")}>
              <GrTransaction />
              Proceder al pago
            </Button>
            <Button variant="solid" onClick={clearCart}>
            <RiDeleteBin3Line />Vaciar carrito
            </Button>
          </HStack>
        </>
      )}
    </Box>
  );
};