import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useState, useEffect, useCallback } from "react";
import { Box, VStack, Text, Spinner, Heading, HStack, Button, Grid, GridItem, Image, Badge, Spacer, Stack } from "@chakra-ui/react";
import { toaster } from "@/shared/components/ui/toaster";
import ContractABI from "@/abis/PAYMENT_CONTRACT_ABI.json";
import StandardERC20ABI from "@/abis/ERC20.json";
import { PaymentForm } from "./PaymentForm";
import { useWallet } from "@/features/user/hooks/useWallet";
import { useNavigate } from "react-router-dom";
import TransactionData from "../components/TransactionData";
import { useCart } from "@/features/user/context/CartContext";
import { ApiError, Transaction } from "@/shared/types/types";
import { FaCheckCircle } from "react-icons/fa";
import { axiosUserAPI } from "../services/userApi";

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
  const navigate = useNavigate();
  const { address, isWalletRegistered, isLoading: isAuthLoading } = useWallet();
  const { cart, setCart, cartLoading } = useCart();
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<keyof typeof TOKEN_DECIMALS>("ETH");
  const [pendingTx, setPendingTx] = useState<PendingTransaction | null>(null);
  const [checkPendingTx, setChekPendingTx] = useState<boolean>(false);
  const [transactionData, setTransaction] = useState<Transaction | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [stockIssues, setStockIssues] = useState<{ id: string, available: number }[]>([]);
  const [checkingStock, setCheckingStock] = useState(false);
  const [transaction_id, setTransactionId] = useState<number | null>(null);
  const { data: hash, writeContract, isPending: isTransactionPending, error: writeError } = useWriteContract();
  const { data: approveHash, writeContract: writeApprove, isPending: isApprovePending, error: writeApproveError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const { isLoading: isApproving, isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({ hash: approveHash });

  const showToast = useCallback((type: 'info' | 'error' | 'success', title: string, message: string) => {
    toaster.create({ title, description: message, type, duration: type === 'error' ? 5000 : 3000 });
  }, []);

  const getProgressSteps = (token: keyof typeof TOKEN_DECIMALS) => [
    {
      title: 'Autenticando en el sistema',
      description: 'Firma el mensaje en tu wallet',
      status: 'pending'
    },    
    {
      title: token === 'ETH' ? 'Confirmando transacción' : 'Aprobando token',
      description: 'Confirma en tu wallet',
      status: 'pending'
    },
    {
      title: 'Registrando transacción',
      description: 'Guardando en nuestro sistema',
      status: 'pending'
    },
    {
      title: 'Enviando transacción a la blockchain',
      description: 'Confirma en tu wallet',
      status: 'pending'
    },
    {
      title: 'Esperando confirmación',
      description: 'Puede tomar unos minutos...',
      status: 'pending'
    }
  ];  

  type PaymentStep = 
    | 'idle'
    | 'authLoading'
    | 'approving'
    | 'registering'
    | 'sending'
    | 'confirming'
    | 'completed';

  const [paymentStep, setPaymentStep] = useState<PaymentStep>('idle');

  const renderPaymentProgress = () => {
    const steps = getProgressSteps(token);
    let activeStep = 0;
    
    if (paymentStep === 'authLoading') activeStep = 0;
    else if (paymentStep === 'approving') activeStep = 1;
    else if (paymentStep === 'registering') activeStep = 2;
    else if (paymentStep === 'sending') activeStep = 3;
    else if (paymentStep === 'confirming') activeStep = 4;

    return (
      <VStack align="stretch" spaceY={4} p={4}>
        {steps.map((step, index) => {
          // No renderizar el paso 0 (index 0) si token es ETH y estamos en approving
          if (token === "ETH" && index === 1) {
            return null;
          }
          
          return (
            <HStack key={index} align="flex-start">
              <Box pt={1}>
                {index < activeStep ? (
                  <FaCheckCircle color="green" />
                ) : index === activeStep ? (
                  <Spinner size="sm" color="blue.500" />
                ) : (
                  <Box 
                    w="16px" 
                    h="16px" 
                    borderRadius="full" 
                    border="2px" 
                    borderColor="gray.300" 
                  />
                )}
              </Box>
              <Box>
                <Text 
                  fontWeight={index <= activeStep ? 'bold' : 'normal'}
                  color={index === activeStep ? 'blue.600' : 'inherit'}
                >
                  {step.title}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {step.description}
                </Text>
              </Box>
            </HStack>
          );
        })}      
      </VStack>
    );
  };

  const convertToTokenUnits = useCallback((amount: string, tokenType: keyof typeof TOKEN_DECIMALS) => {
    const sanitizedAmount = amount.includes('.') ? amount : `${amount}.0`;
    const [integerPart, decimalPart = ''] = sanitizedAmount.split('.');
    const decimals = decimalPart.padEnd(TOKEN_DECIMALS[tokenType], '0').slice(0, TOKEN_DECIMALS[tokenType]);
    return BigInt(`${integerPart}${decimals}`);
  }, []);

  const cleanupFailedTransaction = async () => {
    if (transaction_id) {
      await axiosUserAPI.deleteTransaction(transaction_id);
      setTransactionId(null);
    }
    setPendingTx(null);
  };

  useEffect(() => {
    if (writeError || writeApproveError) {
      cleanupFailedTransaction();
      // showToast('error', "Error en transacción", (writeError ? writeError.message : writeApproveError ? writeApproveError.message : 'Error desconocido'));
    }
  }, [writeError, writeApproveError]);

  useEffect(() => {
    if (token !== "ETH" && isAuthLoading) {
      setPaymentStep('authLoading');
    }
  }, [isAuthLoading, token]);

  useEffect(() => {
    if (token !== "ETH" && isApprovePending) {
      setPaymentStep('approving');
    }
  }, [isApprovePending, token]);

  useEffect(() => {
    if (isApproveConfirmed && pendingTx) {
      setPaymentStep('registering');
    }
  }, [isApproveConfirmed, pendingTx]);

  useEffect(() => {
    if (isTransactionPending) {
      setPaymentStep('sending');
    }
  }, [isTransactionPending]);

  useEffect(() => {
    if (isConfirming) {
      setPaymentStep('confirming');
    }
  }, [isConfirming]);

  // 1. Validación del carrito
  useEffect(() => {
    if (cart && cart.length > 0) {
      const validateCart = async () => {
        setCheckingStock(true);
        try {
          const response = await axiosUserAPI.validateCart(
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
          const { data } = await axiosUserAPI.checkPendingTransactions(address);       
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
      const updateAndFetchTransaction = async () => {
        try {
          // Actualizar la transacción
          const updateResponse = await axiosUserAPI.updateTransaction(
            transaction_id,
            {
              wallet_address: address,
              amount: pendingTx.amount,
              transaction_hash: hash,
              token: pendingTx.token
            }
          );
          
          if (!updateResponse.data.success) {
            throw new Error(updateResponse.data.message || "Error al actualizar la transacción");
          }
  
          // Obtener detalles
          const detailsResponse = await axiosUserAPI.getTransactionDetail(hash);
          
          if (detailsResponse.success && detailsResponse.data) {
            setCart([]);
            setTransaction(detailsResponse.data);
            setPaymentCompleted(true);
            // showToast('success', "¡Enhorabuena!", '');
          } else {
            console.log("Error al obtener detalles de la transacción");
            throw new Error(detailsResponse.error || "Error al obtener detalles de la transacción");
          }
        } catch (error) {
          cleanupFailedTransaction();
          const apiError = error as ApiError;
          const errorMessage = apiError.response ? apiError.response.data.message : "Error desconocido";  
          showToast('error', "Error en el servidor", errorMessage);
          console.error("Error en el servidor:", errorMessage);
          setPendingTx(null);
        }
      };
  
      updateAndFetchTransaction();
    }
  }, [isConfirmed, hash, address, transaction_id]);

  // 3. Polling de estado de transacción
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (paymentCompleted && transactionData && transactionData.status === 'pending' && hash) {
      const fetchTransactionDetails = async () => {
        try {
          const response = await axiosUserAPI.getTransactionDetail(hash);
          if (response.success && response.data) {
            setTransaction(response.data);

            if (response.data.status && response.data.status === 'confirmed') {
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
    if (token !== "ETH" && isApproveConfirmed && pendingTx) {
      const executeTokenPayment = async () => {
        try {
          
          // Registrar siempre una nueva transacción para tokens no ETH
          const registerResponse = await axiosUserAPI.registerTransaction({
            wallet_address: address!,
            amount: pendingTx.amount,
            token: pendingTx.token
          });
          setTransactionId(registerResponse.data.transaction_id);

          const amountInUnits = convertToTokenUnits(pendingTx.amount, pendingTx.token);
          const paymentFunctionName = pendingTx.token === "USDC" ? "payUSDC"
            : pendingTx.token === "USDT" ? "payUSDT"
            : "payLINK";

          writeContract({
            address: CONTRACT_ADDRESSES.PAYMENT,
            abi: ContractABI,
            functionName: paymentFunctionName,
            args: [amountInUnits, registerResponse.data.transaction_id],
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          showToast('error', "Error en el pago", errorMessage);
          setPendingTx(null);
          setTransactionId(null);
        }
      };

      executeTokenPayment();
    }
  }, [isApproveConfirmed, pendingTx, token, writeContract, address, convertToTokenUnits, showToast]);

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
      setPendingTx({ amount, token });
      const amountInUnits = convertToTokenUnits(amount, token);

      if (token === "ETH") {
        // Para ETH, registramos la transacción primero
        const registerResponse = await axiosUserAPI.registerTransaction({
          wallet_address: address,
          amount,
          token
        });
        setTransactionId(registerResponse.data.transaction_id);
        
        await writeContract({
          address: CONTRACT_ADDRESSES.PAYMENT,
          abi: ContractABI,
          functionName: "payETH",
          args: [registerResponse.data.transaction_id],
          value: amountInUnits,
        });
      } else {
        await writeApprove({
          address: CONTRACT_ADDRESSES.TOKENS[token],
          abi: StandardERC20ABI,
          functionName: "approve",
          args: [CONTRACT_ADDRESSES.PAYMENT, amountInUnits],
        });
      }
    } catch (error: unknown) {  
      const apiError = error as ApiError;
      const errorMessage = apiError.response ? apiError.response.data.message : "Error desconocido";
      
      showToast('error', "Error en transacción", errorMessage);
      console.error("Error en transacción:", errorMessage);
      setPendingTx(null);
    }
  };
  const isLoadingState = isTransactionPending || isConfirming || isApproving || isApprovePending || isAuthLoading;
  const totalUSD = cart.reduce((sum, item) => sum + item.product.amount_usd * item.quantity, 0);


  if (paymentCompleted && transactionData) {
    return (
      <Box p={5} mt={5} mb={5}>
        <VStack spaceY={8} align="center">
          <Text color="green.500" fontSize="2xl" fontWeight="bold">
            ¡Compra realizada con éxito!
          </Text>
          <Box width="100%">
            <TransactionData key={transactionData.id} tx={transactionData} />
          </Box>
          <Button 
            colorPalette="blue" 
            onClick={() => navigate("/payments-history")}
            mt={4}
          >
            Ir al historial de compras
          </Button>
        </VStack>
      </Box>
    );
  }

  if (checkPendingTx){
    return (
      <Box p={5} mt={5} mb={5}>
        <VStack spaceY={8} align="center">
          <Text textAlign={"center"} color="red.500" fontSize="lg">
            Tienes transacciones pendientes que aún no ha sido confirmadas en la blockchain. <br />
            Si no se confirman en los próximos minutos, contacte con la empresa. Mientras tanto no podrá realizar nuevas compras.
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
            <Box maxW="500px">
              {writeError || writeApproveError ? (
                <Box p={6} overflowX="auto">
                  <Text overflowX="auto" fontSize="sm" color="red.500" textAlign="center">
                    Error: {writeError?.message || writeApproveError?.message}
                  </Text>
                  <Button 
                    mt={4}
                    colorPalette="blue" 
                    onClick={() => window.location.reload()}
                    width="full"
                  >
                    Reintentar pago
                  </Button>
                </Box>
              ) : isLoadingState ? (
                <Box pl={6}>
                  <Heading size="lg" mb={6} textAlign="left">Proceso de transacción</Heading>
                  {renderPaymentProgress()}
                </Box>
              ) : !isWalletRegistered ? (
                <VStack gap={4} p={6}>
                  <Text textAlign="center">
                    Antes de realizar tu primera transacción en nuestra plataforma de compras onchain, 
                    es necesario registrar la wallet y firmar un mensaje para verificar que eres el propietario.
                  </Text>
                  <Button 
                    colorPalette="blue" 
                    onClick={() => navigate("/register-wallet")}
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
                />
              )}
            </Box>
          </GridItem>
        )}
      </Grid>
    </Box>
  );
}