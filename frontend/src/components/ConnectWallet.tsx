import { Button, Text, Box, Spinner, Flex } from "@chakra-ui/react";
import { useWallet } from "@/context/WalletContext";
import UserForm from "./UserForm";

export function ConnectWallet() {
  const {
    address,
    isConnected,
    isSigned,
    isWalletRegistered,
    isLoading,
    signMessage,
    disconnectWallet,
  } = useWallet();

  return (
    <Box textAlign="center" pb={5} pt={10}>
      {isConnected && address ? (
        <>
          <Text fontSize="sm" mb={4}>
            Conectado con: {address}
          </Text>

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
          ) : (
            <UserForm onSubmit={signMessage} />
          )}

          <Flex direction="row" gap={4} mt={4}>
            <Button colorScheme="red" onClick={disconnectWallet}>
              Desconectar
            </Button>
          </Flex>
        </>
      ) : (
        <Text color="red.500" textAlign="center">
          Conéctate con una wallet para continuar.
        </Text>
      )}
    </Box>
  );
}
