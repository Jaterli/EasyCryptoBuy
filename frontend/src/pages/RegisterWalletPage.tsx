import { useNavigate } from "react-router-dom";
import { Box, Heading, Text, VStack, Spinner } from "@chakra-ui/react";
import UserForm from "@/components/UserForm";
import { useAccount } from "wagmi";
import { useRegisterWallet } from "@/hooks/useRegisterWallet";
import { useState } from "react";


const RegisterWalletPage = () => {
  const { address } = useAccount();
  const { registerWallet } = useRegisterWallet(address);
  const navigate = useNavigate();

  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  const handleUserRegistration = async (formData: { name: string; email: string }) => {
    const result = await registerWallet(formData);
    if (result?.success) {
      setShowSuccess(true);
      setTimeout(() => {
        navigate("/payment");
      }, 3000);
    }
  };

  return (
    <Box p={6} textAlign="center">
      {showSuccess ? (
        <VStack spaceY={4}>
          <Text fontSize="xl" color="green.500">✅ Wallet registrada con éxito</Text>
          <Text>Redirigiendo a la página de pagos...</Text>
          <Spinner size="lg" color="blue.500" />
        </VStack>
      ) : (
        <VStack spaceY={6}>
          <Heading size="lg">Registro de Wallet</Heading>
          <Text>Por favor, ingresa tu información para vincular tu wallet.</Text>
          <UserForm onSubmit={handleUserRegistration} />
        </VStack>
      )}
    </Box>
  );
};

export default RegisterWalletPage;
