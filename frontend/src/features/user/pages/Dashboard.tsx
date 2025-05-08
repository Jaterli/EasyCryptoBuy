import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Box, Text, Button, Heading, Spinner, Stack, HStack, VStack, Icon, Badge, Card, CardBody, CardHeader, CardFooter, SimpleGrid, IconButton } from "@chakra-ui/react";
import { toaster } from "@/shared/components/ui/toaster";
import { useNavigate } from "react-router-dom";
import { FaEthereum, FaWallet, FaHistory, FaCopy } from "react-icons/fa";
import WalletAddress from "@/shared/components/TruncatedAddress";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import formatScientificToDecimal from "@/shared/utils/formatScientificToDecimal";

interface Transaction {
  transaction_hash: string;
  amount: string;
  created_at: string;
  token: string;
  status: string;
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (isConnected && address) {
      setLoading(true);
      fetch(`http://localhost:8000/payments/transactions/${address}`)
        .then((res) => res.json())
        .then((data: { transactions: Transaction[] }) => setTransactions(data.transactions))
        .catch((error) => console.error("Error fetching transactions:", error))
        .finally(() => setLoading(false));
    }
  }, [isConnected, address]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toaster.create({ title: "Dirección copiada", type: "success", duration: 2000});    
  };

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'completed': return 'green';
      case 'pending': return 'yellow';
      case 'failed': return 'red';
      default: return 'blue';
    }
  };

  return (
    <Box p={{ base: 4, md: 8 }} maxW="1200px" mx="auto">
      <VStack spaceY={8} align="stretch">
        {/* Hero Section */}
        <Box textAlign="center" py={10}>
          <Heading as="h1" mb={4}>
            Plataforma de Pagos OnChain
          </Heading>
          <Text fontSize="xl" opacity={0.7} maxW="800px" mx="auto">
            Realiza y gestiona tus transacciones en Ethereum de forma segura y descentralizada
          </Text>
        </Box>

        {/* Wallet Connection Card */}
        <Card.Root variant="outline" boxShadow="md">
            <CardHeader>
                <HStack>
                <Icon as={FaWallet} color="blue.500" />
                <Heading size="md">Estado de Wallet</Heading>
                </HStack>
            </CardHeader>
            <CardBody>
                {isConnected && address ? (
                <VStack align="flex-start" spaceY={4}>
                    <Box width="full">
                    <Text fontWeight="bold" mb={{ base: 1, md: 0 }}>Conectado con:</Text>
                    <HStack truncate>
                        <WalletAddress address={address} />
                        <IconButton
                        aria-label="Copiar dirección"
                        size="xs"
                        variant="ghost"
                        onClick={() => copyToClipboard(address)}
                        >
                        <FaCopy />
                        </IconButton>
                    </HStack>
                    </Box>
                    <Badge colorPalette="green" px={2} py={1} borderRadius="full">
                    Conectado
                    </Badge>
                </VStack>
                ) : (
                <VStack spaceY={4}>
                    <Text color="gray.500">No hay wallet conectada</Text>
                    <Text>Para ver el estado necesitas conectar tu wallet.</Text>
                </VStack>
                )}
            </CardBody>
        </Card.Root>

        {/* Features Grid */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spaceX={{ base: 0, md: 6}} spaceY={{ base: 6, md: 0}}>
          {/* Payments Card */}
          <Card.Root variant="outline" boxShadow="md" _hover={{ transform: "translateY(-4px)", transition: "all 0.2s" }}>
            <CardHeader>
              <HStack>
                <Icon as={FaEthereum} color="purple.500" />
                <Heading size="md">Realizar Pagos</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <Text mb={4}>
                Envía pagos en ETH, USCD, USDT y LINK de forma rápida y segura directamente desde tu wallet.
              </Text>
            </CardBody>
            <CardFooter>
              <Button 
                colorPalette="blue" 
                onClick={() => navigate("/payment")}
                w="full"
              >
                Ir a Pagos
              </Button>
            </CardFooter>
          </Card.Root>

          {/* Transactions Card */}
          <Card.Root variant="outline" boxShadow="md" _hover={{ transform: "translateY(-4px)", transition: "all 0.2s" }}>
            <CardHeader>
              <HStack>
                <Icon as={FaHistory} color="green.500" />
                <Heading size="md">Historial</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <Text mb={4}>
                Revisa todas tus transacciones realizadas a través de nuestra plataforma.
              </Text>
            </CardBody>
            <CardFooter>
              <Button 
                colorPalette="green" 
                onClick={() => navigate("/payments-history")}
                w="full"
              >
                Ver Historial
              </Button>
            </CardFooter>
          </Card.Root>
        </SimpleGrid>

        {/* Recent Transactions Section */}
        {isConnected && (
          <Card.Root variant="outline" boxShadow="md">
            <CardHeader>
              <HStack>
                <Icon as={FaHistory} color="blue.500" />
                <Heading size="md">Tus Últimas Transacciones</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              {loading ? (
                <Stack align="center" py={10}>
                  <Spinner size="xl" />
                  <Text>Cargando transacciones...</Text>
                </Stack>
              ) : transactions.length > 0 ? (
                <Stack spaceY={4}>
                  {transactions
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 5)
                    .map((tx, index) => (
                      <Card.Root key={index} variant="elevated">
                        <CardBody>
                          <VStack align="stretch" spaceY={3}>
                          <Stack 
                            direction={{ base: "column", md: "row" }} 
                            justify="space-between" 
                            spaceX={{ base: 1, md: 2 }}
                            >
                            <HStack 
                                justify={{ base: "space-between", md: "flex-start" }}
                                spaceX={{ base: 0, md: 2 }}
                                width={{ base: "100%", md: "auto" }}
                            >
                                <Badge 
                                colorPalette={getStatusColor(tx.status)} 
                                px={2} 
                                py={1} 
                                borderRadius="full"
                                minW="fit-content"
                                >
                                {tx.status}
                                </Badge>
                                <Text 
                                fontSize="sm" 
                                color="gray.500"
                                textAlign={{ base: "right", md: "left" }}
                                >
                                {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true, locale: es })}
                                </Text>
                            </HStack>
                            <Text 
                                fontWeight="bold" 
                                textAlign="right"
                                pt={{ base: 1, md: 0 }}
                            >
                                {formatScientificToDecimal(tx.amount)} {tx.token}
                            </Text>
                            </Stack>
                            <HStack>
                              <Text fontSize="sm" truncate flex={1}>
                                {tx.transaction_hash}
                              </Text>
                              <IconButton
                                aria-label="Copiar hash"                                
                                size="xs"
                                variant="ghost"
                                onClick={() => copyToClipboard(tx.transaction_hash)}
                              ><FaCopy />
                              </IconButton>
                            </HStack>
                          </VStack>
                        </CardBody>
                      </Card.Root>
                    ))}
                </Stack>
              ) : (
                <Box textAlign="center" py={10}>
                  <Text color="gray.500">No tienes transacciones registradas aún.</Text>
                  <Button mt={4} colorPalette="blue" onClick={() => navigate("/payment")}>
                    Realizar primer pago
                  </Button>
                </Box>
              )}
            </CardBody>
          </Card.Root>
        )}
      </VStack>
    </Box>
  );
}