import { createContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { axiosUserAPI } from "@/features/user/services/userApi";
import { useWalletAuth } from "../auth/WalletAuthService";

export interface WalletContextType {
  address: string | undefined;
  isConnected: boolean;
  isAuthenticated: boolean;
  isWalletRegistered: boolean | null;
  isLoading: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  checkWalletRegistration: () => Promise<void>;
  authenticate: () => Promise<boolean>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { authenticateWallet } = useWalletAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isWalletRegistered, setIsWalletRegistered] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkWalletRegistration = useCallback(async () => {
    if (!address) return;
   
    setIsLoading(true);
    
    try {
      const response = await axiosUserAPI.checkWallet(address);
      setIsWalletRegistered(response.data.isRegistered);
    } catch (error) {
      console.error("Registration check error:", error);
      setIsWalletRegistered(false);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!address) return false;
   
    setIsLoading(true);
    
    try {
      const result = await authenticateWallet(address);
      if (result.success) {
        setIsAuthenticated(true);
        return true
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, authenticateWallet]);

  const disconnectWallet = useCallback(() => {
    disconnect();
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRefreshToken');
    console.error("Desconectando wallet y eliminando el token")
    setIsAuthenticated(false);
    setIsWalletRegistered(null);
  }, [disconnect]);

  // Efecto para manejar cambios en la wallet conectada
  useEffect(() => {
    const handleWalletChange = async () => {
      if (address) {
        await checkWalletRegistration();
        
        // Intento de autenticación automática si el token existe
        const storedToken = localStorage.getItem('userToken');
        if (storedToken) {
          try {
            console.log("Intentando recuperar el token...")
            const verifyResponse = await axiosUserAPI.verifyToken(storedToken);
            if (verifyResponse.data.valid && 
                verifyResponse.data.wallet.toLowerCase() === address.toLowerCase()) {
                  console.log("Token recuperado.")
                  setIsAuthenticated(true);
            } else {
              console.error(verifyResponse.data.error);
              setIsAuthenticated(false);
              disconnectWallet();
            }
          } catch (error) {
            console.error("Error en la autenticación:", error);
            setIsAuthenticated(false);
            disconnectWallet();
          }
        }
      } else {
        console.warn("Wallet no conectada.");
      }
    };

    handleWalletChange();
  }, [address, checkWalletRegistration, disconnectWallet]);

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        isAuthenticated,
        isWalletRegistered,
        isLoading,
        setIsAuthenticated,
        checkWalletRegistration,
        authenticate,
        disconnectWallet
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export default WalletContext;