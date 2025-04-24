import { useWallet } from "@/shared/context/useWallet";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Box, VStack, Text, Button, Flex } from "@chakra-ui/react";
import WalletAddress from "@/shared/components/TruncatedAddress";

const SignWalletPage = () => {
    const { isSigned, isConnected, signMessage, isLoading } = useWallet();
    const [signing, setSigning] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { address } = useWallet(); // Obtén la dirección de la wallet desde el contexto
    // Obtiene la ruta anterior desde la que se pidió firmar
    const redirectTo = location.state?.from || "/payment";

    useEffect(() => {
        if (isSigned && isConnected) {
        navigate(redirectTo);
        }
    }, [isSigned, isConnected, navigate, redirectTo]);

    const handleSign = async () => {
        setSigning(true);
        await signMessage(); // mensaje viene del contexto
        setSigning(false);
    };

    if (!isConnected) {
        return (
        <Box textAlign="center" p={10}>
            <Text color="red.500" fontWeight="bold">Wallet no conectada.</Text>
            <Text>Por favor, conecta tu wallet antes de proceder.</Text>
        </Box>
        );
    }

    return (
        <Box p={8} textAlign="center">
        <VStack spaceY={6}>
            <Text fontSize="2xl" fontWeight="bold">🔐 Firma requerida</Text>
            <Text>Para continuar, debes firmar con tu wallet como verificación de identidad.</Text>
            <Button onClick={handleSign} colorPalette="blue" loading={signing || isLoading}>
            Firmar con Wallet
            </Button>

            <Flex 
                direction={{ base: "column", md: "row" }} 
                alignItems={{ base: "flex-start", md: "center" }}
                fontSize="sm" 
                mb={4}
                gap={2}
            >
                Wallet: {address ? <WalletAddress address={address} /> : "Dirección no disponible"}
            </Flex>

        </VStack>
        </Box>
    );
};

export default SignWalletPage;
