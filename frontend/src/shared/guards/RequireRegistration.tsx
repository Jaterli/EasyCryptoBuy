import { useWallet } from "@/shared/context/useWallet";
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
    if (!isLoading && isWalletRegistered === false) {
      navigate("/register-wallet", { state: { from: location.pathname } });
    }
  }, [isWalletRegistered, isLoading]);

  if (!isWalletRegistered) return null;
  return <>{children}</>;
};

export default RequireRegistration;
