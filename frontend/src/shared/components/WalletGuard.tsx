import { useWallet } from "@/shared/context/useWallet";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Spinner, VStack, Text, Button } from "@chakra-ui/react";

interface WalletGuardProps {
  children: React.ReactNode;
}

const WalletGuard = ({ children }: WalletGuardProps) => {
  const { isConnected, isSigned, isLoading } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isConnected) {
      navigate("/register-wallet");
    }
  }, [isConnected, isLoading, navigate]);

  if (isLoading) {
    return (
      <VStack p={8}>
        <Spinner />
        <Text>Cargando estado de wallet...</Text>
      </VStack>
    );
  }

  if (!isSigned) {
    return (
      <VStack p={8}>
        <Text fontSize="xl">🔐 Tu wallet está conectada pero no autenticada.</Text>
        <Text>Por favor, firma el mensaje de autenticación desde tu dashboard para continuar.</Text>
          <Button colorPalette="blue" onClick={() => navigate("/sign")}>
            Firmar
          </Button>          

      </VStack>
    );
  }

  return <>{children}</>;
};

export default WalletGuard;
