import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Table,
  Spinner,
  Center,
} from "@chakra-ui/react";
import { fetchSales } from "../api/sales";
import { Sale } from "../types/Sale";

export const SalesHistory: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadSales = async () => {
      try {
        const data = await fetchSales();
        setSales(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al cargar ventas'));
      } finally {
        setLoading(false);
      }
    };

    loadSales();
  }, []);

  if (loading) {
    return (
      <Center py={10}>
        <Spinner size="xl" colorPalette="blue.500" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center py={10}>
        <Heading size="md" color="red.500">
          Error: {error.message}
        </Heading>
      </Center>
    );
  }

  return (
    <Box p={4}>
      <Heading size="lg" mb={6} fontWeight="semibold">
        Historial de Ventas
      </Heading>
      
      <Table.Root variant="outline" size="md" striped interactive>
        <Table.Header bg="gray.100">
          <Table.Row>
            <Table.ColumnHeader>Cliente</Table.ColumnHeader>
            <Table.ColumnHeader>Wallet</Table.ColumnHeader>
            <Table.ColumnHeader>Producto</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end">Precio USD</Table.ColumnHeader>
            <Table.ColumnHeader>Token</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end">Cantidad</Table.ColumnHeader>
            <Table.ColumnHeader>Fecha</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        
        <Table.Body>
          {sales.length > 0 ? (
            sales.map((sale) => (
              <Table.Row key={sale.id}>
                <Table.Cell fontWeight="medium">{sale.customerName}</Table.Cell>
                <Table.Cell fontFamily="mono" fontSize="sm">
                  {sale.customerWallet}
                </Table.Cell>
                <Table.Cell>{sale.productName}</Table.Cell>
                <Table.Cell textAlign="end">
                  {sale.usdPrice.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  })}
                </Table.Cell>
                <Table.Cell>{sale.tokenSymbol}</Table.Cell>
                <Table.Cell textAlign="end">
                  {sale.tokenAmount.toLocaleString()}
                </Table.Cell>
                <Table.Cell>
                  {new Date(sale.date).toLocaleString()}
                </Table.Cell>
              </Table.Row>
            ))
          ) : (
            <Table.Row>
              <Table.Cell colSpan={7} textAlign="center" py={4}>
                No se encontraron ventas
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table.Root>
    </Box>
  );
};