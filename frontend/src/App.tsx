import { Box, Container, Heading, VStack, Separator } from "@chakra-ui/react";
import { ConnectWallet } from "./components/ConnectWallet";
import { WalletInfo } from "./components/WalletInfo";
import { Toaster } from "@/components/ui/toaster";
import { ColorModeButton, useColorMode } from "@/components/ui/color-mode";
import { Payment } from "./components/Payment";
import { ContractBalance } from "./components/ContractBalance";


function App() {

  const { colorMode } = useColorMode();
  
  return (
    <Box minH="100vh" py={10} px={4}>
      <Container maxW="container.md">
        {/* Botón de cambio de modo */}
        <ColorModeButton _hover={{bg: 'transparent'}} color={colorMode === 'light' ? 'black' : 'white'}/>
        {/* Título y subtítulo */}
        <VStack textAlign="center" pb={10} spaceY={4}>
          <Heading as="h1" size="2xl" fontWeight="bold">
            Blockchain Payments
          </Heading>
          <Heading as="h2" size="md" fontWeight="normal">
            Plataforma de pagos en criptomonedas
          </Heading>
        </VStack>

        {/* Separador */}
        <Separator className="separator" mb={10} />

        {/* Contenido principal */}
        <Box>
          <VStack spaceY={6}>
            <ConnectWallet />
            <Payment />            
            <ContractBalance />
            <Toaster />
            <WalletInfo />
          </VStack>
        </Box>
      </Container>
    </Box>
  );
}

export default App;