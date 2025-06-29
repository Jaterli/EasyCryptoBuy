import { useCallback, useEffect, useState } from "react";
import { Box, Button, Center, Text, Spinner, Stack } from "@chakra-ui/react";
import { useAuthDialog } from "../context/AuthDialogContext";
import { useWallet } from "../hooks/useWallet";

interface RequireAuthProps {
  children: React.ReactNode;
}

export const RequireAuthentication = ({ children }: RequireAuthProps) => {
  const { 
    address, 
    isConnected, 
    isAuthenticated, 
    isWalletRegistered,
    isLoading,
    authenticate 
  } = useWallet();
  
  const { requireAuth } = useAuthDialog();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  const handleSign = async () => {
    setChecking(true);
    try {
      if (address) {
        const result = await authenticate();
        setAllowed(result);
      }
    } catch (error) {
      console.error("Error during authentication:", error);
    } finally {
      setChecking(false);
    }
  };

  const attemptAuth = useCallback(async () => {
    try {
      const success = await requireAuth();
      setAllowed(success);
    } catch (error) {
      console.error("Authentication attempt failed:", error);
      setAllowed(false);
    }
  }, [requireAuth]);

  useEffect(() => {
    // No hacer nada mientras se está cargando el estado inicial
    console.log("isConnected: ",isConnected);
    console.log("isAuthenticated: ",isAuthenticated);
    console.log("isWalletRegistered: ",isWalletRegistered);
    console.log("isLoading: ",isLoading);
    if (isLoading) return;

    // Si ya está autenticado, permitir acceso
    if (isAuthenticated) {
      setAllowed(true);
      setChecking(false);
      return;
    }

    // Si no está conectado o no está registrado, mostrar UI de autenticación
    if (!isConnected || isWalletRegistered === false) {
      setAllowed(false);
      setChecking(false);
      return;
    }

    // Si está conectado y registrado pero no autenticado, intentar autenticar
    if (isConnected && isWalletRegistered && !isAuthenticated) {
      setChecking(true);
      attemptAuth().finally(() => setChecking(false));
    }
  }, [isConnected, isAuthenticated, isWalletRegistered, isLoading, attemptAuth]);

  // Estado de carga global (incluyendo la verificación inicial del provider)
  if (isLoading || checking) {
    return (
      <Stack align="center" py={10}>
        <Spinner size="xl" />
        <Text>Cargando estado de autenticación...</Text>
      </Stack>
    );
  }

  if (!allowed) {
    return (
      <Center minH="60vh">
        <Box textAlign="center">
          <Text fontSize="lg" opacity={0.7} mb={4}>
            Necesitas firmar con tu wallet para acceder a esta sección.
          </Text>
          <Button 
            colorScheme="blue" 
            onClick={handleSign}
            loading={checking}
          >
            Firmar y continuar
          </Button>
        </Box>
      </Center>
    );
  }

  return <>{children}</>;
};