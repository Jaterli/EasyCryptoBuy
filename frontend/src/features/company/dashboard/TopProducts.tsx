import { Card, Table, Heading } from '@chakra-ui/react';

export function TopProducts({ products }: { products: Array<{
  id: number;
  name: string;
  units_sold: number;
  revenue: number;
}> }) {
  return (
    <Card.Root p={4} mt={4}>
      <Heading size="md" mb={4}>Productos Más Vendidos</Heading>
      <Table.Root variant="outline">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Producto</Table.ColumnHeader>
            <Table.ColumnHeader>Unidades</Table.ColumnHeader>
            <Table.ColumnHeader>Ingresos</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {products.map(product => (
            <Table.Row key={product.id}>
              <Table.Cell>{product.name}</Table.Cell>
              <Table.Cell>{product.units_sold}</Table.Cell>
              <Table.Cell>${product.revenue.toFixed(2)}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Card.Root>
  );
}