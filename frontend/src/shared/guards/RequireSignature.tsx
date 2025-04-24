import { useWallet } from "@/shared/context/useWallet";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

interface RequireSignatureProps {
  children: React.ReactNode;
}

const RequireSignature = ({ children }: RequireSignatureProps) => {
  const { isSigned, isLoading, isConnected } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && isConnected && !isSigned) {
      navigate("/sign-wallet", { state: { from: location.pathname } });
    }
  }, [isSigned, isLoading, isConnected]);

  if (!isSigned) return null; // evitar render prematuro
  return <>{children}</>;
};

export default RequireSignature;
