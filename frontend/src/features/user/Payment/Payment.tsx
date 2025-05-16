import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useState, useEffect, useCallback } from "react";
import { Box, VStack, Text, Spinner, Heading, HStack, Button, Grid, GridItem, Image, Badge, Spacer, Stack } from "@chakra-ui/react";
import { toaster } from "@/shared/components/ui/toaster";
import ContractABI from "@/abis/PAYMENT_CONTRACT_ABI.json";
import StandardERC20ABI from "@/abis/ERC20.json";
import { PaymentForm } from "./PaymentForm";
import { useWallet } from "@/shared/context/useWallet";
import { useNavigate } from "react-router-dom";
import TransactionData from "../components/TransactionData";
import { useCart } from "@/features/user/context/CartContext";
import { ApiError, Transaction } from "@/shared/types/types";
import { axiosAPI } from "../services/userApi";

const CONTRACT_ADDRESSES = {
  PAYMENT: import.meta.env.VITE_PAYMENT_CONTRACT_ADDRESS as `0x${string}`,
  TOKENS: {
    USDC: import.meta.env.VITE_USDC_ADDRESS as `0x${string}`,
    USDT: import.meta.env.VITE_USDT_ADDRESS as `0x${string}`,
    LINK: import.meta.env.VITE_LINK_ADDRESS as `0x${string}`
  }
};

const TOKEN_DECIMALS = {
  ETH: 18,
  USDT: 6,
  USDC: 6,
  LINK: 18
};

export interface PendingTransaction {
  amount: string;
  token: keyof typeof TOKEN_DECIMALS;
}

export function Payment() {
  const { address, isAuthenticated, isWalletRegistered, isLoading: isAuthLoading } = useWallet();
  const { cart, cartLoading, deleteCart } = useCart();
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<keyof typeof TOKEN_DECIMALS>("ETH");
  const [pendingTx, setPendingTx] = useState<PendingTransaction | null>(null);
  const [checkPendingTx, setChekPendingTx] = useState<boolean>(false);
  const [transactionData, setTransaction] = useState<Transaction | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [stockIssues, setStockIssues] = useState<{ id: string, available: number }[]>([]);
  const [checkingStock, setCheckingStock] = useState(false);
  const [transaction_id, setTransactionId] = useState<number | null>(null);
  const navigate = useNavigate();
  const { data: hash, writeContract, isPending: isTransactionPending, error: writeError } = useWriteContract();
  const { data: approveHash, writeContract: writeApprove, isPending: isApprovePending, error: writeApproveError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const { isLoading: isApproving, isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({ hash: approveHash });
  const [progressMessage, setProgressMessage] = useState("");

  const showToast = useCallback((type: 'info' | 'error' | 'success', title: string, message: string) => {
    toaster.create({ title, description: message, type, duration: type === 'error' ? 5000 : 3000 });
  }, []);


  useEffect(() => {
    if (writeError || writeApproveError) {
      const cleanupFailedTransaction = async () => {
        if (transaction_id) {
          await axiosAPI.deleteTransaction(transaction_id);
          setTransactionId(null);
        }
        setPendingTx(null);
      };
      cleanupFailedTransaction();
      showToast('error', "Error en transacción", (writeError ? writeError.message : writeApproveError ? writeApproveError.message : 'Error desconocido'));
    }
  }, [writeError, writeApproveError, showToast]);

  // 1. Validación del carrito
  useEffect(() => {
    if (cart && cart.length > 0) {
      const validateCart = async () => {
        setCheckingStock(true);
        try {
          const response = await axiosAPI.validateCart(
            cart.map(item => ({ id: item.product.id, quantity: item.quantity }))
          );
          setStockIssues(response.data.invalid || []);
        } catch (error) {
          console.error("Error validando stock", error);
        } finally {
          setCheckingStock(false);
        }
      };
      validateCart();
    }
  }, [cart]);

  // Chequeamos si hay transacciones anteriores que no se marcaron como confirmed
  useEffect(() => {
    if (address){
      const checkForPendingTx = async  () => {
        try {
          console.log("Comprobando si hay transacciones pendientes...");
          const { data } = await axiosAPI.checkPendingTransactions(address);       
          if (data.success) {
            setChekPendingTx(data.has_pending);
            return;
          } else {
            console.error("Error checking pending transactions:", data.message);
          }
        } catch (err) {
          console.error("Error verificando transacciones pendientes:", err);
        }
      };
      checkForPendingTx();
    }
  },[address]);

  // 2. Actualización y obtención de detalles de transacción
  useEffect(() => {
    if (isConfirmed && pendingTx && transaction_id) {
      setProgressMessage("Finalizando transacción...");      
      const updateAndFetchTransaction = async () => {
        try {
          // Actualizar la transacción
          const updateResponse = await axiosAPI.updateTransaction(
            transaction_id,
            {
              wallet_address: address,
              amount: pendingTx.amount,
              transaction_hash: hash,
              token: pendingTx.token
            }
          );
          
          if (!updateResponse.data.success) {
            setProgressMessage("");
            throw new Error(updateResponse.data.message || "Error al actualizar la transacción");
          }
  
          // Obtener detalles
          const detailsResponse = await axiosAPI.getTransactionDetails(hash);
          
          if (detailsResponse.data.success && detailsResponse.data.transaction) {
            // deleteCart();
            setTransaction(detailsResponse.data.transaction);
            setPaymentCompleted(true);
            showToast('success', "Enhorabuena!", updateResponse.data.message);
          } else {
            throw new Error(detailsResponse.data.message || "Error al obtener detalles de la transacción");
          }
        } catch (error) {
          setProgressMessage("");
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          showToast('error', "Error en el servidor", errorMessage);
          setPendingTx(null);
        }
      };
  
      updateAndFetchTransaction();
    }
  }, [isConfirmed, hash, address, showToast, transaction_id]);

  // 3. Polling de estado de transacción
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (paymentCompleted && transactionData && transactionData.status === 'pending' && hash) {
      const fetchTransactionDetails = async () => {
        try {
          const response = await axiosAPI.getTransactionDetails(hash);
          
          if (response.data.success) {
            setTransaction(response.data.transaction);
            
            if (response.data.transaction.status === 'confirmed') {
              clearInterval(interval);
            }
          }
        } catch (error) {
          console.error("Error fetching transaction details:", error);
        }
      };
  
      fetchTransactionDetails();
      interval = setInterval(fetchTransactionDetails, 10000);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [hash, paymentCompleted]); 

  useEffect(() => {
    if (isApproveConfirmed && pendingTx && token !== "ETH" && transaction_id) {
      setProgressMessage("Ejecutando transferencia del token...");      
      const amountInUnits = convertToTokenUnits(pendingTx.amount, token);
      const paymentFunctionName = token === "USDC" ? "payUSDC"
        : token === "USDT" ? "payUSDT"
        : "payLINK";

      writeContract({
        address: CONTRACT_ADDRESSES.PAYMENT,
        abi: ContractABI,
        functionName: paymentFunctionName,
        args: [amountInUnits, transaction_id],
      });
    }
  }, [isApproveConfirmed, pendingTx, token, writeContract, transaction_id]);

  const convertToTokenUnits = useCallback((amount: string, tokenType: keyof typeof TOKEN_DECIMALS) => {
    const sanitizedAmount = amount.includes('.') ? amount : `${amount}.0`;
    const [integerPart, decimalPart = ''] = sanitizedAmount.split('.');
    const decimals = decimalPart.padEnd(TOKEN_DECIMALS[tokenType], '0').slice(0, TOKEN_DECIMALS[tokenType]);
    return BigInt(`${integerPart}${decimals}`);
  }, []);

  // 4. Registro de transacción inicial
  const handlePayment = async (amount: string, token: keyof typeof TOKEN_DECIMALS) => {
    if (!address) {
      showToast('error', "Error", "Por favor, conecta tu wallet primero.");
      return;
    }
         
    const decimalCount = amount.split('.')[1]?.length || 0;
    if (decimalCount > TOKEN_DECIMALS[token]) {
      showToast('error', "Error", `Máximo ${TOKEN_DECIMALS[token]} decimales permitidos`);
      return;
    }
  
    try {
      // Registrar transacción pendiente sin hash
      setProgressMessage("Registrando transacción en el sistema...");
      const registerResponse = await axiosAPI.registerTransaction({
        wallet_address: address,
        amount,
        token
      });
  
      setTransactionId(registerResponse.data.transaction_id);
      setPendingTx({ amount, token });

      const amountInUnits = convertToTokenUnits(amount, token);
  
      if (token === "ETH") {
        setProgressMessage("Confirmando transacción de ETH en tu wallet...");        
        await writeContract({
          address: CONTRACT_ADDRESSES.PAYMENT,
          abi: ContractABI,
          functionName: "payETH",
          args: [registerResponse.data.transaction_id],
          value: amountInUnits,
        });
      } else {
        setProgressMessage("Aprobando gasto del token en tu wallet...");        
        await writeApprove({
          address: CONTRACT_ADDRESSES.TOKENS[token],
          abi: StandardERC20ABI,
          functionName: "approve",
          args: [CONTRACT_ADDRESSES.PAYMENT, amountInUnits],
        });
      }
  
    } catch (error: unknown) {  
      setProgressMessage("");
      const apiError = error as ApiError;
      const errorMessage = apiError.response.data.message;
      
      showToast('error', "Error en transacción", errorMessage);
      console.error("Error en transacción:", errorMessage);
      setPendingTx(null);
    }
  };
  const isLoadingState = isTransactionPending || isConfirming || isApproving || isAuthLoading;
  const totalUSD = cart.reduce((sum, item) => sum + item.product.amount_usd * item.quantity, 0);

  if (paymentCompleted && transactionData) {
    return (
      <Box p={5} mt={5} mb={5}>
        <VStack spaceY={8} align="center">
          <Text color="green.500" fontSize="2xl" fontWeight="bold">
            ¡Compra realizada con éxito!
          </Text>
          <Box width="100%" maxWidth="800px">
            <TransactionData key={transactionData.id} tx={transactionData} />
          </Box>
          <Button 
            colorPalette="blue" 
            onClick={() => navigate("/products-catalog")}
            mt={4}
          >
            Volver a la tienda
          </Button>
        </VStack>
      </Box>
    );
  }

  if (checkPendingTx){
    return (
      <Box p={5} mt={5} mb={5}>
        <VStack spaceY={8} align="center">
          <Text alignContent={"center"} color="red.500" fontSize="lg">
            Tienes transacciones pendientes que aún no ha sido confirmadas en la blockchain.
            Hasta que no se confirmen o se eliminen, no podrás hacer otra compra.
          </Text>
          <Button 
            colorPalette="blue" 
            onClick={() => navigate("/payments-history")}
            mt={4}
          >
            Historial de Compras
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <Box p={5} mt={5} mb={5}>
      <Grid templateColumns={{ base: "1fr", lg: cart.length > 0 ? "1fr 1fr" : "1fr" }} gap={{ base: "0", lg: "8" }}>
        {/* Columna izquierda - Resumen del carrito */}
        <GridItem>
          <Box>
            <Heading size="lg" mb={6} textAlign="left">Resumen de tu compra</Heading>
            
            {cartLoading ? (
              <VStack>
                <Spinner size="md" />
                <Text>Cargando carrito...</Text>
              </VStack>
            ) : cart.length === 0 ? (
              <VStack gap={4} textAlign="center" py={8}>
                <Text fontSize="xl" fontWeight="medium">Tu carrito está vacío</Text>
                <Text color="gray.500">No hay productos para mostrar</Text>
                <Button asChild colorPalette="blue" mt={4}>
                  <a href="/products-catalog">
                    Explorar productos
                  </a>
                </Button>
              </VStack>
            ) : (
              <Stack align="stretch">
                {cart.map((item) => (
                  <Box key={item.product.id}>
                    <HStack align="flex-start" gap={4}>
                      <Box flexShrink={0}>
                        <Image 
                          src={`https://picsum.photos/seed/${item.product.id}/80`}
                          boxSize="80px"
                          objectFit="cover"
                          borderRadius="md"
                          alt={item.product.name}
                        />
                      </Box>
                      <Box flex={1}>
                        <HStack justify="space-between">
                          <Text fontWeight="bold" fontSize="lg">{item.product.name}</Text>
                          <Text fontWeight="bold" color="blue.500">
                            ${(item.product.amount_usd * item.quantity).toFixed(2)}
                          </Text>
                        </HStack>
                        <Text fontSize="sm" opacity="0.7" mb={1}>
                          {item.product.description || "Sin descripción disponible"}
                        </Text>
                        <HStack justify="space-between">
                          <Badge colorPalette="blue" variant="outline">
                            x {item.quantity} unidad{item.quantity > 1 ? "es" : ""}
                          </Badge>
                          <Text fontSize="sm" opacity="0.5" >
                            ${item.product.amount_usd} c/u
                          </Text>
                        </HStack>
                      </Box>
                    </HStack>
                  </Box>
                ))}
                
                <Spacer my={4} />
                
                <HStack justify="space-between" mt={2}>
                  <Text fontSize="lg" fontWeight="bold">Total:</Text>
                  <Text fontSize="xl" fontWeight="bold" color="green.600">
                    ${totalUSD.toFixed(2)} USD
                  </Text>
                </HStack>
              </Stack>
            )}
          </Box>

          {/* Mensajes de stock */}
          {cart.length > 0 && checkingStock && (
            <Box mt={4} textAlign="center">
              <Spinner size="lg" />
              <Text mt={2}>Verificando disponibilidad...</Text>
            </Box>
          )}
          {cart.length > 0 && stockIssues.length > 0 && (
            <Box mt={4} p={4} borderWidth="1px" borderRadius="md" borderColor="red.200" bg="red.50">
              <Text color="red.600" fontWeight="bold" mb={2}>
                No hay suficiente stock para los siguientes productos:
              </Text>
              <VStack align="stretch" gap={2}>
                {stockIssues.map((item) => (
                  <Text key={item.id} fontSize="sm">
                    Producto ID: {item.id} — Disponible: {item.available}
                  </Text>
                ))}
              </VStack>
              <Button 
                onClick={() => navigate("/cart-summary")} 
                variant="outline" 
                colorPalette="red" 
                mt={4}
                size="sm"
              >
                Editar carrito
              </Button>
            </Box>
          )}
        </GridItem>

        {/* Columna derecha - Formulario de pago */}
        {cart.length > 0 && (
          <GridItem>
            <Box p={6} position="sticky" top="20px">
            {isLoadingState || isApprovePending ? (
              <VStack gap={4}>
                <Spinner 
                  size="lg" 
                  color="blue.500"
                />
                <Text textAlign="center" fontSize="md">
                  {progressMessage || "Procesando tu transacción..."}
                </Text>
                {!isAuthenticated && (
                  <Text fontSize="sm" color="blue.600">
                    Por favor, confirma la solicitud de firma en tu wallet
                  </Text>
                  )
                }                                
                {(isApproving || isApprovePending) && (
                  <Text fontSize="sm" color="blue.600">
                    Por favor confirma la operación en tu wallet
                  </Text>
                )}
                {isConfirming && (
                  <VStack spaceY={1}>
                    <Text fontSize="sm" opacity={0.7}>
                      La transacción está siendo confirmada en la blockchain
                    </Text>
                    <Text fontSize="xs" opacity={0.6}>
                      Esto puede tomar unos momentos...
                    </Text>
                  </VStack>
                )}
              </VStack>
            ) : !isWalletRegistered ? (
              <VStack gap={4}>
                <Text textAlign="center">
                  Antes de realizar tu primera transacción en nuestra plataforma de compras onchain, 
                  es necesario registrar la wallet y firmar un mensaje para verificar que eres el propietario.
                </Text>
                <Button 
                  colorPalette="blue" 
                  onClick={() => navigate("/register-wallet")}
                  width="full"
                >
                  Ir al registro de wallet
                </Button>
              </VStack>
            ) : (
              <PaymentForm
                onSubmit={handlePayment}
                isProcessing={isLoadingState}
                selectedToken={token}
                setSelectedToken={setToken}
                amount={amount}
                setAmount={setAmount}
                isWalletRegistered={isWalletRegistered}
                isAuthenticated={isAuthenticated}
              />          
            )}
            </Box>
          </GridItem>
        )}
      </Grid>
    </Box>
  );
}