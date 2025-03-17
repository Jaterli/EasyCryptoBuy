import { Box, Container, Heading, VStack, Separator } from "@chakra-ui/react";
import { ConnectWallet } from "./components/ConnectWallet";
import { WalletInfo } from "./components/WalletInfo";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <>
      <Box minH="100vh" bgGradient="to-r" gradientFrom="gray.800" gradientTo="gray.700" py={10} px={4}>
        <Container maxW="container.md">

          <VStack textAlign="center" pb={10}>
            <Heading as="h1" size="5xl" color="blue.500">
              Blockchain Payments
            </Heading>
            <Heading as="h2" size="lg" color="gray.100">
              Plataforma de pagos en criptomonedas
            </Heading>
          </VStack>

          <Separator variant="solid" color={"gray.600"} />

          <Box>
            <VStack spaceY={5}>
              <ConnectWallet />
              <Toaster />
              <WalletInfo />
            </VStack>
          </Box>

        </Container>
      </Box>
    </>
  );
}

export default App;
