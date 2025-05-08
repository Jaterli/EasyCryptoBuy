import { 
  Input, 
  VStack, 
  Box, 
  Text,
  Field,
  NativeSelect,
  Button,
  Dialog,
  IconButton,
  useDisclosure,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useTokenPrices } from "@/shared/hooks/useTokenPrices";
import { useCart } from "@/features/user/context/CartContext";
import { toaster } from "@/shared/components/ui/toaster";
import { GrTransaction } from "react-icons/gr";
import { useWallet } from "@/shared/context/useWallet";

type Token = "USDT" | "USDC" | "ETH" | "LINK";

interface PaymentFormProps {
  onSubmit: (amount: string, token: Token) => void;
  isProcessing: boolean;
  selectedToken: Token;
  setSelectedToken: (token: Token) => void;
  amount: string;
  setAmount: (amount: string) => void;
  isWalletRegistered: boolean | null;
  isAuthenticated : boolean,
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
  isAuthenticated,
}: PaymentFormProps) {
  const { prices: tokenPrices, loading: isTokenLoading } = useTokenPrices();
  const { cart } = useCart();
  const { authenticate } = useWallet();  
  const { open: isAuthDialogOpen, onOpen: openAuthDialog, onClose: closeAuthDialog } = useDisclosure();  
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
    try {
      if (!isAuthenticated) {
        setShowAuthDialog(true);
        return;
      }
        // Si ya está autenticado, proceder directamente al pago
        await onSubmit(amount, selectedToken);

      } catch (error) {
      toaster.create({
        title: "Error",
        description: `Error al iniciar el pago: ${error instanceof Error ? error.message : ''}`,
        type: "error",
        duration: 3000,
      });
    }
  }

  const handleAuthConfirm = async () => {
    setIsAuthLoading(true);
    try {
      const authSuccess = await authenticate();
      if (authSuccess) {
        closeAuthDialog();
        await onSubmit(amount, selectedToken);
      }
    } catch (error) {
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
            1 USD ≈ {(1 / tokenPrices[selectedToken]).toFixed(6)} {selectedToken}
          </Text>
        )}

        {!isAuthenticated && (
          <Text fontSize="sm" color="orange.500" textAlign="center">
            Debes autenticarte para realizar el pago
          </Text>
        )}

      <IconButton
          colorPalette="blue"
          onClick={handleAuthAndPayment}        
          disabled={isProcessing || !amount || !isWalletRegistered}
          loading={isProcessing || isAuthLoading}
          loadingText={"Procesando..."}
          mt={4}
          aria-label="Confirmar pago"
        >
          <GrTransaction />
          {isAuthenticated ? "Confirmar Pago" : "Autenticar y Pagar"}
        </IconButton>

        {/* Dialog de autenticación */}
        <Dialog.Root open={showAuthDialog} onOpenChange={(e) => !e.open && setShowAuthDialog(false)}>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Firma Requerida</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text>Por favor, firma el mensaje en tu wallet para confirmar la transacción.</Text>
                {!isWalletRegistered && (
                  <Text mt={2} color="red.500">
                    Debes registrar tu wallet primero
                  </Text>
                )}
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline">Cancelar</Button>
                </Dialog.ActionTrigger>
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
        </Dialog.Root>
      </VStack>
    </Box>
  );
}