import { useWallet } from "@/features/user/hooks/useWallet";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import {Stack, Spinner } from "@chakra-ui/react";

interface RequireRegistrationProps {
  children: React.ReactNode;
}

const RequireRegistration = ({ children }: RequireRegistrationProps) => {  
  const { isWalletRegistered, isConnected, isLoading } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {

    if(!isConnected) return;

    if (!isLoading && !isWalletRegistered) {
      navigate("/register-wallet", { state: { from: location.pathname } });
    }


  }, [isWalletRegistered, isConnected, isLoading, navigate, location.pathname]);
 
  if (!isWalletRegistered){
    return (
      <Stack align="center" py={10}>
        <Spinner size="xl" />
      </Stack>
    );
  } 
  return <>{children}</>;

};

export default RequireRegistration;
