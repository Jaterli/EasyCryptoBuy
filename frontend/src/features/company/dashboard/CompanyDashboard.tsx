import { Box, Flex } from '@chakra-ui/react';
import { KpiCards } from './KpiCards';
import { TransactionChart } from './TransactionChart';
import { TopProducts } from './TopProducts';
import { RecentTransactions } from './RecentTransactions';

export function CompanyDashboard() {
  // Datos de ejemplo - en la implementación real estos vendrían de tu API
  const dashboardData = {
    totalRevenue: 125000.75,
    activeUsers: 342,
    totalTransactions: 1289,
    inventoryValue: 87500,
    transactionData: [
      { date: '01/05', amount: 4200 },
      { date: '02/05', amount: 3800 },
      { date: '03/05', amount: 5400 },
      { date: '04/05', amount: 6200 },
      { date: '05/05', amount: 5800 },
    ],
    topProducts: [
      { id: 1, name: 'Producto Premium', sales: 245, revenue: 12250 },
      { id: 2, name: 'Kit Inicial', sales: 189, revenue: 9450 },
      { id: 3, name: 'Servicio Plus', sales: 132, revenue: 6600 },
    ],
    recentTransactions: [
      {
        id: 1,
        wallet_address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        amount: 125.5,
        status: 'confirmed',
        created_at: '2023-05-05T14:32:00Z',
        token: 'USDT'
      },
      // Más transacciones...
    ]
  };

  return (
    <Box p={{ base: 3, md: 5 }}>
      <KpiCards 
        totalRevenue={dashboardData.totalRevenue}
        activeUsers={dashboardData.activeUsers}
        totalTransactions={dashboardData.totalTransactions}
        inventoryValue={dashboardData.inventoryValue}
      />
      
      <TransactionChart data={dashboardData.transactionData} />
      
      <Flex gap={4} mt={4}>
        <Box flex={2}>
          <TopProducts products={dashboardData.topProducts} />
        </Box>
        <Box flex={3}>
          <RecentTransactions transactions={dashboardData.recentTransactions} />
        </Box>
      </Flex>
    </Box>
  );
}