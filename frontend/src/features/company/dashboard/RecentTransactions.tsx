import { Card, Heading, Table, Badge } from '@chakra-ui/react';
import { format } from 'date-fns';
export function RecentTransactions({ transactions }: { transactions: Array<{
  id: number;
  wallet_address: string;
  amount: number;
  token: string;
  status: string;
  created_at: string;
}> }) {
  const statusColors = {
    pending: 'yellow',
    confirmed: 'green',
    failed: 'red'
  };

  return (
    <Card.Root p={4} mt={4}>
      <Heading size="md" mb={4}>Últimas Transacciones</Heading>
      <Table.Root variant="outline">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Wallet</Table.ColumnHeader>
            <Table.ColumnHeader>Monto</Table.ColumnHeader>
            <Table.ColumnHeader>Estado</Table.ColumnHeader>
            <Table.ColumnHeader>Fecha</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {transactions.map(tx => (
            <Table.Row key={tx.id}>
              <Table.Cell>{tx.wallet_address.slice(0, 6)}...{tx.wallet_address.slice(-4)}</Table.Cell>
              <Table.Cell>{tx.amount} {tx.token}</Table.Cell>
              <Table.Cell>
                <Badge colorPalette={statusColors[tx.status as keyof typeof statusColors]}>
                  {tx.status}
                </Badge>
              </Table.Cell>
              <Table.Cell>{format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm')}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Card.Root>
  );
}