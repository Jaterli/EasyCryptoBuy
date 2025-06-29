import { useWallet } from "@/features/user/hooks/useWallet";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

interface RequireRegistrationProps {
  children: React.ReactNode;
}

const RequireRegistration = ({ children }: RequireRegistrationProps) => {  
  const { isWalletRegistered, isLoading } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isWalletRegistered) {
      navigate("/register-wallet", { state: { from: location.pathname } });
    }
  }, [isWalletRegistered, isLoading]);

  if (!isLoading && !isWalletRegistered){
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h2 style={{ color: '#e74c3c' }}>Registro requerido!</h2>
        <p>Para continuar, necesitas registrarte.</p>
      </div>
    );
  } 
  return <>{children}</>;
};

export default RequireRegistration;
