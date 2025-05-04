import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
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
import { API_PATHS } from "@/config/paths";
import { TransactionProp } from "@/shared/types/types";

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
  const { address } = useAccount();
  const { isWalletRegistered, isLoading: isWalletLoading } = useWallet();
  const { cart, cartLoading, clearCart } = useCart();
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<keyof typeof TOKEN_DECIMALS>("ETH");
  const [pendingTx, setPendingTx] = useState<PendingTransaction | null>(null);
  const [transactionData, setTransaction] = useState<TransactionProp | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [stockIssues, setStockIssues] = useState<{ id: string, available: number }[]>([]);
  const [checkingStock, setCheckingStock] = useState(true);
  const navigate = useNavigate();

  const { data: hash, writeContract, isPending: isTransactionPending, error: writeError } = useWriteContract();
  const { data: approveHash, writeContract: writeApprove, isPending: isApprovePending, error: approveError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const { isLoading: isApproving, isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({ hash: approveHash });
  
  const showToast = useCallback((type: 'info' | 'error' | 'success', title: string, message: string) => {
    toaster.create({ title, description: message, type, duration: type === 'error' ? 5000 : 3000 });
  }, []);

  useEffect(() => {
    if (writeError) {
      setPendingTx(null);
      showToast('error', "Error en transacción", writeError.message);
    }
  }, [writeError, showToast]);

  useEffect(() => {
    const validateCart = async () => {
      try {
        const response = await fetch(`${API_PATHS.company}/validate-cart`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cart.map(item => ({ id: item.product.id, quantity: item.quantity })))
        });
        const result = await response.json();
        setStockIssues(result.invalid || []);
      } catch (error) {
        console.error("Error validando stock", error);
      } finally {
        setCheckingStock(false);
      }
    };
    validateCart();
  }, [cart]);

  const registerTransaction = useCallback(async () => {
    if (!hash || !address || !pendingTx) return;
    try {
      const response = await fetch(`${API_PATHS.payments}/register-transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: address,
          amount: pendingTx.amount,
          transaction_hash: hash,
          token: pendingTx.token
        })
      });
      const result = await response.json();
      if (result.success) {
        showToast('success', "Éxito", result.message);
        setAmount("");
        setTransaction({
          transaction_hash: hash,
          amount: pendingTx.amount,
          created_at: new Date().toISOString(),
          token: pendingTx.token,
          status: "pending"
        });
        clearCart(); 
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showToast('error', "Error en el servidor", errorMessage);
      setPendingTx(null);
    }
  }, [hash, address, pendingTx, showToast]);

  useEffect(() => {
    if (isConfirmed) {
      registerTransaction();
      setPaymentCompleted(true);
    }
  }, [isConfirmed, registerTransaction]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (transactionData?.status === "pending") {
      interval = setInterval(() => {
        fetch(`${API_PATHS.payments}/transaction-details?txHash=${transactionData.transaction_hash}`)
          .then(response => response.json())
          .then(data => {
            if (data.success && data.transaction) {
              setTransaction(data.transaction);
            }
          })
          .catch(console.error);
      }, 10000);
    }
    return () => interval && clearInterval(interval);
  }, [transactionData]);

  useEffect(() => {
    if (isApproveConfirmed && pendingTx && token !== "ETH") {
      const amountInUnits = convertToTokenUnits(pendingTx.amount, token);
      const paymentFunctionName = token === "USDC" ? "payUSDC"
        : token === "USDT" ? "payUSDT"
        : "payLINK";

      writeContract({
        address: CONTRACT_ADDRESSES.PAYMENT,
        abi: ContractABI,
        functionName: paymentFunctionName,
        args: [amountInUnits],
      });
    }
  }, [isApproveConfirmed, pendingTx, token, writeContract]);

  const convertToTokenUnits = useCallback((amount: string, tokenType: keyof typeof TOKEN_DECIMALS) => {
    const sanitizedAmount = amount.includes('.') ? amount : `${amount}.0`;
    const [integerPart, decimalPart = ''] = sanitizedAmount.split('.');
    const decimals = decimalPart.padEnd(TOKEN_DECIMALS[tokenType], '0').slice(0, TOKEN_DECIMALS[tokenType]);
    return BigInt(`${integerPart}${decimals}`);
  }, []);

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
      const txData: PendingTransaction = { amount, token };
      setPendingTx(txData);
      const amountInUnits = convertToTokenUnits(amount, token);
      if (token === "ETH") {
        await writeContract({
          address: CONTRACT_ADDRESSES.PAYMENT,
          abi: ContractABI,
          functionName: "payETH",
          args: [],
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
    } catch (error) {
      console.error("Error en transacción:", error);
      setPendingTx(null);
      showToast('error', "Error en transacción", error instanceof Error ? error.message : "Error desconocido");
    }
  };

  const isLoadingState = isTransactionPending || isConfirming || isApproving || isWalletLoading;
  const totalUSD = cart.reduce((sum, item) => sum + item.product.amount_usd * item.quantity, 0);

  if (paymentCompleted) {
    return (
      <Box p={5} mt={5} mb={5}>
        <VStack gap={8} align="center">
          <Text color="green.500" fontSize="2xl" fontWeight="bold">
            ¡Compra realizada con éxito!
          </Text>
          {transactionData && (
            <Box width="100%" maxWidth="800px">
              <TransactionData tx={transactionData} />
            </Box>
          )}
          <Button 
            colorPalette="blue" 
            onClick={() => navigate("/products")}
            mt={4}
          >
            Volver a la tienda
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <Box p={5} mt={5} mb={5}>
      <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={{ base: "0", lg: "8" }}>
        {/* Columna izquierda - Resumen del carrito */}
        <GridItem>
          <Box>
            <Heading size="lg" mb={6} textAlign="left">Resumen de tu compra</Heading>
            
            {cartLoading ? (
              <Spinner size="md" />
            ) : cart.length === 0 ? (
              <Text opacity={0.5}>Tu carrito está vacío.</Text>
            ) : (
              <Stack align="stretch">
                {cart.map((item) => (
                  <Box className="cart-item" key={item.product.id}>
                    <HStack align="flex-start" spaceX={4}>
                      <Box flexShrink={0}>
                        <Image 
                          src={`https://picsum.photos/80?${item.product.name}`}
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
          {checkingStock ? (
            <Box mt={4} textAlign="center">
              <Spinner size="lg" />
              <Text mt={2}>Verificando disponibilidad...</Text>
            </Box>
          ) : stockIssues.length > 0 && (
            <Box mt={4} p={4} borderWidth="1px" borderRadius="md" borderColor="red.200" bg="red.50">
              <Text color="red.600" fontWeight="bold" mb={2}>
                No hay suficiente stock para los siguientes productos:
              </Text>
              <VStack align="stretch" spaceY={2}>
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
        <GridItem>
          <Box 
            p={6}
            position="sticky"
            top="20px"
          >
            {!address ? (
              <Text opacity={0.5} textAlign="center">Conecta tu wallet para continuar.</Text>
            ) : isLoadingState || isApprovePending ? (
              <VStack spaceY={4}>
                <Spinner size="lg" />
                <Text>
                  {isApprovePending 
                    ? "Esperando aprobación del token..." 
                    : "Procesando tu transacción..."}
                </Text>
              </VStack>
            ) : !isWalletRegistered ? (
              <VStack spaceY={4}>
                <Text textAlign="center">
                  Antes de realizar tu primera transacción en nuestra plataforma de compras onchain, es necesario registrar la wallet y firmar un mensaje para verificar que eres el propietario.
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
              />
            )}

            {/* Mensajes de estado */}
            {token !== 'ETH' && isApprovePending && (
              <Text color="blue.500" mt={4} textAlign="center">
                Por favor, aprueba el límite de gasto en tu wallet
              </Text>
            )}

            {token !== 'ETH' && isApproving && (
              <Text color="blue.500" mt={4} textAlign="center">
                Esperando confirmación de la aprobación...
              </Text>
            )}

            {token !== 'ETH' && approveError && (
              <Text color="red.500" mt={4} textAlign="center">
                Error en la aprobación del límite de gasto
              </Text>
            )}

            {isTransactionPending && (
              <Text color="blue.500" mt={4} textAlign="center">
                Por favor, confirma la transacción en tu wallet
              </Text>
            )}

            {isConfirming && (
              <Text color="blue.500" mt={4} textAlign="center">
                Esperando confirmación en la blockchain...
              </Text>
            )}
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
}