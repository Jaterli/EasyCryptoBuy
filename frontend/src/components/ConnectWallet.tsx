import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";
import { useState, useEffect } from "react";
import { VStack, Button, Text, Box } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";

export function ConnectWallet() {
  const { connect, connectors, error, isPending } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [loadingConnector, setLoadingConnector] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

  const isMetaMaskInstalled = typeof window !== "undefined" && !!window.ethereum?.isMetaMask;

  // Verificar si hay una firma almacenada al cargar el componente
  useEffect(() => {
    if (address) {
      const storedSignature = localStorage.getItem(`signature_${address}`);
      setIsSigned(!!storedSignature);
    } else {
      setIsSigned(false); // Resetear si no hay dirección
    }
  }, [address]);

  const handleSignMessage = async () => {
    if (!address) return;

    setIsSigning(true);
    try {
      // Mensaje que el usuario firmará
      const message = "Por favor, firma este mensaje para autenticarte.";

      // Firmar el mensaje
      const signature = await signMessageAsync({ message });

      // Enviar la firma al backend para verificación
      const response = await fetch("http://localhost:8000/payments/api/verify-signature", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address, message, signature }),
      });

      if (response.ok) {
        // Almacenar la firma en localStorage
        localStorage.setItem(`signature_${address}`, signature);
        setIsSigned(true);

        toaster.create({
          title: "Autenticación exitosa",
          description: "Tu firma ha sido verificada.",
          type: "success",
          duration: 3000,
        });
      } else {
        throw new Error("Error al verificar la firma");
      }
    } catch (error) {
      toaster.create({
        title: "Error al firmar",
        description: error instanceof Error ? error.message : "Ocurrió un error",
        type: "error",
        duration: 5000,
      });
    } finally {
      setIsSigning(false);
    }
  };

  const handleDisconnect = () => {
    // Eliminar la firma de localStorage al desconectar
    if (address) {
      localStorage.removeItem(`signature_${address}`);
    }
    setIsSigned(false); // Resetear el estado de la firma
    disconnect(); // Desconectar la wallet
  };

  if (isConnected) {
    return (
      <Box textAlign="center" pb={5} pt={10}>
        <Text color="white" fontSize="lg" mb={4}>
          Conectado con: <strong>{address}</strong>
        </Text>
        <Button
          colorScheme="blue"
          onClick={handleSignMessage}
          loading={isSigning}
          loadingText="Firmando..."
          disabled={isSigned} // Deshabilitar el botón si ya se firmó
        >
          {isSigned ? "Mensaje Firmado" : "Firmar Mensaje"}
        </Button>
        <Button colorScheme="red" onClick={handleDisconnect} ml={2}>
          Desconectar
        </Button>
      </Box>
    );
  }

  return (
    <VStack spaceY={4} align="center" p={5}>
      {connectors.map((connector) => (
        <Button
          key={connector.id}
          colorScheme="blue"
          loading={loadingConnector === connector.id || isPending}
          loadingText="Conectando..."
          onClick={async () => {
            setLoadingConnector(connector.id);
            try {
              await connect({ connector });
              toaster.create({
                title: "Conexión exitosa",
                description: `Conectado con ${connector.name}`,
                type: "success",
                duration: 3000,
              });
            } catch (error) {
              toaster.create({
                title: "Error al conectar",
                description: error instanceof Error ? error.message : "Ocurrió un error",
                type: "error",
                duration: 5000,
              });
            } finally {
              setLoadingConnector(null);
            }
          }}
          disabled={!isMetaMaskInstalled}
        >
          Conectar con {connector.name}
        </Button>
      ))}

      {!isMetaMaskInstalled && (
        <Text color="red.500" textAlign="center">
          MetaMask no está instalado. Por favor, instálalo para continuar.
        </Text>
      )}

      {error && (
        <Text color="red.500" textAlign="center">
          Error: {error.message}
        </Text>
      )}
    </VStack>
  );
}