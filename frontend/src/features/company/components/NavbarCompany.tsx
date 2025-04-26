import {
    Box,
    Flex,
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
    useDisclosure,
    Avatar,
    Text,
    HStack,
    Menu,
    Spacer
} from "@chakra-ui/react";
import { NavLink, useNavigate } from "react-router-dom";
import { ColorModeButton } from "@/shared/components/ui/color-mode";
import { useAdminAuth } from "@/shared/context/AdminAuthContext";

// Icono de hamburguesa SVG
const HamburgerIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
);

export function NavbarCompany() {
    const { logout, username } = useAdminAuth();
    const navigate = useNavigate();
    const isMobile = useBreakpointValue({ base: true, md: false });
    const { open, onOpen, onClose } = useDisclosure();

    const handleLogout = () => {
        logout();
        navigate("/admin-login");
    };

    const NavButton = ({ to, children }: { to: string; children: React.ReactNode }) => (
        <NavLink to={to}>
            {({ isActive }) => (
                <Button
                    variant={isActive ? "solid" : "outline"}
                    mx={isMobile ? 0 : 2}
                    width={isMobile ? "full" : "auto"}
                    onClick={isMobile ? onClose : undefined}
                >
                    {children}
                </Button>
            )}
        </NavLink>
    );

    const renderNavItems = () => (
        <>
            <NavButton to="/company/products">Productos</NavButton>
            <NavButton to="/company/sales">Ventas</NavButton>
            <ColorModeButton marginLeft={2} />
        </>
    );

    const UserMenu = () => (
        <Menu.Root>
            <Menu.Trigger asChild>
                <HStack 
                    spaceX={2} 
                    borderRadius="full" 
                    bg="bg.subtle"
                    cursor="pointer"
                    _hover={{ bg: "bg.muted" }}
                >
                    <Avatar.Root variant="solid" size="sm">
                        <Avatar.Fallback name={username ? username : "Desconocido"} />
                    </Avatar.Root>
 
                </HStack>
            </Menu.Trigger>
            <Portal>
                <Menu.Positioner>
                    <Menu.Content minWidth="200px">
                        <Menu.ItemGroup>
                            <Menu.Item value="user" disabled>
                                <VStack align="start" spaceY={0}>
                                    <Text fontWeight="medium">{username}</Text>
                                </VStack>
                            </Menu.Item>
                        </Menu.ItemGroup>
                        <Menu.Separator />
                        <Menu.Item 
                            value="logout" 
                            colorPalette="red"
                            onClick={handleLogout}
                        >
                            Cerrar sesión
                        </Menu.Item>
                    </Menu.Content>
                </Menu.Positioner>
            </Portal>
        </Menu.Root>
    );

    return (
        <Box as="nav" px={6} py={4} boxShadow="md">
            <Flex align="center">
                <Box fontSize="xl" fontWeight="bold">
                    <NavLink to="/company/products">
                        Blockchain Admin
                    </NavLink>
                </Box>
                
                <Spacer />
                
                {!isMobile ? (
                    <Flex align="center">
                        {renderNavItems()}
                        {username && (
                            <Box ml={4}>
                                <UserMenu />
                            </Box>
                        )}
                    </Flex>
                ) : (
                    <>
                        {username && (
                            <Box mr={2}>
                                <UserMenu />
                            </Box>
                        )}
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
                                    <DrawerContent bg="bg.surface" boxShadow="lg">
                                        <Drawer.Header>
                                            <Drawer.Title>Blockchain Admin</Drawer.Title>
                                            {username && (
                                                <Text fontSize="sm" mt={1} color="fg.subtle">
                                                    Bienvenido, {username}
                                                </Text>
                                            )}
                                        </Drawer.Header>

                                        <DrawerBody>
                                            <VStack
                                                separator={<StackSeparator borderColor="border.subtle" />}
                                                spaceY={4}
                                                align="stretch"
                                            >
                                                <NavButton to="/company/products">Productos</NavButton>
                                                <NavButton to="/company/sales">Ventas</NavButton>

                                                <Button w="full" colorPalette="red" onClick={handleLogout}>
                                                    Cerrar sesión
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