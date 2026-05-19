// components/ProductCard.tsx (actualizado)
import { Card, Button, Text, Image, Flex, Badge } from "@chakra-ui/react";
import { useCart } from "../context/CartContext";
import { Product } from "@/shared/types/types";

interface ProductCardProps {
  product: Product;
  variant?: 'catalog' | 'summary';
}

export const ProductCard = ({ product, variant = 'catalog' }: ProductCardProps) => {
  const { cart, addToCart, removeFromCart, updateQuantity } = useCart();
  const cartItem = cart.find(item => item.product.id === product.id);
  const currentQty = cartItem?.quantity || 0;
  const available = product.quantity - currentQty;

  const handleAddToCart = () => {
    addToCart(product);
  };

  const handleUpdateQuantity = async (newQuantity: number) => {
    if (newQuantity < 1) {
      await removeFromCart(product.id);
    } else if (newQuantity <= product.quantity) {
      await updateQuantity(product.id, newQuantity);
    }
  };

  if (variant === 'summary') {
    return (
      <Card.Root variant="elevated" overflow="hidden" h="100%">
        <Image
          src={product.image || "https://placehold.co/300x200?text=Sin+Imagen"}
          alt={product.name}
          h="200px"
          w="100%"
          objectFit="cover"
        />
        
        <Card.Body gap={2}>
          <Card.Title fontSize="lg">{product.name}</Card.Title>
          <Card.Description fontSize="sm" lineClamp={2}>
            {product.description || "Sin descripción"}
          </Card.Description>
          
          <Flex justify="space-between" align="center" mt={2}>
            <Text fontWeight="bold" fontSize="sm">Precio:</Text>
            <Text fontSize="sm">${product.amount_usd} USD</Text>
          </Flex>
          
          <Flex justify="space-between" align="center">
            <Text fontWeight="bold" fontSize="sm">Cantidad:</Text>
            <Flex align="center" gap={2}>
              <Button
                size="xs"
                variant="outline"
                onClick={() => handleUpdateQuantity(currentQty - 1)}
                disabled={currentQty <= 1}
              >
                -
              </Button>
              <Text minW="30px" textAlign="center">{currentQty}</Text>
              <Button
                size="xs"
                variant="outline"
                onClick={() => handleUpdateQuantity(currentQty + 1)}
                disabled={currentQty >= product.quantity}
              >
                +
              </Button>
            </Flex>
          </Flex>
          
          <Flex justify="space-between" align="center" pt={2}>
            <Text fontWeight="bold" fontSize="md" color="green.600">Subtotal:</Text>
            <Text fontWeight="bold" fontSize="md" color="green.600">
              ${(product.amount_usd * currentQty).toFixed(2)} USD
            </Text>
          </Flex>
          
          <Badge colorScheme={available < 3 ? "orange" : "gray"} fontSize="xs">
            Stock disponible: {available}
          </Badge>
        </Card.Body>
        
        <Card.Footer borderTopWidth="1px">
          <Button 
            w="full" 
            size="sm" 
            colorScheme="red"
            variant="solid"
            onClick={() => removeFromCart(product.id)}
          >
            Eliminar
          </Button>
        </Card.Footer>
      </Card.Root>
    );
  }

  // Variante catálogo
  return (
    <Card.Root variant="elevated" overflow="hidden" h="100%">
      <Image
        src={product.image || "https://placehold.co/300x200?text=Sin+Imagen"}
        alt={product.name}
        h="200px"
        w="100%"
        objectFit="cover"
      />
      
      <Card.Body gap="2">
        <Card.Title>{product.name}</Card.Title>
        <Card.Description lineClamp={2}>{product.description}</Card.Description>
        <Text fontSize="2xl" fontWeight="bold" mt="2">
          ${product.amount_usd} USD
        </Text>
        <Text color="gray.500" fontSize="sm">Stock disponible: {available}</Text>
      </Card.Body>
      
      <Card.Footer>
        <Button 
          w="full"
          colorScheme="green" 
          onClick={handleAddToCart}
          disabled={available <= 0}
        >
          Agregar al carrito {currentQty > 0 && `(${currentQty})`}
        </Button>
      </Card.Footer>
    </Card.Root>
  );
};