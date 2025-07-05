import { useEffect, useState } from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  IconButton, 
  Portal,
  Heading,
  Spinner,
  Select,
  Alert,
  Table
} from '@chakra-ui/react';
import { createListCollection } from '@ark-ui/react';
import { authCompanyAPI } from '../services/companyApi';
import { OrderItem } from '@/shared/types/types';
import { toaster } from "@/shared/components/ui/toaster";

const statusOptions = createListCollection({
  items: [
    { label: "Pendiente", value: "pending" },
    { label: "Procesado", value: "processed" },
    { label: "Enviado", value: "shipped" },
  ],
});

const itemsPerPageOptions = createListCollection({
  items: [
    { label: "10 por página", value: "10" },
    { label: "20 por página", value: "20" },
    { label: "30 por página", value: "30" },
  ],
});

const statusColors = {
  pending: 'yellow.600',
  processed: 'blue.400',
  shipped: 'green'
};

export function OrderHistoryPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  
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

  // Cargar todas las órdenes al montar el componente
  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (orderItemId: number, newStatus: string) => {
    try {
      const response = await authCompanyAPI.updateOrderItemStatus(orderItemId, newStatus);
      toaster.create({ title: response.message, type: "success" });
      loadOrders(); // recargar el estado actualizado
    } catch (err) {
      toaster.create({ title: `${err}`, type: "error", duration: 3000 });
    }
  };

  // Calcular órdenes para la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = orders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  return (
    <Box p={{ base: 3, md: 5 }}>
      <Heading size="lg" mb={6}>Historial de Órdenes</Heading>
      
      {/* Listado de órdenes */}
      {isLoading ? (
        <Flex justify="center" py={10}>
          <Spinner size="xl" />
        </Flex>
      ) : error ? (
        <Alert.Root status="error" mb={4}>
          <Alert.Indicator />
          <Alert.Title>{error}</Alert.Title>
        </Alert.Root>
      ) : orders.length === 0 ? (
        <Alert.Root status="info">
          <Alert.Indicator />
          <Alert.Title>No se encontraron órdenes registradas.</Alert.Title>
        </Alert.Root>
      ) : (
        <>
          <Table.Root variant="outline" size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Producto</Table.ColumnHeader>
                <Table.ColumnHeader>Tx</Table.ColumnHeader>                  
                <Table.ColumnHeader>Cantidad</Table.ColumnHeader>
                <Table.ColumnHeader>Precio</Table.ColumnHeader>
                <Table.ColumnHeader>Subtotal</Table.ColumnHeader>
                <Table.ColumnHeader>Estado</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>

              {currentOrders.map((order) => (
                <Table.Row key={order.id}>
                  <Table.Cell>{order.product.name}</Table.Cell>
                  <Table.Cell>0x...{order.transaction.transaction_hash.substring(order.transaction.transaction_hash.length-10)}</Table.Cell>                  
                  <Table.Cell>{order.quantity}</Table.Cell>
                  <Table.Cell>${order.price_at_sale}</Table.Cell>
                  <Table.Cell>${(Number(order.price_at_sale) * order.quantity).toFixed(2)}</Table.Cell>
                  <Table.Cell>
                    <Select.Root color={statusColors[order.status as keyof typeof statusColors]}
                      collection={statusOptions}
                      value={[order.status || "pendiente"]}
                      onValueChange={({ value }) => handleStatusChange(order.id, value[0])}
                      size="sm"
                    >
                      <Select.HiddenSelect />
                      <Select.Control>
                        <Select.Trigger>
                          <Select.ValueText placeholder="Estado" />
                        </Select.Trigger>
                        <Select.IndicatorGroup>
                          <Select.Indicator />
                        </Select.IndicatorGroup>
                      </Select.Control>
                      <Portal>
                        <Select.Positioner>
                          <Select.Content>
                            {statusOptions.items.map((option) => (
                              <Select.Item key={option.value} item={option}>
                                {option.label}
                                <Select.ItemIndicator />
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Positioner>
                      </Portal>
                    </Select.Root>
                  </Table.Cell>
                </Table.Row>
              ))}

              </Table.Body>
            </Table.Root>

          {/* Controles de paginación */}
          <Flex justifyContent="space-between" alignItems="center" mt={4}>
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
        </>
      )}
    </Box>
  );
}