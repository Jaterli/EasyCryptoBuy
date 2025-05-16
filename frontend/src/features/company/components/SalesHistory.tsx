// components/company/CompanyPaymentHistory.tsx
import { useEffect, useState } from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  IconButton, 
  Portal,
  Stack,
  Heading,
  Spinner,
  Select,
} from '@chakra-ui/react';
import { Alert } from '@chakra-ui/react';
import { Transaction } from '@/shared/types/types';
import { API_PATHS } from '@/config/paths';
import axios from 'axios';
import { createListCollection } from '@ark-ui/react';
import TransactionData from '@/features/user/components/TransactionData';

interface UserProfile {
  id: number;
  username: string;
  wallet_address: string;
  name: string | null;
  email: string | null;
  created_at: string;
}

const itemsPerPageOptions = createListCollection({
  items: [
    { label: "10 por página", value: "10" },
    { label: "20 por página", value: "20" },
    { label: "30 por página", value: "30" },
  ],
});

export function SalesHistory() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState({
    users: true,
    transactions: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Cargar lista de usuarios al montar el componente
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await axios.get(`${API_PATHS.company}/get-all-users`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
        setUsers(response.data.users);
        setError(null);
      } catch (err) {
        setError('Error al cargar la lista de usuarios');
        console.error(err);
      } finally {
        setIsLoading(prev => ({...prev, users: false}));
      }
    };
    
    loadUsers();
  }, []);

  // Cargar transacciones cuando se selecciona un usuario
  useEffect(() => {
    if (selectedUser) {
      setIsLoading(prev => ({...prev, transactions: true}));
      
      axios.get(`${API_PATHS.company}/get-user-transactions-company/${selectedUser.wallet_address}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      .then(response => {
        setTransactions(response.data.transactions);
        setCurrentPage(1);
        setError(null);
      })
      .catch((err) => {
        setError('Error al cargar las transacciones del usuario');
        console.error(err);
        setTransactions([]);
      })
      .finally(() => {
        setIsLoading(prev => ({...prev, transactions: false}));
      });
    }
  }, [selectedUser]);

  // Calcular transacciones para la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  const usersCollection = createListCollection({
    items: users.map(user => ({
      label: `${user.name || user.username} - ${user.wallet_address}`,
      value: user.id.toString(),
      data: user // Opcional: puedes incluir el objeto completo como referencia
    }))
  });
  

  return (
    <Box p={{ base: 3, md: 5 }}>
      <Heading size="lg" mb={6}>Panel de Transacciones</Heading>
      
      {error && (
        <Alert.Root status="error" mb={4}>
          <Alert.Indicator />
          <Alert.Title>{error}</Alert.Title>
        </Alert.Root>
      )}

      {/* Selector de usuario */}
      <Box mb={6}>
        <Text fontWeight="medium" mb={2}>Seleccionar Usuario:</Text>
        {isLoading.users ? (
          <Spinner size="sm" />
        ) : (
          <Select.Root
            collection={usersCollection}
            onValueChange={({ value }) => {
              const userId = parseInt(value[0]);
              const user = users.find(u => u.id === userId) || null;
              setSelectedUser(user);
            }}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder="Selecciona un usuario" />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content>
                  {usersCollection.items.map((userItem) => (
                      <Select.Item key={userItem.value} item={userItem}>
                        {userItem.label}
                        <Select.ItemIndicator />
                      </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
        )}
      </Box>

      {/* Información del usuario seleccionado */}
      {selectedUser && (
        <Box mb={6} p={4} bg={{ _dark: "blue.900", base: "blue.100" }} fontSize='sm' borderRadius="md">
          <Text fontWeight="bold">Usuario seleccionado:</Text>
          <Text>Nombre: {selectedUser.name || 'No proporcionado'}</Text>
          <Text>Email: {selectedUser.email || 'No proporcionado'}</Text>
          <Text truncate>Wallet: {selectedUser.wallet_address}</Text>
          <Text>Registrado el: {new Date(selectedUser.created_at).toLocaleDateString()}</Text>
        </Box>
      )}

      {/* Listado de transacciones */}
      {selectedUser ? (
        isLoading.transactions ? (
          <Flex justify="center" py={10}>
            <Spinner size="xl" />
          </Flex>
        ) : transactions.length === 0 ? (
          <Alert.Root status="info">
            <Alert.Indicator />
            <Alert.Title>No se encontraron transacciones para este usuario.</Alert.Title>
          </Alert.Root>
        ) : (
          <>
            <Stack gap={4} mb={6}>
              {currentTransactions.map((transaction) => (
                <TransactionData key={transaction.id} tx={transaction} />
              ))}
            </Stack>

            {/* Controles de paginación */}
            <Flex justifyContent="space-between" alignItems="center" mt={4}>
              <Flex gap={2} alignItems="center">
                <IconButton
                  aria-label="Página anterior"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  size="sm"
                  variant="ghost"
                >
                  ←
                </IconButton>
                
                <Text fontSize="sm">
                  Página {currentPage} de {totalPages}
                </Text>

                <IconButton
                  aria-label="Página siguiente"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  size="sm"
                  variant="ghost"
                >
                  →
                </IconButton>
              </Flex>

              <Select.Root
                collection={itemsPerPageOptions}
                value={[itemsPerPage.toString()]}
                onValueChange={({ value }) => {
                  setItemsPerPage(Number(value[0]));
                  setCurrentPage(1);
                }}
                size="sm"
                width="150px"
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder="Items por página" />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {itemsPerPageOptions.items.map((option) => (
                        <Select.Item key={option.value} item={option}>
                          {option.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Flex>
          </>
        )
      ) : (
        <Alert.Root status="info">
          <Alert.Indicator />
          <Alert.Title>Selecciona un usuario para ver su historial de transacciones.</Alert.Title>
        </Alert.Root>
      )}
    </Box>
  );
}