import {
  Box,
  Flex,
  Spacer,
  Button,
  IconButton,
  Drawer,
  CloseButton,
  VStack,
  useBreakpointValue,
  Portal,
  useDisclosure,
  HStack,
  Menu,
  Text,
} from "@chakra-ui/react";
import { useWallet } from "@/shared/context/useWallet";
import { useConnect } from "wagmi";
import { ColorModeButton } from "@/shared/components/ui/color-mode";
import { NavLink } from "react-router-dom";
import { FaShoppingCart, FaPlug, FaPowerOff, FaWallet, FaBars } from "react-icons/fa";
import { useCart } from "../context/CartContext";
import WalletAddress from "@/shared/components/TruncatedAddress";

export function Navbar() {
  const { address, isConnected, disconnectWallet } = useWallet();
  const { connectAsync, connectors } = useConnect();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { open, onOpen, onClose } = useDisclosure();
  const { cart } = useCart();

  const handleConnect = async () => {
    if (connectors.length > 0) {
      try {
        await connectAsync({ connector: connectors[0] });
      } catch (error) {
        console.error("Error al conectar la wallet:", error);
      }
    }
  };

  const NavButton = ({ to, children }: { to: string; children: React.ReactNode }) => (
    <NavLink to={to}>
      {({ isActive }) => (
        <Button
          variant={isActive ? "solid" : "ghost"}
          width="full"
          justifyContent="flex-start"
          size="lg"
          onClick={isMobile ? onClose : undefined}
        >
          {children}
        </Button>
      )}
    </NavLink>
  );

  const CartIcon = () => (
    <HStack gap={2}>
      <FaShoppingCart />
      <Text>({cart.length})</Text>
    </HStack>
  );

  const WalletStatus = () => (
    <Menu.Root>
      <Menu.Trigger asChild>
        <IconButton
          aria-label={isConnected ? "Wallet conectada" : "Conectar wallet"}
          variant="ghost"
          rounded="full"
          size="md"
        >
          {isConnected ? <FaWallet /> : <FaPlug />}
        </IconButton>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content minWidth="200px">
            {isConnected && address && (
              <>
                <Menu.ItemGroup>
                  <Menu.Item value="address" disabled>
                    <VStack align="flex-start" gap={1}>
                      <Text fontSize="xs" opacity={0.7}>Tu dirección:</Text>
                      <WalletAddress address={address} />
                    </VStack>
                  </Menu.Item>
                </Menu.ItemGroup>
                <Menu.Separator />
                <Menu.Item 
                  value="disconnect"
                  colorPalette="red"
                  onClick={disconnectWallet}
                >
                  <HStack gap={3}>
                    <FaPowerOff />
                    <Text>Desconectar</Text>
                  </HStack>
                </Menu.Item>
              </>
            )}
            {!isConnected && (
              <Menu.Item 
                value="connect"
                colorPalette="green"
                onClick={handleConnect}
              >
                <HStack gap={3}>
                  <FaPlug />
                  <Text>Conectar Wallet</Text>
                </HStack>
              </Menu.Item>
            )}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );

  const renderMobileMenu = () => (
    <>
      <WalletStatus />
      <IconButton
        aria-label="Menú principal"
        variant="ghost"
        size="md"
        onClick={onOpen}
      ><FaBars />
      </IconButton>
      
      <Drawer.Root placement="top" open={open} onInteractOutside={onClose}>
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content bg={{ _dark: "blue.900", base: "blue.100" }}>
              <Drawer.Header fontSize={"lg"}>
                  <Drawer.Title>EasyCryptoBuy</Drawer.Title>
              </Drawer.Header>
              <Drawer.CloseTrigger onClick={onClose} asChild>
                <CloseButton size="sm" />
              </Drawer.CloseTrigger>                      

              <Drawer.Body py={4}>
                <VStack gap={2} align="stretch">

                  {isConnected && address && (
                    <>
                    <HStack gap={2}>
                        <FaWallet />
                        <WalletAddress address={address} />
                    </HStack>
                    </>
                  )}

                  <NavButton to="/products">Productos</NavButton>
                  
                  {isConnected && (
                    <>
                      <NavButton to="/payments-history">Historial de Compras</NavButton>
                      <NavButton to="/cart-sumary">
                        <CartIcon /> Carrito
                      </NavButton>
                    </>
                  )}

                  <Button
                    width="full"
                    justifyContent="flex-start"
                    colorPalette={isConnected ? "red" : "green"}
                    size="lg"
                    onClick={isConnected ? disconnectWallet : handleConnect}
                  >
                    {isConnected ? <FaPowerOff /> : <FaPlug />}                    
                    {isConnected ? "Desconectar Wallet" : "Conectar Wallet"}
                  </Button>
                  
                  <Flex justify="center" mt={4}>
                    <ColorModeButton size="md" />
                  </Flex>
                </VStack>
              </Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    </>
  );

  const renderDesktopMenu = () => (
    <HStack gap={4}>
      <NavButton to="/products">Productos</NavButton>
      {isConnected && (
        <>
          <NavButton to="/payments-history">Historial de Compras</NavButton>
          <NavLink to="/cart-sumary">
            <Box px={2} py={1} _hover={{ bg: "transparent" }}>
              <CartIcon />
            </Box>
          </NavLink>
        </>
      )}
      <WalletStatus />
      <ColorModeButton size="md" />
    </HStack>
  );

  return (
    <Box 
      as="nav" 
      px={{ base: 4, md: 6 }}
      py={4}
      boxShadow="sm"
      position="sticky"
      top={0}
      zIndex="sticky"
      bg="bg.surface"
    >
      <Flex align="center">
        <Box fontSize="xl" fontWeight="bold">
          <NavLink to="/dashboard">
            EasyCryptoBuy
          </NavLink>
        </Box>
        <Spacer />
        {isMobile ? renderMobileMenu() : renderDesktopMenu()}
      </Flex>
    </Box>
  );
}