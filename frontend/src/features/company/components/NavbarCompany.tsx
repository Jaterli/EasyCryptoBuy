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
import { useCompanyAuth } from "@/shared/context/CompanyAuthContext";
import { FaBars } from "react-icons/fa";

export function NavbarCompany() {
    const { logout, username } = useCompanyAuth();
    const navigate = useNavigate();
    const isMobile = useBreakpointValue({ base: true, md: false });
    const { open, onOpen, onClose } = useDisclosure();

    const handleLogout = () => {
        logout();
        navigate("/company-login");
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
            {username && (
                <>
                    <NavButton to="/company/products">Productos</NavButton>
                    <NavButton to="/company/sales">Ventas</NavButton>
                </>
            )}
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
        <Box 
            as="nav" 
            px={6} 
            py={4} 
            boxShadow="md"
        >
            <Flex align="center">
                <Box fontSize="xl" fontWeight="bold">
                    <NavLink to={username ? "/company/" : "/"}>
                        EasyCryptoBuy Admin
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
                                aria-label="Menú principal"
                                variant="ghost"
                                size="md"
                                onClick={onOpen}
                            ><FaBars />
                            </IconButton>
                            </Drawer.Trigger>
                            <Portal>
                                <Drawer.Backdrop />
                                <Drawer.Positioner>
                                    <DrawerContent bg={{ _dark: "blue.900", base: "blue.100" }}>
                                        <Drawer.Header>
                                        <Drawer.Title fontSize={"xs"}>EasyCryptoBuy Admin</Drawer.Title>
                                        </Drawer.Header>

                                        <DrawerBody>
                                            <VStack
                                                separator={<StackSeparator borderColor="gray.200" />}
                                                spaceY={4}
                                                align="stretch"
                                            >
                                                {username && (
                                                    <>
                                                        <NavButton to="/company/products">Productos</NavButton>
                                                        <NavButton to="/company/sales">Ventas</NavButton>
                                                        <Button 
                                                            w="full" 
                                                            colorPalette="red" 
                                                            onClick={handleLogout}
                                                        >
                                                            Cerrar sesión
                                                        </Button>
                                                    </>
                                                )}
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