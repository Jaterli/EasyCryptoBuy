// components/company/CompanyPaymentHistory.tsx
import { useEffect, useState } from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  IconButton, 
  Portal,
  Heading,
  Spinner,
  Select,
  Alert,
  Table,
  Link
} from '@chakra-ui/react';
import { Transaction, UserProfile } from '@/shared/types/types';
import { createListCollection } from '@ark-ui/react';
import { authCompanyAPI } from '../services/companyApi';
import { toaster } from "@/shared/components/ui/toaster";
import { FaCopy } from 'react-icons/fa';
import { MdOutlineViewHeadline } from "react-icons/md";

const itemsPerPageOptions = createListCollection({
  items: [
    { label: "10 por página", value: "10" },
    { label: "20 por página", value: "20" },
    { label: "30 por página", value: "30" },
  ],
});

type FilterOption = 'all' | 'user';

export function SalesHistory() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
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
      setIsLoading(prev => ({...prev, users: true}));
      setError(null);
      
      const response = await authCompanyAPI.getAllUsers();
      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        setError(response.error || "Error desconocido al cargar usuarios");
        setUsers([]);
      }
      
      setIsLoading(prev => ({...prev, users: false}));
    };

    loadUsers();
  }, []);

  // Cargar transacciones según el filtro seleccionado
  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoading(prev => ({...prev, transactions: true}));
      setError(null);
      
      try {
        let response;
        
        if (filterOption === 'user' && selectedUser?.wallet_address) {
          response = await authCompanyAPI.getTransactionsByWallet(selectedUser.wallet_address);
        } else {
          response = await authCompanyAPI.getAllTransactions();
        }

        if (response.success && response.data) {
          setTransactions(response.data);
          setCurrentPage(1);
        } else {
          setError(response.error || "Error desconocido al cargar transacciones");
          setTransactions([]);
        }
      } catch (err) {
        let errorMessage = "Ocurrió un error al cargar las transacciones";
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);         
      } finally {
        setIsLoading(prev => ({...prev, transactions: false}));
      }
    };

    loadTransactions();
  }, [filterOption, selectedUser]);

  // Calcular transacciones para la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  const copyToClipboard = (hash: string) => {
      navigator.clipboard.writeText(hash);
      toaster.create({ title: "Hash copiado", type: "success", duration: 2000 });
  };

  // Opciones para el select de filtro
  const filterOptions = createListCollection({
    items: [
      { label: "Todas las transacciones", value: "all" },
      { label: "Filtrar por usuario", value: "user" },
    ]
  });

  // Opciones para el select de usuarios
  const usersCollection = createListCollection({
    items: [
      { label: "Seleccione un usuario", value: "", data: null },
      ...users.map(user => ({
        label: `${user.name} - ${user.wallet_address}`,
        value: user.wallet_address,
        data: user
      }))
    ]
  });

  return (
    <Box p={{ base: 3, md: 5 }}>
      <Heading size="lg" mb={6}>Panel de Transacciones</Heading>
      
      <Box mb={6}>
        <Text fontWeight="medium" mb={2}>Filtrar por:</Text>
        {isLoading.users ? (
          <Spinner size="sm" />
        ) : (
          <Flex gap={4} direction={{ base: "column", md: "row" }}>
            <Select.Root
              collection={filterOptions}
              value={[filterOption]}
              onValueChange={({ value }) => setFilterOption(value[0] as FilterOption)}
              width={{ base: "full", md: "280px" }}
            >
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content>
                    {filterOptions.items.map((option) => (
                      <Select.Item key={option.value} item={option}>
                        {option.label}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>

            {filterOption === 'user' && (
              <Select.Root
                collection={usersCollection}
                onValueChange={({ value }) => {
                  const walletAddress = value[0];
                  const user = users.find(u => u.wallet_address === walletAddress) || null;
                  setSelectedUser(user);
                }}
                width={{ base: "full", md: "400px" }}
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
                        <Select.Item 
                          key={userItem.value} 
                          item={userItem}
                        >
                          {userItem.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            )}
          </Flex>
        )}
      </Box>

      {error && (
        <Alert.Root status="error" mb={4}>
          <Alert.Indicator />
          <Alert.Title>{error}</Alert.Title>
        </Alert.Root>
      )}

      {/* Información del usuario seleccionado */}
      {filterOption === 'user' && selectedUser && (
        <Box mb={6} p={4} bg={{ _dark: "blue.900", base: "blue.100" }} fontSize='sm' borderRadius="md">
          <Text fontWeight="bold">Usuario seleccionado:</Text>
          <Text>Nombre: {selectedUser.name || 'No proporcionado'}</Text>
          <Text>Email: {selectedUser.email || 'No proporcionado'}</Text>
          <Text truncate>Wallet: {selectedUser.wallet_address}</Text>
          <Text>Registrado el: {new Date(selectedUser.created_at).toLocaleDateString()}</Text>
        </Box>
      )}

      {/* Listado de transacciones */}
      {isLoading.transactions ? (
        <Flex justify="center" py={10}>
          <Spinner size="xl" />
        </Flex>
      ) : transactions.length === 0 ? (
        <Alert.Root status="warning">
          <Alert.Indicator />
          <Alert.Title>
            {filterOption === 'all' 
              ? "No se encontraron transacciones" 
              : "No se encontraron transacciones para este usuario"}
          </Alert.Title>
        </Alert.Root>
      ) : (
        <>  
          <Box overflowX="auto" mb="6">
            <Table.Root variant="line" size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Hash</Table.ColumnHeader>
                  <Table.ColumnHeader>Token</Table.ColumnHeader>
                  <Table.ColumnHeader>Monto</Table.ColumnHeader>
                  <Table.ColumnHeader>Estado</Table.ColumnHeader>
                  <Table.ColumnHeader>Fecha</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign={'center'}>Detalle</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {currentTransactions.map((tx) => (
                  <Table.Row key={tx.transaction_hash}>
                    <Table.Cell maxW={"250px"} truncate>{tx.transaction_hash}
                      <IconButton
                          aria-label="Copiar hash"                                 
                          size="xs"
                          variant="ghost"
                          onClick={() => copyToClipboard(tx.transaction_hash)}
                      >
                          <FaCopy />
                      </IconButton>
                    </Table.Cell>
                    <Table.Cell>{tx.token}</Table.Cell>
                    <Table.Cell>{Number(tx.amount).toFixed(2)}</Table.Cell>
                    <Table.Cell
                      color={
                        tx.status === 'confirmed' ? 'green.600' :
                        tx.status === 'pending' ? 'orange.500' :
                        tx.status === 'failed' ? 'red.500' : 
                        'inherit' // color por defecto si hay un estado desconocido
                      }
                    >{tx.status} 
                    </Table.Cell>
                    <Table.Cell>{new Date(tx.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</Table.Cell>
                    <Table.Cell maxW={"35px"} textAlign={'center'}><Link href={`/company/transaction-detail/${tx.transaction_hash}`}><MdOutlineViewHeadline /></Link></Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>  

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
      )}
    </Box>
  );
}