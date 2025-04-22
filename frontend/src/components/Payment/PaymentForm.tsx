import { Button, Input, VStack, Select, createListCollection, Portal, Spinner, Box } from "@chakra-ui/react";
import { useEthPrice } from "./PriceFetcher";

interface PaymentFormProps {
  onSubmit: (amount: string, token: "ETH" | "USDT" | "USDC" | "LINK") => void;
  isProcessing: boolean;
  selectedToken: "ETH" | "USDT" | "USDC" | "LINK";
  setSelectedToken: (token: "ETH" | "USDT" | "USDC" | "LINK") => void;
  amount: string;
  setAmount: (amount: string) => void;
}

export function PaymentForm({ onSubmit, isProcessing, amount, selectedToken, setSelectedToken, setAmount }: PaymentFormProps) {
  const { price, loading } = useEthPrice("usd");

  const handlePayment = () => {
    if (!amount || isNaN(Number(amount))) {
      alert("Ingresa un monto válido.");
      return;
    }
    onSubmit(amount, selectedToken);
  };


  const tokens = createListCollection({
    items: [
      { label: "Ethereum (ETH)", value: "ETH" },
      { label: "Tether (USDT)", value: "USDT" },
      { label: "USD Coin (USDC)", value: "USDC" },
      { label: "Chainlink (LINK)", value: "LINK" },
    ],
  })

  return (
    <VStack>
      <Select.Root collection={tokens} value={[selectedToken]}
        onValueChange={(details) => setSelectedToken(details.value[0] as "ETH" | "USDT" | "USDC" | "LINK")} size="sm" width="320px">
        <Select.HiddenSelect />
        <Select.Label>Selecciona un token</Select.Label>
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder="Selecciona un token" />
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Control>
        <Portal>
          <Select.Positioner>
            <Select.Content>
              {tokens.items.map((token) => (
                <Select.Item item={token} key={token.value}>
                  {token.label}
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>

      <Input
        type="number"
        placeholder={`Monto en ${selectedToken}`}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        disabled={isProcessing}
      />
      
      {loading ? <Spinner /> : <Box color="yellow.400" fontSize="sm">1 ETH ≈ {price} USD</Box>}

      <Button
        marginTop={4}
        colorPalette="blue"
        onClick={handlePayment}        
        disabled={isProcessing || !amount}
        loading={isProcessing}
        loadingText="Procesando..."
      >
        Pagar
      </Button>
    </VStack>
  );
}
