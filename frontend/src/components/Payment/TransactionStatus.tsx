import { Text } from "@chakra-ui/react";

interface TransactionStatusProps {
  hash: string | null;
  isConfirmed: boolean;
}

export function TransactionStatus({ hash, isConfirmed }: TransactionStatusProps) {
  if (!hash) return null;

  return (
    <Text color={isConfirmed ? "green.500" : "orange.500"} mt={4}>
      {isConfirmed ? `Pago confirmado. Hash: ${hash}` : "Esperando confirmación..."}
    </Text>
  );
}
