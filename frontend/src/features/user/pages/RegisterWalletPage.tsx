import { useNavigate } from "react-router-dom";
import { Box, Heading, Text, VStack, Spinner } from "@chakra-ui/react";
import { useRegisterWallet } from "@/shared/hooks/useRegisterWallet";
import { useState } from "react";
import { useWallet } from "@/features/user/hooks/useWallet";
import UserForm from "../components/UserForm";

const RegisterWalletPage = () => {
  const { registerWallet } = useRegisterWallet();
  const { isWalletRegistered } = useWallet();
  const navigate = useNavigate();
  const [isRegistered, setIsRegistered] = useState<boolean>(false);

  const handleUserRegistration = async (formData: { name: string; email: string }) => {
    const result = await registerWallet(formData);
    if (result?.success) {
      //await refreshWalletStatus(); // actualiza el contexto tras registrar      
      setIsRegistered(true);
      console.log("Usuario registrado.")
    }
  };

  if (isWalletRegistered) {
        navigate("/dashboard");
  }

  return (    
    <Box p={6} textAlign="center">
      {!isRegistered ? (
        <VStack spaceY={6}>
          <Heading size="lg">Registro de Wallet</Heading>
          <Text>Por favor, ingresa tu información para vincular tu wallet.</Text>
          <UserForm onSubmit={handleUserRegistration} />
        </VStack>
        ) : (
          <VStack spaceY={4}>
            <Text fontSize="lg">Redirigiendo a la plataforma...</Text>
            <Spinner size="lg" color="blue.500" />
          </VStack>
        )
      }
    </Box>
  );
};

export default RegisterWalletPage;
