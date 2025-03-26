import { useAccount, useConnect, useDisconnect, useSignMessage, Connector } from "wagmi";
import { useState, useEffect, useCallback } from "react"; // Importar useCallback
import { VStack, Button, Text, Box, Spinner, Flex } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import UserForm from "./UserForm";

// Componente para mostrar el estado de la conexión
function WalletConnectionStatus({ address }: { address: string }) {
  return (
    <Text fontSize="sm" mb={4}>
      Conectado con: {address}
    </Text>
  );
}

// Componente para manejar las acciones (firmar mensaje y desconectar)
function WalletActions({
  isSigned,
  isWalletRegistered,
  isLoading,
  onDisconnect,
  onShowForm,
}: {
  isSigned: boolean;
  isWalletRegistered: boolean;
  isLoading: boolean;
  onDisconnect: () => void;
  onShowForm: () => void;
}) {
  return (
    <Flex direction="column" align="center" gap={4}>
      {isLoading ? (
        <Spinner size="lg" color="blue.500" />
      ) : isWalletRegistered ? (
        <Text color="green.500" mb={4}>
          Wallet firmada y registrada.
        </Text>
      ) : isSigned ? (
        <Text color="green.500" mb={4}>
          Mensaje firmado correctamente.
        </Text>
      ) : null}

      <Flex direction="row" gap={4}>
        {!isSigned && !isWalletRegistered && (
          <Button colorScheme="blue" onClick={onShowForm} disabled={isSigned}>
            Firmar Mensaje
          </Button>
        )}
        <Button colorScheme="red" onClick={onDisconnect}>
          Desconectar
        </Button>
      </Flex>
    </Flex>
  );
}

// Componente para conectar con diferentes wallets
function WalletConnector({
  connectors,
  isMetaMaskInstalled,
  isPending,
  onConnect,
}: {
  connectors: readonly Connector[];
  isMetaMaskInstalled: boolean;
  isPending: boolean;
  onConnect: (connector: Connector) => void;
}) {
  return (
    <VStack spaceY={4} align="center" p={5}>
      {connectors.map((connector) => (
        <Button
          key={connector.id}
          colorScheme="blue"
          onClick={() => onConnect(connector)}
          disabled={!isMetaMaskInstalled || isPending}
          w="full"
          maxW="300px"
        >
          Conectar con {connector.name}
        </Button>
      ))}

      {!isMetaMaskInstalled && (
        <Text color="red.500" textAlign="center">
          MetaMask no está instalado. Por favor, instálalo para continuar.
        </Text>
      )}
    </VStack>
  );
}

// Componente principal
export function ConnectWallet() {
  const { connectAsync, connectors, error, isPending } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [isSigned, setIsSigned] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [userData, setUserData] = useState<{ name: string; email: string } | null>(null);
  const [isWalletRegistered, setIsWalletRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isMetaMaskInstalled = typeof window !== "undefined" && !!window.ethereum?.isMetaMask;

  // Verificar si la wallet está registrada
  useEffect(() => {
    const checkWalletRegistration = async () => {
      if (address) {
        setIsLoading(true);
        try {
          const response = await fetch(`http://localhost:8000/users/api/check-wallet?wallet_address=${address}`);
          const data = await response.json();
          setIsWalletRegistered(data.isRegistered);
        } catch (error) {
          console.error("Error al verificar el registro de la wallet:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkWalletRegistration();
  }, [address]);

  // Memoizar handleSignMessage con useCallback
  const handleSignMessage = useCallback(async () => {
    if (!address || !userData) return;

    setIsLoading(true);
    try {
      const message = "Por favor, firma este mensaje para autenticarte.";
      const signature = await signMessageAsync({ message });

      const verifyResponse = await fetch("http://localhost:8000/payments/api/verify-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, message, signature }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.message || "Error al verificar la firma.");
      }

      localStorage.setItem(`signature_${address}`, signature);
      setIsSigned(true);

      const associateResponse = await fetch("http://localhost:8000/users/api/associate-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet_address: address, ...userData }),
      });

      const responseData = await associateResponse.json();

      if (associateResponse.ok && responseData.success) {
        toaster.create({
          title: "Éxito",
          description: responseData.message,
          type: "success",
          duration: 3000,
        });
        setIsWalletRegistered(true);
      } else {
        throw new Error(responseData.message || "Error desconocido.");
      }
    } catch (error) {
      toaster.create({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error inesperado.",
        type: "error",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [address, userData, signMessageAsync]); // Dependencias de useCallback

  // Manejar la firma del mensaje cuando userData cambie
  useEffect(() => {
    if (userData) {
      handleSignMessage();
    }
  }, [userData, handleSignMessage]); // Incluir handleSignMessage en las dependencias

  // Manejar la desconexión
  const handleDisconnect = () => {
    if (address) {
      localStorage.removeItem(`signature_${address}`);
    }
    setIsSigned(false);
    setIsWalletRegistered(false);
    disconnect();
  };

  // Manejar el envío del formulario
  const handleFormSubmit = (data: { name: string; email: string }) => {
    setUserData(data); // Actualizar userData
    setShowForm(false); // Ocultar el formulario
  };

  // Manejar la conexión con una wallet
  const handleConnect = async (connector: Connector) => {
    try {
      await connectAsync({ connector });
      toaster.create({
        title: "Conectado",
        description: `Conectado con ${connector.name}`,
        type: "success",
        duration: 3000,
      });
    } catch (error) {
      toaster.create({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo conectar con la wallet.",
        type: "error",
        duration: 5000,
      });
    }
  };

  // Función para manejar la cancelación del formulario
  const handleCancelForm = () => {
    setShowForm(false); // Ocultar el formulario
  };

  return (
    <Box textAlign="center" pb={5} pt={10}>
      {isConnected && address ? (
        <>
          <WalletConnectionStatus address={address} />
          {showForm ? (
            <UserForm onSubmit={handleFormSubmit} onCancel={handleCancelForm} /> // Pasar onCancel
          ) : (
            <WalletActions
              isSigned={isSigned}
              isWalletRegistered={isWalletRegistered}
              isLoading={isLoading}
              onDisconnect={handleDisconnect}
              onShowForm={() => setShowForm(true)}
            />
          )}
        </>
      ) : (
        <WalletConnector
          connectors={connectors}
          isMetaMaskInstalled={isMetaMaskInstalled}
          isPending={isPending}
          onConnect={handleConnect}
        />
      )}

      {error && (
        <Text color="red.500" textAlign="center" mt={4}>
          Error: {error.message}
        </Text>
      )}
    </Box>
  );
}