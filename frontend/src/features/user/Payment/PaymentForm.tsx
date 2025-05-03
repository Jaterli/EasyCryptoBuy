import { 
  Input, 
  VStack, 
  Box, 
  Text,
  Field,
  NativeSelect,
  IconButton
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useTokenPrices } from "@/shared/hooks/useTokenPrices";
import { useCart } from "@/features/user/context/CartContext";
import { GrTransaction } from "react-icons/gr";

type Token = "USDT" | "USDC" | "ETH" | "LINK";

interface PaymentFormProps {
  onSubmit: (amount: string, token: Token) => void;
  isProcessing: boolean;
  selectedToken: Token;
  setSelectedToken: (token: Token) => void;
  amount: string;
  setAmount: (amount: string) => void;
}

const TOKEN_OPTIONS = [
  { label: "USD Coin (USDC)", value: "USDC" },
  { label: "Tether (USDT)", value: "USDT" },
  { label: "Ethereum (ETH)", value: "ETH" },
  { label: "Chainlink (LINK)", value: "LINK" },
];

export function PaymentForm({ 
  onSubmit, 
  isProcessing, 
  amount, 
  selectedToken, 
  setSelectedToken, 
  setAmount 
}: PaymentFormProps) {
  const { prices: tokenPrices, loading: isTokenLoading } = useTokenPrices();
  const { cart } = useCart();

  const [totalUSD, setTotalUSD] = useState(0);

  useEffect(() => {
    const total = cart.reduce((acc, item) => acc + item.product.amount_usd * item.quantity, 0);
    setTotalUSD(total);
  }, [cart]);

  useEffect(() => {
    if (!tokenPrices[selectedToken]) return;
    const tokenPriceUSD = tokenPrices[selectedToken];
    const calculatedAmount = (totalUSD / tokenPriceUSD).toFixed(6);
    setAmount(calculatedAmount);
  }, [totalUSD, selectedToken, tokenPrices, setAmount]);

  const handlePayment = () => {
    if (!amount || isNaN(Number(amount))) {
      alert("Por favor, introduce un monto válido");
      return;
    }
    onSubmit(amount, selectedToken);
  };

  return (
    <Box 
      p={6} 
      boxShadow="md"
      width="100%"
      maxW="500px"
      className="form"
    >
      <VStack spaceY={5} align="stretch">

        <Field.Root>
          <Field.Label fontWeight="medium" mb={2} color="gray.600" _dark={{ color: "gray.300" }}>
            Selecciona un token
          </Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.currentTarget.value as Token)}
          >
            {TOKEN_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>

        <Field.Root>
          <Field.Label fontWeight="medium" mb={2} color="gray.600" _dark={{ color: "gray.300" }}>
            Total en {selectedToken}
          </Field.Label>
          <Input
            type="number"
            placeholder={`0.00 ${selectedToken}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            readOnly={true}
            size="md"
          />
        </Field.Root>
        
        {!isTokenLoading && tokenPrices[selectedToken] && (
          <Text fontSize="sm" color="blue.500" textAlign="center">
            1 USD ≈ {(1 / tokenPrices[selectedToken]).toFixed(6)} {selectedToken}
          </Text>
        )}

        <IconButton
          colorPalette="blue"
          onClick={handlePayment}        
          disabled={isProcessing || !amount}
          loading={isProcessing}
          loadingText="Procesando..."
          mt={4}
        >
          <GrTransaction />
          Pagar
        </IconButton>
      </VStack>
    </Box>
  );
}
