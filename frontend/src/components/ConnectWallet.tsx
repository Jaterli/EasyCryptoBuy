import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useState } from "react";
import { VStack, Button, Text, Box } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";

export function ConnectWallet() {
  const { connect, connectors, error, isPending } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [loadingConnector, setLoadingConnector] = useState<string | null>(null);

  const isMetaMaskInstalled = typeof window !== "undefined" && !!window.ethereum?.isMetaMask;

  if (isConnected) {
    return (
      <Box textAlign="center" pb={5} pt={10}>
        <Text color="white" fontSize="lg" mb={4}>
          Conectado con: <strong>{address}</strong>
        </Text>
        <Button colorScheme="red" onClick={() => disconnect()}>
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
