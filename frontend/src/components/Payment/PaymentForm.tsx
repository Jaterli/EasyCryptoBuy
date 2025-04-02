import { useState } from "react";
import { Button, Input, Spinner, VStack, Box } from "@chakra-ui/react";
import { useEthPrice } from "./PriceFetcher";

interface PaymentFormProps {
  onSubmit: (amount: string) => void;
  isProcessing: boolean;
}

export function PaymentForm({ onSubmit, isProcessing }: PaymentFormProps) {
  const [amount, setAmount] = useState("");
  const {price, loading} = useEthPrice("usd");

  const handlePayment = () => {
    if (!amount || isNaN(Number(amount))) {
      alert("Ingresa un monto válido en ETH.");
      return;
    }
    onSubmit(amount);
  };

  return (
    <VStack>
      <Input
        type="number"
        placeholder="Monto en ETH"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        disabled={isProcessing}
      />
      {loading ? <Spinner /> : <Box color="yellow.400" fontSize="sm">1 ETH ≈ {price} USD</Box>}

      <Button
        marginTop={4}
        colorScheme="blue"
        onClick={handlePayment}
        disabled={isProcessing}
        loading={isProcessing}
        loadingText="Procesando..."
      >
        Pagar
      </Button>
    </VStack>
  );
}
