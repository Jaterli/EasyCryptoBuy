import { createContext, useContext, useState, useCallback } from "react";
import { useWallet } from "@/shared/context/useWallet";
import { Dialog, useDisclosure, Text, Button } from "@chakra-ui/react";
import { useWalletAuth } from "../auth/WalletAuthService";

type AuthDialogContextType = {
  requireAuth: () => Promise<boolean>;
};

const AuthDialogContext = createContext<AuthDialogContextType | undefined>(undefined);

export const useAuthDialog = () => {
  const ctx = useContext(AuthDialogContext);
  if (!ctx) throw new Error("useAuthDialog must be used within AuthDialogProvider");
  return ctx;
};

export const AuthDialogProvider = ({ children }: { children: React.ReactNode }) => {
  const { open, onOpen, onClose } = useDisclosure();
  const { address } = useWallet();
  const { authenticateWallet } = useWalletAuth();
  const [authPromise, setAuthPromise] = useState<((value: boolean) => void) | null>(null);
  const [loading, setLoading] = useState(false);

  const requireAuth = useCallback(() => {
    onOpen();
    return new Promise<boolean>((resolve) => {
      setAuthPromise(() => resolve);
    });
  }, [onOpen]);

  const handleConfirm = async () => {
    if (!address || !authPromise) return;
    setLoading(true);
    const result = await authenticateWallet(address);
    setLoading(false);
    onClose();
    authPromise(result.success);
    setAuthPromise(null);
    if (result.success) {
      // window.location.reload(); // refrescar componente/página
      // setIsAuthenticated(true);
    }

};

  const handleCancel = () => {
    authPromise?.(false);
    setAuthPromise(null);
    onClose();
  };

  return (
    <AuthDialogContext.Provider value={{ requireAuth }}>
      {children}

      <Dialog.Root open={open} onOpenChange={(o) => !o.open && handleCancel()}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Autenticación Requerida</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text>Por favor, firma el mensaje con tu wallet para continuar.</Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button colorPalette="blue" onClick={handleConfirm} loading={loading}>
                Firmar y continuar
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </AuthDialogContext.Provider>
  );
};
