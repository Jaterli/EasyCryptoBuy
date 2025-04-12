import { useEffect, useState } from 'react';
import { Box, Flex, Table, Text, IconButton, Select, Portal, createListCollection } from '@chakra-ui/react';
import { toaster } from "@/components/ui/toaster";
import { FaCopy, FaFileInvoice } from 'react-icons/fa';
import { useAccount } from 'wagmi';
import WalletAddress from './TruncatedAddress';
import formatScientificToDecimal from "@/components/formatScientificToDecimal";

interface Transaction {
  id: number;
  wallet_address: string;
  amount: string;
  status: string;
  transaction_hash: string;
  token: string;
}


const itemsPerPageOptions = createListCollection({
  items: [
    { label: "5 por página", value: "5" },
    { label: "10 por página", value: "10" },
    { label: "20 por página", value: "20" },
  ],
});

export function PaymentHistory() {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    if (address) {
      setIsLoading(true);
      fetch(`http://localhost:8000/payments/transactions/${address}`)
        .then(response => response.json())
        .then(data => {
          setTransactions(data.transactions);
          setCurrentPage(1); // Resetear a primera página al cargar nuevas transacciones
        })
        .catch(() => {
          setTransactions([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [address]);

  const handleDownloadInvoice = (transactionId: number) => {
    window.open(`http://localhost:8000/payments/generate-invoice/${transactionId}/`, '_blank');
  };

  const copyToClipboard = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toaster.create({ title: "Hash copiado", type: "success", duration: 2000});
  };

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
          <Box overflowX="auto">
            <Table.Root variant="outline" className='payments'>
              <Table.Header>
                <Table.Row fontSize={{base: "xs", md: "md"}}>
                  <Table.ColumnHeader display={{ base: "none", md: "table-cell" }}>ID</Table.ColumnHeader>
                  <Table.ColumnHeader>MONTO</Table.ColumnHeader>
                  <Table.ColumnHeader>ESTADO</Table.ColumnHeader>
                  <Table.ColumnHeader>HASH</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign={{ base: "right", md: "left" }}>FACTURA</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {currentTransactions.map((transaction) => (
                  <Table.Row key={transaction.id}>
                    <Table.Cell display={{ base: "none", md: "table-cell" }}>{transaction.id}</Table.Cell>
                    <Table.Cell>{formatScientificToDecimal(transaction.amount)} {transaction.token}</Table.Cell>
                    <Table.Cell>
                      <Text fontSize={{ base: "sm", md: "md" }}>{transaction.status}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex align="center" gap={2} maxW="300px">
                        <Text truncate display={{ base: "none", md: "inline" }}>
                          {transaction.transaction_hash}
                        </Text>
                        <IconButton
                          aria-label="Copiar hash"
                          size={{ base: "xs", md: "md" }}
                          onClick={() => copyToClipboard(transaction.transaction_hash)}
                          variant="ghost"
                        >
                          <FaCopy />
                        </IconButton>
                      </Flex>
                    </Table.Cell>
                    <Table.Cell textAlign={{ base: "right", md: "left" }}>
                      <IconButton
                          aria-label="Copiar hash"
                          title='Descargar factura'
                          size={{ base: "xs", md: "md" }}
                          onClick={() => handleDownloadInvoice(transaction.id)}
                          variant="ghost"
                        >
                          <FaFileInvoice />
                        </IconButton>
                    </Table.Cell>
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