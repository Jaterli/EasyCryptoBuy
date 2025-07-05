import { useEffect, useState } from 'react';
import { Box, Flex, Spinner, Center, Alert } from '@chakra-ui/react';
import { KpiCards } from './KpiCards';
import { TransactionChart } from './TransactionChart';
import { TopProducts } from './TopProducts';
import { RecentTransactions } from './RecentTransactions';
import { authCompanyAPI } from '../services/companyApi';
import { DashboardDataType } from '@/shared/types/types';

export function CompanyDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardDataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await authCompanyAPI.getCompanyDashboard();
        setDashboardData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar los datos del dashboard' );
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Center minH="300px">
        <Spinner size="lg" />
      </Center>
    );
  }

  if (error) {
    return (
      <Alert.Root status="error" mb={4}>
        <Alert.Indicator />
        <Alert.Title>{error}</Alert.Title>
      </Alert.Root>
    );
  }

  if (!dashboardData){
    return ""
  }

  return (
    <Box p={{ base: 3, md: 5 }}>
      <KpiCards 
        totalRevenue={dashboardData.total_revenue}
        activeUsers={dashboardData.active_users}
        totalTransactions={dashboardData.total_transactions}
        inventoryValue={dashboardData.inventory_value}
      />
      
      <TransactionChart data={dashboardData.transaction_trend} />
      
      <Flex gap={4} mt={4}>
        <Box flex={2}>
          <TopProducts products={dashboardData.top_products} />
        </Box>
        <Box flex={3}>
          <RecentTransactions transactions={dashboardData.recent_transactions} />
        </Box>
      </Flex>
    </Box>
  );
}
