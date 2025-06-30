import { useNavigate } from "react-router-dom";
import { Box, Heading, Text, VStack } from "@chakra-ui/react";
import { useEffect } from "react";
import { useRegisterWallet } from "@/shared/hooks/useRegisterWallet";
import { useWallet } from "@/features/user/hooks/useWallet";
import UserForm from "../components/UserForm";

const RegisterWalletPage = () => {
  const { registerWallet } = useRegisterWallet();
  const { isWalletRegistered, checkWalletRegistration } = useWallet();
  const navigate = useNavigate();

  const handleUserRegistration = async (formData: { name: string; email: string }) => {
    const result = await registerWallet(formData);
    if (result?.success) {
      checkWalletRegistration();
    }
  };

  useEffect(() => {
    if(isWalletRegistered) {
      navigate("/dashboard");
    }
  }, [isWalletRegistered, navigate]);


  return (    
    <Box p={6} textAlign="center">
        <VStack spaceY={6}>
          <Heading size="lg">Registro de Wallet</Heading>
          <Text>Por favor, ingresa tu información para vincular tu wallet.</Text>
          <UserForm onSubmit={handleUserRegistration} />
        </VStack>
    </Box>
  );
};

export default RegisterWalletPage;
