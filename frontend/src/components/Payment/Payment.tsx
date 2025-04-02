import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useState, useEffect } from "react";
import { Box, VStack, Text, Spinner, Heading, HStack } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import PaymentContract from "@/abis/PaymentContract.json";
import { PaymentForm } from "./PaymentForm";
import { TransactionStatus } from "./TransactionStatus";
import { useWallet } from "@/context/WalletContext"; // Importar contexto de wallet
import UserForm from "../UserForm";
import WalletAddress from "@/components/TruncatedAddress"

export function Payment() {
  const { address } = useAccount();
  const [ amount, setAmount ] = useState<string>("");
  const [ isProcessing, setIsProcessing ] = useState(false);
  const { isWalletRegistered, isLoading } = useWallet(); // Datos de autenticación de wallet
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Enviar transacción al backend cuando se confirme
  useEffect(() => {
    if (isConfirmed && hash) {
      fetch("http://localhost:8000/payments/register-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: address,
          amount,
          transaction_hash: hash,
        }),
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            toaster.create({ title: "Éxito", description: "Pago registrado.", type: "success", duration: 3000 });
          } else {
            throw new Error(result.message);
          }
        })
        .catch((error) => {
          toaster.create({ title: "Error", description: error.message, type: "error", duration: 5000 });
        })
        .finally(() => setIsProcessing(false)); // Finalizar el proceso
    }
  }, [isConfirmed, hash]);

  const handlePayment = (amount: string) => {
    if (!address) {
      toaster.create({ title: "Error", description: "Conecta tu wallet.", type: "error", duration: 5000 });
      return;
    }

    const amountInWei = BigInt(Number(amount) * 10 ** 18);
    setIsProcessing(true);

    writeContract({
      address: "0xd9145CCE52D386f254917e481eB44e9943F39138",
      abi: PaymentContract,
      functionName: "pay",
      value: amountInWei,
    });

    setAmount(amount);
  };

  return (
    <Box textAlign="center" p={5}>
      <VStack spaceY={4}>
        <Heading size="2xl">Realizar un pago en ETH</Heading>
  
        {!address ? (
          <Text color="gray.500">Conecta tu wallet para continuar.</Text>
        ) : isLoading ? (
          <Spinner size="lg" />
        ) : !isWalletRegistered ? (
          <>
            <Text>
              Antes de realizar tu primera transacción en nuestra plataforma de pagos onchain, es necesario firmar un mensaje para
              verificar que eres el propietario de esta wallet. Esto garantiza la seguridad y evita fraudes, permitiéndonos
              registrar tu dirección de manera segura.
            </Text>
            <UserForm onSubmit={() => {}} />
          </>
        ) : (
          <>
            <HStack>
              Wallet conectada: <WalletAddress address={address} />
            </HStack>
            <PaymentForm onSubmit={handlePayment} isProcessing={isPending || isConfirming || isProcessing} />
            <TransactionStatus hash={hash ?? null} isConfirmed={isConfirmed} />
          </>
        )}
      </VStack>
    </Box>
  );
  }
