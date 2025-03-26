import { useEffect, useState } from 'react';
import { getBalance } from '@wagmi/core';
import { config } from '../config/wagmi';
import { Text } from '@chakra-ui/react';

export function ContractBalance() {
  const [balance, setBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const result = await getBalance(config, {
          address: '0xd9145CCE52D386f254917e481eB44e9943F39138',
        });
        setBalance(result.formatted); // Usamos `formatted` para obtener el balance en formato legible
      } catch (err) {
        setError('Error fetching balance');
        console.error(err);
      }
    };

    fetchBalance();
  }, []);

  if (error) {
    return <Text color="red.500">{error}</Text>;
  }

  return (
    <Text color="green.500" mt={4}>
      {balance ? `Balance: ${balance}` : 'Loading...'}
    </Text>
  );
}