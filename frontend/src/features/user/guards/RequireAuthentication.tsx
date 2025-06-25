import { useCallback, useEffect, useState } from "react";
import { Box, Button, Center, Text, Spinner, Stack } from "@chakra-ui/react";
import { useAuthDialog } from "../context/AuthDialogContext";
import { useWallet } from "../hooks/useWallet";
import { useWalletAuth } from "../auth/WalletAuthService";

interface RequireAuthProps {
  children: React.ReactNode;
}

export const RequireAuthentication = ({ children }: RequireAuthProps) => {
  const { address, isConnected, isAuthenticated, isWalletRegistered, setIsAuthenticated } = useWallet();
  const { requireAuth } = useAuthDialog();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);
  const { authenticateWallet } = useWalletAuth();

  const handleSign = async () => {
    setChecking(true);
    if (address){
      const result = await authenticateWallet(address);
      if(result.success){
        setIsAuthenticated(true);
        setAllowed(true);
      }
    }
    setChecking(false);
  };

  const attemptAuth = useCallback(async () => {
    setChecking(true);
    const success = await requireAuth();
    setAllowed(success);
    setChecking(false);
  },[requireAuth]);

  useEffect(() => {
    const verify = async () => {

      if (!isConnected || isWalletRegistered === null) {
        setChecking(false);
        return;
      }
      if (isAuthenticated) {
        setAllowed(true);
        setChecking(false);
        return;
      }
      await attemptAuth();
    };

    verify();
  }, [isConnected, isAuthenticated, isWalletRegistered, requireAuth, attemptAuth]);

  if (checking) {
    return (
      <Stack align="center" py={10}>
        <Spinner size="xl" />
      </Stack>
    )
  }

  if (!allowed) {
    return (
      <Center minH="60vh">
        <Box textAlign="center">
          <Text fontSize="lg" opacity={0.7} mb={4}>
            Necesitas firmar con tu wallet para acceder a esta sección.
          </Text>
          <Button colorPalette="blue" onClick={handleSign}>
            Firmar y continuar
          </Button>
        </Box>
      </Center>
    );
  }

  return <>{children}</>;
};
