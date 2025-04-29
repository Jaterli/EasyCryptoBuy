import { Card, Button, Text } from "@chakra-ui/react";
import { useCart } from "../context/CartContext";
import { Product } from "@/shared/types/Product";

interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void; // Prop opcional para manejar el evento de agregar al carrito
}

export const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const { cart, addToCart } = useCart();
  const item = cart.find(item => item.product.id === product.id);
  const currentQty = item?.quantity || 0;
  const available = product.quantity - currentQty;

  const handleAddToCart = () => {
    addToCart(product); // Lógica existente del contexto
    onAddToCart?.(); // Llama a la función opcional si está presente
  };

  return (
    <Card.Root variant="elevated" width="100%">
      <Card.Header>
        <Card.Title>{product.name}</Card.Title>
      </Card.Header>
      <Card.Body>
        <Card.Description>{product.description}</Card.Description>
        <Text fontWeight="bold" marginTop="2">${product.amount_usd}</Text>
        <Text color="gray.500" fontSize="sm">Stock disponible: {available}</Text>
        <Button 
          marginTop="4" 
          colorScheme="green" 
          onClick={handleAddToCart}
          disabled={available <= 0}
        >
          Agregar al carrito {currentQty > 0 && `(${currentQty})`}
        </Button>
      </Card.Body>
    </Card.Root>
  );
};