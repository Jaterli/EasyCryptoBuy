import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, Heading, Box } from '@chakra-ui/react';
import { DashboardDataType } from '@/shared/types/types';

export function TransactionChart({ data }: { data: DashboardDataType["transaction_trend"] }) {
  
  return (
    <Card.Root p={4} mt={4}>
      <Heading size="md" mb={4}>USD acumulado por día</Heading>            
      
      <Box height="300px">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value} USD`, 'Monto']} />
            <Line type="monotone" dataKey="amount_usd" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Card.Root>
  );
}