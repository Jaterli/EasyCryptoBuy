import { useAccount, useBalance, useChainId, useConfig } from "wagmi";
import { Box, Text, VStack } from "@chakra-ui/react";

export function WalletInfo() {
  const { address } = useAccount();
  const chainId = useChainId();
  const config = useConfig();
  const { data: balance } = useBalance({ address });

  if (!address) return null;

  const currentChain = config.chains.find((chain) => chain.id === chainId);

  return (
    <Box p={5} bg="blue.200" borderWidth="1px" borderRadius="lg" maxW="sm" mx="auto" mt={5}>
      <VStack align="start">
        <Text fontSize="lg" fontWeight="bold" textAlign="center">
          Información de la Wallet
        </Text>
        <Text fontSize="md">
          <strong>Red:</strong> {currentChain?.name || "Desconocida"}
        </Text>
        <Text fontSize="md">
          <strong>Saldo:</strong> {balance?.formatted} {balance?.symbol}
        </Text>
      </VStack>
    </Box>
  );
}
