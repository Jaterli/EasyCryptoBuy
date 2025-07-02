import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Table,
  Select,
  Flex,
  Spinner,
  Button,
} from "@chakra-ui/react";
import { toaster } from "@/shared/components/ui/toaster";
import { useParams } from "react-router-dom";
import { authCompanyAPI } from "../services/companyApi";
import { Transaction } from "@/shared/types/types";
import { createListCollection, Portal } from "@ark-ui/react";
import { CheckTransactions } from "@/features/company/components/CheckTransactions";
import { useNavigate } from 'react-router-dom';

const statusColors = {
  pending: 'yellow.600',
  processed: 'blue.400',
  shipped: 'green'
};

const statusOptions = createListCollection({
  items: [
    { label: "Pendiente", value: "pending" },
    { label: "Procesado", value: "processed" },
    { label: "Enviado", value: "shipped" },
  ],
});

export const TransactionDetail: React.FC = () => {
  const { hash } = useParams<{ hash: string }>();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchTransaction = async () => {
    try {
      const response = await authCompanyAPI.getTransactionDetail(hash!);
      setTransaction(response.data);
    } catch (err) {
      toaster.create({ description: `${err}`, type: "error", duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderItemId: number, newStatus: string) => {
    try {
      const response = await authCompanyAPI.updateOrderItemStatus(orderItemId, newStatus);
      toaster.create({ title: response.message, type: "success" });
      fetchTransaction(); // recargar el estado actualizado
    } catch (err) {
      toaster.create({ title: `${err}`, type: "error", duration: 3000 });
    }
  };

  useEffect(() => {
    fetchTransaction();
  }, [hash]);

  if (loading) {
    return (
      <Flex justify="center" py={10}>
        <Spinner size="lg" />
      </Flex>
    );
  }

  if (!transaction) {
    return (
      <Box p={6}>
        <Text>Vemta no encontrada.</Text>
      </Box>
    );
  }

  return (
    <Box p={{ base: 3, md: 6 }}>
      <Button size={"xs"} float={"right"} onClick={() => navigate(-1)}>Volver</Button>
      <Heading size="lg" mb={4}>
        Detalle de la venta
      </Heading>      
      <Box mb={6} fontSize={{base:"0.9em", md: "inherit"}}>
        <Text><strong>Hash:</strong> {transaction.transaction_hash}</Text>
        <Text><strong>Wallet:</strong> {transaction.wallet_address}</Text>
        <Text><strong>Monto:</strong> {transaction.amount} {transaction.token}</Text>
        <Text><strong>Fecha:</strong> {new Date(transaction.created_at).toLocaleString()}</Text>
        {transaction.status === 'pending' ? (
          <CheckTransactions 
            transactionHash={transaction.transaction_hash} 
            onCheckComplete={fetchTransaction} // Pasamos la función como callback
          />
          ) : (
            <Text><strong>Estado:</strong> {transaction.status}</Text>
          )
        }
      </Box>

      <Heading size="md" mb={3}>Órdenes (productos comprados)</Heading>

    {/* {transaction.status === 'pending' ? (
        <Alert.Root status="warning">
          <Alert.Indicator />
          <Alert.Title>
            Verifica la transacción en la blockchain para cargar los productos
          </Alert.Title>
        </Alert.Root>
    ) : (
       */}
      <Table.Root variant="outline" size="sm">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Producto</Table.ColumnHeader>
            <Table.ColumnHeader>Cantidad</Table.ColumnHeader>
            <Table.ColumnHeader>Precio</Table.ColumnHeader>
            <Table.ColumnHeader>Subtotal</Table.ColumnHeader>
            <Table.ColumnHeader>Estado</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {transaction.order_items && transaction.order_items.map((item) => (
            <Table.Row key={item.id}>
              <Table.Cell>{item.product.name}</Table.Cell>
              <Table.Cell>{item.quantity}</Table.Cell>
              <Table.Cell>${item.price_at_sale}</Table.Cell>
              <Table.Cell>${(Number(item.price_at_sale) * item.quantity).toFixed(2)}</Table.Cell>
              <Table.Cell>
                <Select.Root color={statusColors[item.status as keyof typeof statusColors]}
                  collection={statusOptions}
                  value={[item.status || "pendiente"]}
                  onValueChange={({ value }) => handleStatusChange(item.id, value[0])}
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
    {/* )} */}
    </Box>
  );
};
