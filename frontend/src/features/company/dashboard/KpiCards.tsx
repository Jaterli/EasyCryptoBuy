import { Card, Flex, Text, Heading } from '@chakra-ui/react';

export function KpiCards({ 
  totalRevenue, 
  activeUsers, 
  totalTransactions,
  inventoryValue 
}: {
  totalRevenue: number;
  activeUsers: number;
  totalTransactions: number;
  inventoryValue: number;
}) {
  return (
    <Flex gap={4} wrap="wrap">
      <Card.Root p={4} flex="1" minW="200px">
        <Text fontSize="sm" color="gray.500">Ingresos Totales</Text>
        <Card.Header>
            <Heading size="lg">${totalRevenue.toLocaleString()}</Heading>
        </Card.Header>
        <Text fontSize="sm">USDT</Text>
      </Card.Root>
      
      <Card.Root p={4} flex="1" minW="200px">
        <Text fontSize="sm" color="gray.500">Usuarios Activos</Text>
        <Card.Header>
            <Heading size="lg">{activeUsers}</Heading>
        </Card.Header>
        <Text fontSize="sm">Últimos 30 días</Text>
      </Card.Root>
      
      <Card.Root p={4} flex="1" minW="200px">
        <Text fontSize="sm" color="gray.500">Transacciones</Text>
        <Card.Header>
            <Heading size="lg">{totalTransactions}</Heading>
        </Card.Header>        
        <Text fontSize="sm">Total historico</Text>
      </Card.Root>
      
      <Card.Root p={4} flex="1" minW="200px">
        <Text fontSize="sm" color="gray.500">Valor Inventario</Text>
        <Card.Header>
            <Heading size="lg">${inventoryValue.toLocaleString()}</Heading>
        </Card.Header>                
        <Text fontSize="sm">Productos en stock</Text>
      </Card.Root>
    </Flex>
  );
}