import { useWallet } from '@/features/user/hooks/useWallet';
import { useConnect } from "wagmi";
import { Button, Box, Text, Heading} from "@chakra-ui/react";
import { FaPlug } from "react-icons/fa";

import React from 'react';

interface RequireWalletProps {
  children: React.ReactNode;
}

const RequireWallet = ({ children }: RequireWalletProps) => {
  const { address } = useWallet();
  const { connectAsync, connectors } = useConnect();


  const handleConnect = async () => {
    if (connectors.length > 0) {
      try {
        await connectAsync({ connector: connectors[0] });
      } catch (err) {
        console.error("Error al conectar la wallet:", err);
      }
    }
  };


  if (!address) {
    return (
      <Box textAlign="center" py={2} spaceY={4}>
        <Heading as="h2" color="red.600">¡Conecta tu wallet!</Heading>
        <Text opacity={0.7}>Para continuar, necesitas conectar tu wallet.</Text>
          <Button colorPalette="green" onClick={handleConnect}>
           <FaPlug /> Conectar
          </Button>                  
      </Box>
    );
  }

  return <>{children}</>;
};

export default RequireWallet;
