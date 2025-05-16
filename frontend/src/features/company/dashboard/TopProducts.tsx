import { Card, Table, Heading } from '@chakra-ui/react';

export function TopProducts({ products }: { products: Array<{
  id: number;
  name: string;
  sales: number;
  revenue: number;
}> }) {
  return (
    <Card.Root p={4} mt={4}>
        <Card.Header>
            <Heading size="md" mb={4}>Productos Más Vendidos</Heading>
        </Card.Header>
      <Table.Root variant="outline">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Producto</Table.ColumnHeader>
            <Table.ColumnHeader isNumeric>Unidades</Table.ColumnHeader>
            <Table.ColumnHeader isNumeric>Ingresos</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {products.map(product => (
            <Table.Row key={product.id}>
              <Table.Cell>{product.name}</Table.Cell>
              <Table.Cell isNumeric>{product.sales}</Table.Cell>
              <Table.Cell isNumeric>${product.revenue.toFixed(2)}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Card.Root>
  );
}