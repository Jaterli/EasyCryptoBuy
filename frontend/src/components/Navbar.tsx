import {
  Box,
  Flex,
  Spacer,
  Button,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerContent,
  StackSeparator, 
  CloseButton,
  VStack,
  useBreakpointValue,
  Portal,
  useDisclosure
} from "@chakra-ui/react";

import { useWallet } from "@/context/useWallet";
import { useConnect } from "wagmi";
import { ColorModeButton } from "@/components/ui/color-mode";
import { NavLink } from "react-router-dom";

// Icono de hamburguesa SVG
const HamburgerIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

export function Navbar() {
  const { isConnected, disconnectWallet } = useWallet();
  const { connectAsync, connectors } = useConnect();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { open, onOpen, onClose } = useDisclosure();
  
  // Función para conectar con la primera wallet disponible
  const handleConnect = async () => {
    if (connectors.length > 0) {
      try {
        await connectAsync({ connector: connectors[0] });
      } catch (error) {
        console.error("Error al conectar la wallet:", error);
      }
    }
  };

  // Componente de enlace con estilo de botón que cierra el drawer
  const NavButton = ({ to, children }: { to: string; children: React.ReactNode }) => (
    <NavLink to={to}>
      {({ isActive }) => (
        <Button
          variant={isActive ? "solid" : "outline"}
          mx={isMobile ? 0 : 2}
          width={isMobile ? "full" : "auto"}          
          onClick={isMobile ? () => onClose() : undefined} // Cierra el drawer en móvil
        >
          {children}
        </Button>
      )}
    </NavLink>
  );

  // Renderizar el menú de navegación
  const renderNavItems = () => (
    <>
      {isConnected && (
        <>
          <NavButton to="/payments-history">Historial de Pagos</NavButton>
          <NavButton to="/payment">Realizar Pago</NavButton>
        </>
      )}
      <Button 
        colorPalette={isConnected ? "red" : "green"} 
        onClick={isConnected ? disconnectWallet : handleConnect}
        mx={2}
      >
        {isConnected ? "Desconectar" : "Conectar Wallet"}
      </Button>
      <ColorModeButton marginLeft={2} />
    </>
  );

  return (
    <Box 
      as="nav" 
      px={6} 
      py={4} 
      boxShadow="md"
    >
      <Flex align="center">
        <Box fontSize="xl" fontWeight="500">
          <NavLink to="/">
            Blockchain Payments
          </NavLink>
        </Box>
        <Spacer />

        {!isMobile ? (
          renderNavItems()
        ) : (
          <>           
            <Drawer.Root placement="top" open={open} onInteractOutside={onClose}>
              <Drawer.Trigger asChild>
                <IconButton 
                  aria-label="Abrir menú" 
                  variant="outline"
                  onClick={onOpen}
                >
                  <HamburgerIcon />
                </IconButton>
              </Drawer.Trigger>
              <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                <DrawerContent bg={{ _dark: "blue.900", base: "blue.100" }}>           
                  <Drawer.Header>
                    <Drawer.Title>Blockchain Payments</Drawer.Title>
                  </Drawer.Header>       
                             
                    <DrawerBody>                       
                    <VStack
                      separator={<StackSeparator borderColor="gray.200" />}
                      spaceY={4}
                      align="stretch"
                    >
                      {isConnected && (
                        <>
                          <NavButton to="/payments-history">Historial de Pagos</NavButton>
                          <NavButton to="/payment">Realizar Pago</NavButton>                          
                        </>
                      )}

                      <Button w="full" className="wallet_status" colorPalette={isConnected ? "red" : "green"} onClick={isConnected ? disconnectWallet : handleConnect}>
                        {isConnected ? "Desconectar" : "Conectar Wallet"}
                      </Button>

                      <Flex justify="center">
                        <ColorModeButton />
                      </Flex>
                    </VStack>
                  </DrawerBody>
                  <Drawer.CloseTrigger onClick={onClose} asChild>
                      <CloseButton size="sm" />
                  </Drawer.CloseTrigger>                      
                </DrawerContent>
                </Drawer.Positioner> 
              </Portal>
            </Drawer.Root>
          </>
        )}
      </Flex>
    </Box>
  );
}