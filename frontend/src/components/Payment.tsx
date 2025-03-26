import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useEffect, useState } from 'react';
import { Button, Text, Box, Input, VStack } from '@chakra-ui/react';
import { toaster } from '@/components/ui/toaster';
import PaymentContract from '../abis/PaymentContract.json'; // Importa el ABI del contrato

export function Payment() {
  const { address } = useAccount();
  const [amount, setAmount] = useState('');
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const currency = "usd";

  // Obtener precio ETH en fiat
  useEffect(() => {
    fetch(`http://localhost:8000/payments/eth-to-fiat/?currency=${currency}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEthPrice(data.price);
        }
      })
      .catch((err) => console.error("Error al obtener precio ETH:", err));
  }, []);

  // Configurar la escritura del contrato
  const { data: hash, writeContract, isPending } = useWriteContract();

  // Esperar a que la transacción se complete
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isConfirmed && hash) {
      // Enviar la transacción al backend para registrarla
      fetch('http://localhost:8000/payments/api/register-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: address,
          amount: amount,
          transaction_hash: hash,
        }),
      })
        .then((response) => response.json())
        .then((result) => {
          if (result.success) {
            toaster.create({
              title: "Éxito",
              description: result.message,
              type: "success",
              duration: 3000,
            });
          } else {
            throw new Error(result.message);
          }
        })
        .catch((error) => {
          toaster.create({
            title: "Error",
            description: error.message,
            type: "error",
            duration: 15000,
          });
        });
    }
  }, [isConfirmed, hash]);

  const handlePayment = async () => {
    if (!address) {
      toaster.create({
        title: "Error",
        description: "Conecta tu wallet para realizar un pago.",
        type: "error",
        duration: 5000,
      });
      return;
    }

    if (!amount || isNaN(Number(amount))) {
      toaster.create({
        title: "Error",
        description: "Ingresa un monto válido.",
        type: "error",
        duration: 5000,
      });
      return;
    }
    
    // Convertir el monto a wei (1 ETH = 10^18 wei)
    const amountInWei = BigInt(Number(amount) * 10 ** 18);

    // Ejecutar la transacción
    writeContract({
      address: '0xd9145CCE52D386f254917e481eB44e9943F39138', // Dirección del contrato
      abi: PaymentContract, // ABI del contrato
      functionName: 'pay',
      value: amountInWei,
    });
  };

  return (
    <Box textAlign="center" p={5}>
      <VStack spaceY={4}>
        <Text fontSize="lg" mb={4}>
          Realizar un pago en ETH
        </Text>
        {ethPrice ? (
          <Text fontSize="md" color="gray.600">
            1 ETH ≈ {ethPrice} {currency.toUpperCase()}
          </Text>
        ) : (
          <Text fontSize="md" color="gray.500">Cargando precio...</Text>
        )}
        <Input
          type="number"
          placeholder="Monto en ETH"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Button
          colorScheme="blue"
          onClick={handlePayment}
          loading={isPending || isConfirming}
          loadingText={isPending ? "Enviando..." : "Confirmando..."}
        >
          Pagar
        </Button>
        {isConfirmed && (
          <Text color="green.500" mt={4}>
            Pago realizado con éxito. Hash: {hash}
          </Text>
        )}
      </VStack>
    </Box>
  );
}
