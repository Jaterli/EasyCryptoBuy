import { useEffect, useState } from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  IconButton, 
  Portal,
  Stack,
  Heading,
  Spinner,
  Select,
  Alert,
  Badge
} from '@chakra-ui/react';
import { createListCollection } from '@ark-ui/react';
import { authCompanyAPI } from '../services/companyApi';
import { OrderItem } from '@/shared/types/types';

const itemsPerPageOptions = createListCollection({
  items: [
    { label: "10 por página", value: "10" },
    { label: "20 por página", value: "20" },
    { label: "30 por página", value: "30" },
  ],
});

const statusColors = {
  pending: 'yellow',
  processed: 'blue',
  shipped: 'green'
};

export function OrderHistoryPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Cargar todas las órdenes al montar el componente
  useEffect(() => {
    const loadOrders = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await authCompanyAPI.getAllOrders();
        if (response.success && response.data) {
          // Ordenar por fecha (más reciente primero)
          const sortedOrders = [...response.data].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          setOrders(sortedOrders);
        } else {
          setError(response.error || "Error desconocido al cargar órdenes");
          setOrders([]);
        }
      } catch (err) {
        let errorMessage = "Ocurrió un error al cargar las órdenes";
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, []);

  // Calcular órdenes para la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = orders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  return (
    <Box p={{ base: 3, md: 5 }}>
      <Heading size="lg" mb={6}>Historial de Órdenes</Heading>
      
      {error && (
        <Alert.Root status="error" mb={4}>
          <Alert.Indicator />
          <Alert.Title>{error}</Alert.Title>
        </Alert.Root>
      )}

      {/* Controles de paginación superior */}
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Flex gap={2} alignItems="center">
          <IconButton
            aria-label="Página anterior"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            size="sm"
            variant="ghost"
          >
            ←
          </IconButton>
          
          <Text fontSize="sm">
            Página {currentPage} de {totalPages}
          </Text>

          <IconButton
            aria-label="Página siguiente"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            size="sm"
            variant="ghost"
          >
            →
          </IconButton>
        </Flex>

        <Select.Root
          collection={itemsPerPageOptions}
          value={[itemsPerPage.toString()]}
          onValueChange={({ value }) => {
            setItemsPerPage(Number(value[0]));
            setCurrentPage(1);
          }}
          size="sm"
          width="150px"
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger>
              <Select.ValueText placeholder="Items por página" />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content>
                {itemsPerPageOptions.items.map((option) => (
                  <Select.Item key={option.value} item={option}>
                    {option.label}
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
      </Flex>

      {/* Listado de órdenes */}
      {isLoading ? (
        <Flex justify="center" py={10}>
          <Spinner size="xl" />
        </Flex>
      ) : orders.length === 0 ? (
        <Alert.Root status="info">
          <Alert.Indicator />
          <Alert.Title>No se encontraron órdenes registradas.</Alert.Title>
        </Alert.Root>
      ) : (
        <>
          <Stack gap={4} mb={6}>
            {currentOrders.map((order) => (
              <Box 
                key={order.id} 
                p={4} 
                borderWidth="1px" 
                borderRadius="md"
                bg={{ _dark: "gray.700", base: "white" }}
              >
                <Flex justify="space-between" mb={2}>
                  <Text fontWeight="bold">Orden #{order.id}</Text>
                  <Text fontSize="sm" color="gray.500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </Text>
                </Flex>
                
                <Flex direction="column" gap={2}>
                  <Text>
                    Producto: {order.product.name} (x{order.quantity})
                  </Text>
                  <Text>
                    Precio unitario: ${order.price_at_sale}
                  </Text>
                  <Text fontWeight="bold">
                    Total: ${order.subtotal}
                  </Text>
                  <Flex align="center" gap={2}>
                    <Text>Estado:</Text>
                    <Badge colorScheme={statusColors[order.status as keyof typeof statusColors]}>
                      {order.status}
                    </Badge>
                  </Flex>
                  <Text fontSize="sm" color="gray.500">
                    Transacción: {order.transaction.transaction_hash}
                  </Text>
                </Flex>
              </Box>
            ))}
          </Stack>

          {/* Controles de paginación inferior */}
          <Flex justifyContent="center" mt={6}>
            <Flex gap={2} alignItems="center">
              <IconButton
                aria-label="Página anterior"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                size="sm"
                variant="ghost"
              >
                ←
              </IconButton>
              
              <Text fontSize="sm">
                Página {currentPage} de {totalPages}
              </Text>

              <IconButton
                aria-label="Página siguiente"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                size="sm"
                variant="ghost"
              >
                →
              </IconButton>
            </Flex>
          </Flex>
        </>
      )}
    </Box>
  );
}