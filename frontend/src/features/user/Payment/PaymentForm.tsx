import { 
  Input, 
  VStack, 
  Box, 
  Text,
  Field,
  NativeSelect,
  Button,
  Dialog,
  Portal,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useTokenPrices } from "@/shared/hooks/useTokenPrices";
import { useCart } from "@/features/user/context/CartContext";
import { toaster } from "@/shared/components/ui/toaster";
import { GrTransaction } from "react-icons/gr";
import { useWallet } from "@/features/user/hooks/useWallet";

type Token = "USDT" | "USDC" | "ETH" | "LINK";

interface PaymentFormProps {
  onSubmit: (amount: string, token: Token) => void;
  isProcessing: boolean;
  selectedToken: Token;
  setSelectedToken: (token: Token) => void;
  amount: string;
  setAmount: (amount: string) => void;
  isWalletRegistered: boolean | null;
  hasStockIssues: boolean;
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
  selectedToken, 
  setSelectedToken, 
  amount, 
  setAmount,
  isWalletRegistered,
  hasStockIssues,
}: PaymentFormProps) {
  const { prices: tokenPrices, loading: isTokenLoading } = useTokenPrices();
  const { cart } = useCart();
  const { authenticate, isAuthenticated } = useWallet();  
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [totalUSD, setTotalUSD] = useState(0);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

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

  const handleAuthAndPayment = async () => {
    // Verificar stock antes de continuar
    if (hasStockIssues) {
      toaster.create({
        title: "Error",
        description: "No hay suficiente stock de algunos productos. Por favor, edita tu carrito.",
        type: "error",
        duration: 5000,
      });
      return;
    }

    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }
    
    await onSubmit(amount, selectedToken);
  };

  const handleAuthConfirm = async () => {
    setIsAuthLoading(true);
    try {
      const authSuccess = await authenticate();
      if (authSuccess) {
        await onSubmit(amount, selectedToken);
        setShowAuthDialog(false);        
      } else {
        console.warn("Autenticación fallida (authSuccess false)");        
      }
    } catch (error) {
      console.error("Error en autenticación:", error);
      toaster.create({
        title: "Error de autenticación",
        description: error instanceof Error ? error.message : "No se pudo autenticar",
        type: "error",
        duration: 3000,
      });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const isButtonDisabled = isProcessing || isAuthLoading || !amount || !isWalletRegistered || hasStockIssues;

  return (
    <Box p={6} boxShadow="md" width="100%" maxW="500px" className="form">
      <VStack spaceY={5} align="stretch">

        <Field.Root>
          <Field.Label fontWeight="medium" mb={2} color="gray.600" _dark={{ color: "gray.300" }}>
            Selecciona un token
          </Field.Label>
          <NativeSelect.Root disabled={isProcessing || isAuthLoading}>
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
            1 USD ≈ {(1 / tokenPrices[selectedToken]).toFixed(6)} {selectedToken} <br />
            1 {selectedToken} ≈ {(tokenPrices[selectedToken]).toFixed(6)}
          </Text>
        )}

        {hasStockIssues && (
          <Text fontSize="sm" color="red.500" textAlign="center">
            ⚠️ Hay productos sin stock suficiente. Por favor, revisa tu carrito.
          </Text>
        )}

        <Button
          colorPalette="blue"
          onClick={handleAuthAndPayment}        
          disabled={isButtonDisabled}
          loading={isProcessing || isAuthLoading}
          loadingText={"Procesando..."}
          mt={4}
          width="full"
        >
          <GrTransaction />
          {isAuthenticated ? "Confirmar Pago" : "Autenticar y Pagar"}
        </Button>

        {/* Dialog de autenticación */}
        <Dialog.Root open={showAuthDialog} onOpenChange={(e) => setShowAuthDialog(e.open)}>
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content>
                <Dialog.Header>
                  <Dialog.Title>Firma Requerida</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <Text>Por favor, firma el mensaje en tu wallet para realizar una transacción segura.</Text>
                  {!isWalletRegistered && (
                    <Text mt={2} color="red.500">
                      Debes registrar tu wallet primero
                    </Text>
                  )}
                </Dialog.Body>
                <Dialog.Footer>
                  <Button variant="outline" onClick={() => setShowAuthDialog(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    colorPalette="blue" 
                    onClick={handleAuthConfirm}
                    loading={isAuthLoading}
                    disabled={!isWalletRegistered}
                  >
                    Firmar Mensaje
                  </Button>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      </VStack>
    </Box>
  );
}