import { Card, Button, Text, Image, Box } from "@chakra-ui/react";
import { useCart } from "../context/CartContext";
import { Product } from "@/shared/types/types";

interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void; // Prop opcional para manejar el evento de agregar al carrito
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { cart, addToCart } = useCart();
  const item = cart.find(item => item.product.id === product.id);
  const currentQty = item?.quantity || 0;
  const available = product.quantity - currentQty;

  const handleAddToCart = () => {
    addToCart(product); // Lógica existente del contexto
  };

  return (
    <Card.Root variant="elevated" width="100%" overflow="hidden">
      {product.image ? (
        <Image
          src={product.image}
          alt={product.name}
          height="200px"
          objectFit="cover"
          width="100%"
        />
      ) : (
        <Box
          height="200px"
          width="100%"
          bg="gray.100"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Text color="gray.400" fontSize="sm">Sin imagen</Text>
        </Box>
      )}
      
      <Card.Body gap="2">
        <Card.Title>{product.name}</Card.Title>
        <Card.Description>{product.description}</Card.Description>
        <Text textStyle="2xl" fontWeight="medium" letterSpacing="tight" mt="2">
          ${product.amount_usd}
        </Text>
        <Text color="gray.500" fontSize="sm">Stock disponible: {available}</Text>
      </Card.Body>
      <Card.Footer>
        <Button 
          width="full"
          colorPalette="green" 
          onClick={handleAddToCart}
          disabled={available <= 0}
        >
          Agregar al carrito {currentQty > 0 && `(${currentQty})`}
        </Button>
      </Card.Footer>
    </Card.Root>
  );
};