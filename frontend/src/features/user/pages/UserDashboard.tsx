import { useEffect, useState } from "react";
import { Box, Text, Button, Heading, Spinner, Stack, HStack, VStack, Icon, Badge, Card, CardBody, CardHeader, CardFooter, SimpleGrid, IconButton, Flex, Alert } from "@chakra-ui/react";
import { toaster } from "@/shared/components/ui/toaster";
import { useNavigate } from "react-router-dom";
import { FaEthereum, FaWallet, FaHistory, FaCopy, FaShoppingCart, FaExchangeAlt } from "react-icons/fa";
import { authUserAPI } from "../services/userApi";
import { useWallet } from "@/features/user/hooks/useWallet";
import { Transaction } from "@/shared/types/types";
import TransactionData from "../components/TransactionData";
import TruncateAddress from "@/shared/components/TruncatedAddress";

export default function Home() {
  const { address, isConnected, isWalletRegistered, isAuthenticated, authenticate } = useWallet();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSign = async () => {
    if (address){
      await authenticate();
      setLoading(false);  
    }
  };

  useEffect(() => {
    if (address && isAuthenticated) {
      setLoading(true);
      authUserAPI.getTransactionsByWallet(address)
        .then(response => {
          setTransactions(response.data.transactions);
        })
        .catch((err) => {
          console.error("Error fetching transactions:", err);
          setError(err instanceof Error ? err.message : "Error al cargar transacciones");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [address, isAuthenticated]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toaster.create({ title: "Dirección copiada", type: "success", duration: 2000});    
  };

  return (
    <Box p={{ base: 4, md: 8 }} maxW="1200px" mx="auto">
      <VStack spaceY={8} align="stretch">
        {/* Hero Section */}
        <Box textAlign="center" py={10}>
          <Heading as="h1" mb={4}>
            Plataforma de Compras OnChain
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
              <Heading size="md">Estado de Wallet 
                  {isConnected && address ? (
                    <Badge colorPalette="green" ml={4} px={2} py={1} borderRadius="full">                        
                      Conectada
                    </Badge>
                  ) : (
                    <Badge colorPalette="red" ml={4} px={2} py={1} borderRadius="full">                        
                      desconectada
                    </Badge>
                  )}
              </Heading>
              
              </HStack>
          </CardHeader>
          <CardBody>
              {isConnected && address ? (
              <VStack align="flex-start" spaceY={4}>
                  <Box width="full">
                  <Text fontWeight="bold" mb={{ base: 1, md: 0 }}>Conectado con:</Text>
                  <HStack truncate>
                      <TruncateAddress address={address} />
                      <IconButton
                      aria-label="Copiar dirección"
                      size="xs"
                      variant="ghost"
                      onClick={() => copyToClipboard(address)}
                      >
                      <FaCopy />
                      </IconButton>
                  </HStack>
                  { !isWalletRegistered && (
                    <Box textAlign={"center"}>
                      <Text opacity={0.6} mb={4}>Esta Wallet todavía no ha sido registrada</Text>
                      <Button 
                        colorPalette="green" 
                        onClick={() => navigate("/register-wallet")}
                      >
                        Registrar Wallet
                      </Button>                      
                    </Box>
                  )}                  
                  </Box>
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
          
          {/* Catálogo de Productos */}
          <Card.Root 
            variant="outline" 
            boxShadow="md" 
            _hover={{ transform: "translateY(-4px)", transition: "all 0.2s" }}
            bgGradient="linear(to-br, blue.50, purple.50)"
          >
            <CardHeader>
              <HStack>
                <Icon as={FaShoppingCart} color="blue.500" />
                <Heading size="md">Explorar Productos</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <Text mb={4}>
                Descubre nuestra selección de productos disponibles para compra con criptomonedas.
              </Text>
            </CardBody>
            <CardFooter>
              <Button 
                colorPalette="blue" 
                onClick={() => navigate("/products-catalog")}
                w="full"
              >
                Ver Catálogo
                <FaShoppingCart />
              </Button>
            </CardFooter>
          </Card.Root>

          {/* Pagos Rápidos */}
          <Card.Root 
            variant="outline" 
            boxShadow="md" 
            _hover={{ transform: "translateY(-4px)", transition: "all 0.2s" }}
            bgGradient="linear(to-br, green.50, teal.50)"
          >
            <CardHeader>
              <HStack>
                <Icon as={FaEthereum} color="purple.500" />
                <Heading size="md">Pagos con criptomonedas</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <Text mb={4}>
                Realiza compras pagando en ETH, USDC, USDT y LINK directamente desde tu wallet.
              </Text>
              <Flex wrap="wrap" gap={2} mt={4}>
                <Badge colorPalette="purple">ETH</Badge>
                <Badge colorPalette="blue">USDC</Badge>
                <Badge colorPalette="green">USDT</Badge>
                <Badge colorPalette="orange">LINK</Badge>
              </Flex>
            </CardBody>
            <CardFooter>
              <Button 
                colorPalette="green" 
                onClick={() => navigate("/payment")}
                w="full"
              >
                Realizar Pago
                <FaExchangeAlt />
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
                <Heading size="md">Tus Últimas Compras</Heading>
              </HStack>
            </CardHeader>
            <CardBody>

              {isWalletRegistered && !isAuthenticated ? (
                <Box textAlign="center" py={2} spaceY={4}>
                  <Text color="gray.500">Necesitas firmar con tu wallet para ver esta sección.</Text>
                    <Button colorPalette="blue" onClick={handleSign}>
                      Firmar y continuar
                    </Button>                  
                </Box>
              ) : loading ? (
                <Stack align="center" py={10}>
                  <Spinner size="xl" />
                  <Text>Cargando transacciones...</Text>
                </Stack>
              ) : error ? (
                <Alert.Root status="error" mb={4}>
                  <Alert.Indicator />
                  <Alert.Title>{error}</Alert.Title>
                </Alert.Root>
              ) : transactions.length > 0 ? (
                <Stack spaceY={4}>
                  {transactions
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 5)
                    .map((tx) => (
                      <TransactionData key={tx.id} tx={tx} />
                    ))}
                  </Stack>
              ) : (
                <Box textAlign="center" py={6}>
                  <Text opacity={0.6}>No se encontraron transacciones.</Text>
                </Box>
             )
            }
            </CardBody>
          </Card.Root>
        )}
      </VStack>
    </Box>
  );
}