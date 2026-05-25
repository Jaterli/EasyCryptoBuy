import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useState, useEffect, useCallback, useRef } from "react";
import { Box, VStack, Text, Spinner, Heading, HStack, Button, Grid, GridItem, Image, Badge, Flex, Dialog, Portal } from "@chakra-ui/react";
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
  const { cart, clearCart, setCart, cartLoading } = useCart();
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<keyof typeof TOKEN_DECIMALS>("ETH");
  const [pendingTx, setPendingTx] = useState<PendingTransaction | null>(null);
  const [transactionData, setTransaction] = useState<Transaction | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [stockIssues, setStockIssues] = useState<{ id: string, available: number }[]>([]);
  const [checkingStock, setCheckingStock] = useState(false);
  const [transaction_id, setTransactionId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [hasPendingTransactions, setHasPendingTransactions] = useState(false);
  const [checkingPending, setCheckingPending] = useState(true);
  const { data: hash, writeContract, isPending: isTransactionPending, error: writeError } = useWriteContract();
  const { data: approveHash, writeContract: writeApprove, isPending: isApprovePending, error: writeApproveError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const { isLoading: isApproving, isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({ hash: approveHash });
  const cartSnapshotRef = useRef<typeof cart>([]);

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
      setCart(cartSnapshotRef.current);
    }
    setPendingTx(null);
    setIsDialogOpen(false);
  };

  // Actualizar la referencia cada vez que el carrito cambie (solo cuando tiene items)
  useEffect(() => {
    if (cart.length > 0) {
      cartSnapshotRef.current = [...cart]; // Guardar una copia profunda
    }
  }, [cart]);

  // Verificar transacciones pendientes al cargar el componente y cuando cambia la wallet
  useEffect(() => {
    const checkPending = async () => {
      if (!address || !isWalletRegistered) {
        setCheckingPending(false);
        return;
      }

      setCheckingPending(true);
      try {
        const response = await axiosUserAPI.checkPendingTransactions(address);
        setHasPendingTransactions(response.data.has_pending);
      } catch (error) {
        console.error("Error verificando transacciones pendientes:", error);
        setHasPendingTransactions(false);
      } finally {
        setCheckingPending(false);
      }
    };

    checkPending();
  }, [address, isWalletRegistered]);

  useEffect(() => {
    if (writeError || writeApproveError) {
      cleanupFailedTransaction();
      showToast('error', "Error en transacción", (writeError ? writeError.message : writeApproveError ? writeApproveError.message : 'Error desconocido'));
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

  // Validación del carrito y stock
  useEffect(() => {
    if (cart && cart.length > 0 && !hasPendingTransactions) {
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
  }, [cart, hasPendingTransactions]);

  // Actualización y obtención de detalles de transacción después de confirmación
  useEffect(() => {
    if (isConfirmed && pendingTx && transaction_id) {
      const updateAndFetchTransaction = async () => {
        try {
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
  
          const detailsResponse = await axiosUserAPI.getTransactionDetail(hash);
          
          if (detailsResponse.success && detailsResponse.data) {
            setTransaction(detailsResponse.data);
            setPaymentCompleted(true);
            setIsDialogOpen(false);
          } else {
            throw new Error(detailsResponse.error || "Error al obtener detalles de la transacción");
          }
        } catch (error) {
          const apiError = error as ApiError;
          const errorMessage = apiError.response ? apiError.response.data.message : "Error desconocido";  
          showToast('error', "Error en el servidor", errorMessage);
          setPendingTx(null);
          setIsDialogOpen(false);
        }
      };
  
      updateAndFetchTransaction();
    }
  }, [isConfirmed, hash, address, transaction_id, pendingTx, showToast]);

  // Polling de estado de transacción
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (paymentCompleted && transactionData && transactionData.status === 'pending' && hash) {
      const fetchTransactionDetails = async () => {
        try {
          const response = await axiosUserAPI.getTransactionDetail(hash);
          if (response.success && response.data) {
            setTransaction(response.data);
            if (response.data.status === 'confirmed') {
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
  }, [paymentCompleted]); 

  // Ejecutar pago con tokens (no ETH)
  useEffect(() => {
    if (token !== "ETH" && isApproveConfirmed && pendingTx) {
      const executeTokenPayment = async () => {
        try {        
          const savedCart = cartSnapshotRef.current;
          const registerResponse = await axiosUserAPI.registerTransaction({
            wallet_address: address!,
            amount: pendingTx.amount,
            token: pendingTx.token,
            cart_items: (savedCart.length > 0 ? savedCart : cart).map(item => ({
              product_id: item.product.id,
              quantity: item.quantity
            }))                      
          });
          setTransactionId(registerResponse.data.transaction_id);

          // Limpiar el carrito inmediatamente después de registrar la transacción
          await clearCart();

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
          setIsDialogOpen(false);
        }
      };

      executeTokenPayment();
    }
  }, [isApproveConfirmed, pendingTx, token, writeContract, address, convertToTokenUnits, showToast, clearCart]);

  // Registro de transacción inicial
  const handlePayment = async (amount: string, token: keyof typeof TOKEN_DECIMALS) => {
    // Verificar stock antes de continuar 
    if (stockIssues.length > 0) {
      showToast('error', "Error", "No hay suficiente stock de algunos productos. Por favor, edita tu carrito.");
      return;
    }

    if (!address) {
      showToast('error', "Error", "Por favor, conecta tu wallet primero.");
      return;
    }
    
    // Verificar si el carrito tiene items
    if (!cart || cart.length === 0) {
      showToast('error', "Error", "Tu carrito está vacío.");
      return;
    }
        
    const decimalCount = amount.split('.')[1]?.length || 0;
    if (decimalCount > TOKEN_DECIMALS[token]) {
      showToast('error', "Error", `Máximo ${TOKEN_DECIMALS[token]} decimales permitidos`);
      return;
    }

    setIsDialogOpen(true);

    try {
      setPendingTx({ amount, token });
      const amountInUnits = convertToTokenUnits(amount, token);

      if (token === "ETH") {
        const savedCart = cartSnapshotRef.current;
        const registerResponse = await axiosUserAPI.registerTransaction({
          wallet_address: address,
          amount,
          token,
          cart_items: (savedCart.length > 0 ? savedCart : cart).map(item => ({
            product_id: item.product.id,
            quantity: item.quantity
          }))
        });
        setTransactionId(registerResponse.data.transaction_id);
        
        // Limpiar el carrito inmediatamente después de registrar la transacción
        await clearCart();

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
      setIsDialogOpen(false);
    }
  };

  const isLoadingState = isTransactionPending || isConfirming || isApproving || isApprovePending || isAuthLoading;
  const totalUSD = cartSnapshotRef.current.reduce((sum, item) => sum + item.product.amount_usd * item.quantity, 0);
  const hasStockIssues = stockIssues.length > 0;

  // Mostrar pantalla de carga mientras se verifican transacciones pendientes
  if (checkingPending) {
    return (
      <Box p={5} mt={5} mb={5} textAlign="center">
        <VStack spaceY={4}>
          <Spinner size="xl" />
          <Text>Verificando transacciones pendientes...</Text>
        </VStack>
      </Box>
    );
  }

  // Mostrar mensaje si hay transacciones pendientes
  if (hasPendingTransactions && !paymentCompleted) {
    return (
      <Box p={5} mt={5} mb={5}>
        <VStack spaceY={6} align="center">
          <Heading size="lg" color="orange.500">
            Transacción Pendiente
          </Heading>
          <Text textAlign="center" fontSize="lg">
            Tienes una o más transacciones pendientes de confirmación.
          </Text>
          <Text textAlign="center" color="gray.600">
            Por favor, espera a que se confirme o cancele la transacción actual antes de realizar una nueva compra.
          </Text>
          <Button 
            colorPalette="blue" 
            onClick={() => window.location.reload()}
            mt={4}
          >
            Verificar estado
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate("/purchase-history")}
          >
            Ver historial de transacciones
          </Button>
        </VStack>
      </Box>
    );
  }

  if (paymentCompleted && transactionData) {
    return (
      <Box p={5} mt={5} mb={5}>
        <VStack spaceY={8} align="center">
          <Text color="green.500" fontSize="2xl" fontWeight="bold">
            ¡Compra realizada con éxito!
          </Text>
          <Box marginX={'auto'} width={{ base: "100%", md: "900px" }}>
            <TransactionData key={transactionData.id} tx={transactionData} />
          </Box>
          <Button 
            colorPalette="blue" 
            onClick={() => navigate("/purchase-history")}
            mt={4}
          >
            Ir al historial de compras
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <Box p={{ base: 4, md: 5 }} maxW="1400px" mx="auto">
      <Heading size="xl" mb={6}>
        Resumen de tu compra
      </Heading>

      <Grid 
        templateColumns={{ base: "1fr", lg: "1fr 1fr" }} 
        gap={{ base: 6, lg: 8 }}
      >
        <GridItem>
          {cartLoading ? (
            <VStack>
              <Spinner size="md" />
              <Text>Cargando carrito...</Text>
            </VStack>
          ) : cartSnapshotRef.current.length === 0 && !isLoadingState ? (
            <VStack gap={4} textAlign="center" py={8}>
              <Text fontSize="xl" fontWeight="medium">Tu carrito está vacío</Text>
              <Text color="gray.500">No hay productos para mostrar</Text>
              <Button colorScheme="blue" mt={4} onClick={() => navigate("/products-catalog")}>
                Explorar productos
              </Button>
            </VStack>
          ) : (
            <VStack align="stretch" gap={4}>
              {cartSnapshotRef.current.map((item) => (
                <Box 
                  key={item.product.id} 
                  p={4} 
                  borderWidth="1px" 
                  borderRadius="lg"
                  _hover={{ boxShadow: "md" }}
                >
                  <Flex gap={4} direction={{ base: "column", sm: "row" }}>
                    <Image 
                      src={item.product.image || "https://placehold.co/300x200?text=Sin+Imagen"}
                      boxSize={{ base: "100%", sm: "80px" }}
                      objectFit="cover"
                      borderRadius="md"
                      alt={item.product.name}
                    />
                    <Box flex={1}>
                      <Flex justify="space-between" wrap="wrap" gap={2}>
                        <Text fontWeight="bold" fontSize="lg">{item.product.name}</Text>
                        <Text fontWeight="bold" color="blue.500">
                          ${(item.product.amount_usd * item.quantity).toFixed(2)}
                        </Text>
                      </Flex>
                      <Text fontSize="sm" opacity="0.7" mb={1}>
                        {item.product.description || "Sin descripción disponible"}
                      </Text>
                      <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                        <Badge colorScheme="blue" variant="outline">
                          x {item.quantity} unidad{item.quantity > 1 ? "es" : ""}
                        </Badge>
                        <Text fontSize="sm" opacity="0.5">
                          ${item.product.amount_usd} c/u
                        </Text>
                      </Flex>
                    </Box>
                  </Flex>
                </Box>
              ))}
              
              <Box pt={4} borderTopWidth="1px">
                <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
                  <Text fontSize="lg" fontWeight="bold">Total:</Text>
                  <Text fontSize="xl" fontWeight="bold" color="green.600">
                    ${totalUSD.toFixed(2)} USD
                  </Text>
                </Flex>
              </Box>
            </VStack>
          )}

          {cartSnapshotRef.current.length > 0 && checkingStock && (
            <Box mt={4} textAlign="center">
              <Spinner size="lg" />
              <Text mt={2}>Verificando disponibilidad...</Text>
            </Box>
          )}
          
          {cartSnapshotRef.current.length > 0 && hasStockIssues && (
            <Box mt={4} p={4} borderWidth="1px" borderRadius="md" borderColor="red.200">
              <Text color="red.600" fontWeight="bold" mb={2}>
                No hay suficiente stock para los siguientes productos:
              </Text>
              <VStack align="stretch" gap={2}>
                {stockIssues.map((item) => (
                  <Text key={item.id} fontSize="sm">
                    Producto ID: {item.id} — Disponible: {item.available} unidades
                  </Text>
                ))}
              </VStack>
              <Button 
                onClick={() => navigate("/cart-summary")} 
                variant="outline" 
                colorScheme="red" 
                mt={4}
              >
                Editar carrito
              </Button>
            </Box>
          )}
        </GridItem>

        {cartSnapshotRef.current.length > 0 && !hasPendingTransactions && (
          <GridItem>
            <Box w="100%">
              {!isWalletRegistered ? (
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
                  hasStockIssues={hasStockIssues}
                />
              )}
            </Box>
          </GridItem>
        )}
      </Grid>

      <Dialog.Root 
        open={isDialogOpen} 
        onOpenChange={(e) => {
          if (!isLoadingState) {
            setIsDialogOpen(e.open);
          }
        }}
        closeOnInteractOutside={false}
        closeOnEscape={false}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Procesando transacción</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                {writeError || writeApproveError ? (
                  <Box>
                    <Text color="red.500" textAlign="center">
                      Error: {writeError?.message || writeApproveError?.message}
                    </Text>
                    <Button 
                      mt={4}
                      colorPalette="blue" 
                      onClick={() => {
                        setIsDialogOpen(false);
                        window.location.reload();
                      }}
                      width="full"
                    >
                      Reintentar pago
                    </Button>
                  </Box>
                ) : (
                  renderPaymentProgress()
                )}
              </Dialog.Body>
              <Dialog.Footer>
                {!isLoadingState && (writeError || writeApproveError) && (
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cerrar
                  </Button>
                )}
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  );
}