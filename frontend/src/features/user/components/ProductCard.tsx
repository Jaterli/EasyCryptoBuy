import { Card, Button, Text, Image } from "@chakra-ui/react";
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
      <Image
        src={`https://picsum.photos/seed/${product.id}/300`} // Mientras no exista image en el modelo product
        alt={product.name}
        height="200px"
        objectFit="cover"
        width="100%"
      />
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