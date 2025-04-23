import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useState, useEffect, useCallback } from "react";
import { Box, VStack, Text, Spinner, Heading, HStack, Button } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import ContractABI from "@/abis/PAYMENT_CONTRACT_ABI.json";
import StandardERC20ABI from "@/abis/ERC20.json";
import { PaymentForm } from "./PaymentForm";
import { useWallet } from "@/context/useWallet";
import WalletAddress from "@/components/TruncatedAddress";
import TransactionData from "@/components/TransactionData";
import { useNavigate } from "react-router-dom";

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

interface PendingTransaction {
  amount: string;
  token: keyof typeof TOKEN_DECIMALS;
}

interface TransactionProp {
  transaction_hash: string;
  amount: string;
  created_at: string;
  token: string;
  status: string;
}

interface PaymentProps {
  onReset: () => void;
}

export function Payment({ onReset }: PaymentProps) {
  const { address } = useAccount();
  const { isWalletRegistered, isLoading: isWalletLoading } = useWallet();
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<keyof typeof TOKEN_DECIMALS>("ETH");
  const [pendingTx, setPendingTx] = useState<PendingTransaction | null>(null);
  const [transactionData, setTransaction] = useState<TransactionProp | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const navigate = useNavigate();

  const { 
    data: hash, 
    writeContract, 
    isPending: isTransactionPending,
    error: writeError 
  } = useWriteContract();
  
  const { 
    data: approveHash,
    writeContract: writeApprove,
    isPending: isApprovePending,
    error: approveError    
  } = useWriteContract();

  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({ hash });

  const { 
    isLoading: isApproving,
    isSuccess: isApproveConfirmed
  } = useWaitForTransactionReceipt({ hash: approveHash });

  const showToast = useCallback((type: 'info' | 'error' | 'success', title: string, message: string) => {
    toaster.create({ title, description: message, type, duration: type === 'error' ? 5000 : 3000 });
  }, []);


   // Manejo de errores de transacción
  useEffect(() => {
    if (writeError) {
      setPendingTx(null);
      showToast('error', "Error en transacción", writeError.message);
    }
  }, [writeError, showToast]);

  // Registro en backend después de confirmación en blockchain
  const registerTransaction = useCallback(async () => {
    if (!hash || !address || !pendingTx) return;
    
    try {
      const response = await fetch("http://localhost:8000/payments/register-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: address,
          amount: pendingTx.amount,
          transaction_hash: hash,
          token: pendingTx.token
        }),
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

  // Polling para actualizar el estado de la transacción
  useEffect(() => {  
    let interval: NodeJS.Timeout;
    
    if (transactionData?.status === "pending") {
      interval = setInterval(() => {
        fetch(`http://localhost:8000/payments/transaction-details?txHash=${transactionData.transaction_hash}`)
          .then(response => response.json())
          .then(data => {
            if (data.success && data.transaction) {
              setTransaction(data.transaction);
            }
          })
          .catch(console.error);
      }, 10000); // Polling cada 10 segundos
    }
    
    return () => interval && clearInterval(interval);
  }, [transactionData]);


  // Manejo de aprobación ERC20
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
        // Añadido await para esperar la aprobación
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

  return (
    <Box textAlign="center" p={5}>
      <VStack spaceY={4}>
        <Heading size="2xl">Realizar un pago</Heading>

        {address && (
            <HStack>
            <Text>Wallet conectada:</Text>
            <WalletAddress address={address} />
          </HStack>
        )}

        {!address ? (
          <Text color="gray.500">Conecta tu wallet para continuar.</Text>
        ) : isLoadingState || isApprovePending ? (
          <Spinner size="lg" />
        ) : !isWalletRegistered ? (
          <VStack spaceY={4}>
          <Text>
            Antes de realizar tu primera transacción en nuestra plataforma de pagos onchain, es necesario firmar un mensaje para
            verificar que eres el propietario de esta wallet. Esto garantiza la seguridad y evita fraudes, permitiéndonos
            registrar tu dirección de manera segura.
          </Text>
          <Button colorPalette="blue" onClick={() => navigate("/register")}>
            Ir al registro de wallet
          </Button>          
          </VStack>
        ) : paymentCompleted ? (  // Mostrar botón si el pago está completo
          <VStack spaceY={4}>
            <Text color="green.500">¡Pago realizado con éxito!</Text>
            <Button 
              colorPalette="blue" 
              onClick={onReset}
              variant="outline"
            >
              Realizar nuevo pago
            </Button>
          </VStack>
          ) : (
          <>
            <PaymentForm
              onSubmit={handlePayment}
              isProcessing={isLoadingState}
              selectedToken={token}
              setSelectedToken={setToken}
              amount={amount}
              setAmount={setAmount}
            />
          </>
        )}

        {token !== 'ETH' && isApprovePending && (
          <Text color="blue.500" mt={4}>
            Por favor, aprueba el límite de gasto en tu wallet (MetaMask)
          </Text>
        )}

        {token !== 'ETH' && isApproving && (
          <Text color="blue.500" mt={4}>
            Esperando confirmación de la aprobación en la blockchain...
          </Text>
        )}

        {token !== 'ETH' && approveError && (
          <Text color="red.500" mt={4}>
            Error en la aprobación del límite de gasto...
          </Text>
        )}

        {isTransactionPending && (
          <Text color="blue.500" mt={4}>
            Por favor, confirma la transacción en tu wallet (MetaMask)
          </Text>
        )}

        {isConfirming && (
          <Text color="blue.500" mt={4}>
            Esperando confirmación de la transacción en la blockchain...
          </Text>
        )}

        {transactionData && (
          <TransactionData tx={transactionData} />
        )}          

      </VStack>
    </Box>
  );
}