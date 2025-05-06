import { useEffect, useState } from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  IconButton, 
  Select, 
  Portal, 
  createListCollection,
  Stack,
} from '@chakra-ui/react';
import { useAccount } from 'wagmi';
import WalletAddress from '@/shared/components/TruncatedAddress';
import { Transaction } from '@/shared/types/types';
import TransactionData from "../components/TransactionData";
import { API_PATHS } from '@/config/paths';
import axios from 'axios';


const itemsPerPageOptions = createListCollection({
  items: [
    { label: "10 por página", value: "10" },
    { label: "20 por página", value: "20" },
    { label: "30 por página", value: "30" },
  ],
});

export function PaymentHistory() {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  useEffect(() => {
    if (address) {
      setIsLoading(true);

      axios.get(`${API_PATHS.payments}/transactions/${address}`)
      .then(response => {
        setTransactions(response.data.transactions);
        setCurrentPage(1);
      })
      .catch(() => {
        setTransactions([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
    }
  }, [address]);

  // Calcular transacciones para la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

   return (
    <Box p={{ base: 3, md: 5 }}>
      <Flex 
        direction={{ base: "column", md: "row" }} 
        alignItems={{ base: "flex-start", md: "center" }}
        fontSize="lg" 
        mb={4}
        gap={2}
      >
        Historial de Pagos de la Wallet: {address ? <WalletAddress address={address} /> : "No conectado"}
      </Flex>
      
      {isLoading ? (
        <Text>Cargando transacciones...</Text>
      ) : transactions.length === 0 ? (
        <Text>No se encontraron transacciones.</Text>
      ) : (
        <>
          <Stack gap={4}>
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
              width="140px"
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