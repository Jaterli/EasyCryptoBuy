import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, Heading, Box } from '@chakra-ui/react';

export function TransactionChart({ data }: { data: Array<{date: string, amount: number}> }) {
  return (
    <Card.Root p={4} mt={4}>
        <Card.Header>
            <Heading size="md" mb={4}>Transacciones Recientes</Heading>            
        </Card.Header>
      
      <Box height="300px">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value} USDT`, 'Monto']} />
            <Line type="monotone" dataKey="amount" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Card.Root>
  );
}