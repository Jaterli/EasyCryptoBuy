import { useNavigate } from "react-router-dom";
import { Box, Heading, Text, VStack, Spinner } from "@chakra-ui/react";
import { useAccount } from "wagmi";
import { useRegisterWallet } from "@/shared/hooks/useRegisterWallet";
import { useState } from "react";
import { useWallet } from "@/shared/context/useWallet";
import UserForm from "../components/UserForm";

const RegisterWalletPage = () => {
  const { address } = useAccount();
  const { registerWallet } = useRegisterWallet(address);
  const { signMessage, isSigned, isWalletRegistered, refreshWalletStatus } = useWallet();
  const navigate = useNavigate();
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  // const [isSigning, setIsSigning] = useState<boolean>(false);

  const handleUserRegistration = async (formData: { name: string; email: string }) => {
    const result = await registerWallet(formData);
    if (result?.success) {
      await refreshWalletStatus(); // actualiza el contexto tras registrar      
      setIsRegistered(true);
    }
  };

  // const handleSign = async () => {
  //   setIsSigning(true);
  //   const signature = await signMessage();
  //   setIsSigning(false);
  //   if (signature) {
  //     navigate("/payment");
  //   }
  // };


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
      // ) : !isSigned ? (
      //   <VStack spaceY={6}>
      //     <Text fontSize="xl" color="green.500">
      //       ✅ Wallet registrada con éxito
      //     </Text>
      //     <Text>Ahora necesitas firmar con tu wallet para continuar usando la plataforma.</Text>
      //     <Button onClick={handleSign} colorPalette="blue" loading={isSigning}>
      //       Firmar y continuar
      //     </Button>
      //   </VStack>
      ) : (
        <VStack spaceY={4}>
          <Text fontSize="lg">Redirigiendo a la plataforma...</Text>
          <Spinner size="lg" color="blue.500" />
        </VStack>
      )}
    </Box>
  );
};

export default RegisterWalletPage;
