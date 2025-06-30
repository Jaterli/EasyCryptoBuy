// components/PurchaseSummary.tsx
import {
  Box,
  Text,
  HStack,
  VStack,
  Heading,
  Tag,
  IconButton,
  Spinner,
  Icon
} from '@chakra-ui/react';
import { 
  FaShoppingCart,
  FaFileInvoice
} from 'react-icons/fa';
import { OrderItem } from '@/shared/types/types';
import { API_PATHS } from '@/config/paths';

interface PurchaseSummaryProps {
  orderItems: OrderItem[];
  transactionId: number;
  loading: boolean;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ComponentType;
  getStatusLabel: (status: string) => string;
}

export const PurchaseSummary = ({
  orderItems,
  transactionId,
  loading,
  getStatusColor,
  getStatusIcon,
  getStatusLabel
}: PurchaseSummaryProps) => {
  const getSummary = () => {
    let total_usd = 0;
    let items_count = 0;
    const products = orderItems.map(item => {
      const subtotal = item.price_at_sale * item.quantity;
      total_usd += subtotal;
      items_count += item.quantity;
      return {
        id: item.product.id,
        name: item.product.name,
        description: item.product.description,
        quantity: item.quantity,
        price_usd: item.price_at_sale,
        subtotal: subtotal.toFixed(2),
        status: item.status
      };
    });
    return {
      products,
      total_usd: total_usd.toFixed(2),
      items_count
    };
  };

  const summary = getSummary();

  const handleDownloadInvoice = (transactionId: number) => {
    window.open(`${API_PATHS.payments}/generate-invoice/${transactionId}`, '_blank');
  };

  if (loading) {
    return <Spinner size="lg" />;
  }

  return (
    <Box padding={4} borderWidth={'1px'} borderRadius={'lg'}>
      <HStack>
        <Icon as={FaShoppingCart} color="green.500" />
        <Heading size="md">Resumen de la Compra</Heading>
      </HStack>

      <VStack mt={6} align="stretch" gap={4}>
        {summary.products.map((product) => (
          <Box key={product.id} borderBottomWidth="1px" pb={4} _last={{ borderBottomWidth: 0 }}>
            <Text fontWeight="bold">{product.name}</Text>
            {product.description && (
              <Text fontSize="sm" opacity={0.5} mt={1}>
                {product.description}
              </Text>
            )}
            <HStack mt={1}>
                <Text whiteSpace={'nowrap'}>x {product.quantity}</Text>
                <Tag.Root truncate
                    size="sm" 
                    colorPalette={getStatusColor(product.status)}
                >
                    <Tag.StartElement as={getStatusIcon(product.status)} />
                    <Tag.Label>{getStatusLabel(product.status)}</Tag.Label>
                </Tag.Root>
            </HStack>

            <HStack justify="space-between" mt={2}>
              <Text fontSize="sm">Precio unitario: ${product.price_usd}</Text>
              <Text fontWeight="bold">Subtotal: ${product.subtotal}</Text>
            </HStack>
          </Box>
        ))}


        <HStack justify="space-between">
          <Text fontSize="lg" fontWeight="bold">Total Items:</Text>
          <Text fontSize="lg">{summary.items_count}</Text>
        </HStack>

        <HStack justify="space-between" mt={2} mb={6}>
          <Text fontSize="lg" fontWeight="bold">Total USD:</Text>
          <Text fontSize="xl" fontWeight="bold" color="green.600">
            ${summary.total_usd}
          </Text>
        </HStack>
      </VStack>

      <IconButton
        size={{ base: "sm", md: "md" }}
        aria-label="Descargar factura"
        title='Descargar factura'
        onClick={() => handleDownloadInvoice(transactionId)}
        variant="solid"
      >
        <FaFileInvoice />
        Descargar factura
      </IconButton>
    </Box>
  );
};