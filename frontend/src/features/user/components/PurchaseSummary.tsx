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
  FaFileInvoice,
  FaCheckCircle,
  FaTruck,
  FaClock,
  FaUnlink
} from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { OrderItem } from '@/shared/types/types';
import { API_PATHS } from '@/config/paths';
import { authUserAPI } from '../services/userApi';
import { toaster } from '@/shared/components/ui/toaster';


export const PurchaseSummary = ({transactionId}: {transactionId: number}) => {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);


  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processed':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'shipped':
        return 'blue';
      case 'no-items':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processed':
        return FaCheckCircle;
      case 'pending':
        return FaClock;
      case 'shipped':
        return FaTruck;
      case 'no-items':
        return FaUnlink;
      default:
        return FaClock;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processed':
        return 'Procesado, pendiente de ser enviado';
      case 'pending':
        return 'Registrado, pendiente de ser procesado';
      case 'shipped':
        return 'Enviado';
      case 'no-items':
        return 'Sin items registrados';
      default:
        return status;
    }
  };


  useEffect(() => {
    const loadOrderItems = async () => {
      try {
        setLoading(true);
        const response = await authUserAPI.getTransactionOrderItems(transactionId);
        
        if (response.success && response.data) {
          setOrderItems(response.data);
        } else {
          toaster.create({ 
            title: "Error al cargar detalles", 
            description: response.error,
            type: "error" 
          });
        }
      } catch (error) {
        toaster.create({ 
          title: "Error al cargar detalles", 
          type: "error" 
        });
        console.error("Error loading order items:", error);
      } finally {
        setLoading(false);
      }
    };

    loadOrderItems();
  }, [transactionId]);

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
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="lg" />
        <Text mt={2}>Cargando detalles...</Text>
      </Box>
    );
  }

  if (orderItems.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text>No se encontraron detalles para esta transacción</Text>
      </Box>
    );
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