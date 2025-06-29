import { createContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { axiosUserAPI } from "@/features/user/services/userApi";
import { useWalletAuth } from "../auth/WalletAuthService";

export interface WalletContextType {
  address: string | undefined;
  isConnected: boolean;
  isAuthenticated: boolean;
  isWalletRegistered: boolean;
  isLoading: boolean;
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
  const [isWalletRegistered, setIsWalletRegistered] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkWalletRegistration = useCallback(async () => {
    if (!address) return;
   
    setIsLoading(true);
    
    try {
      const response = await axiosUserAPI.checkWallet(address);
      setIsWalletRegistered(response.data.isRegistered);
    } catch (error) {
      console.error("Registration check error:", error);
      setIsWalletRegistered(false);
    } 
    
  }, [address]);

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!address) return false;
   
    setIsLoading(true);
    
    try {
      const result = await authenticateWallet(address);
      setIsAuthenticated(result.success);
      return result.success;
    } catch (error) {
      console.error("Authentication error:", error);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [address, authenticateWallet]);

  const disconnectWallet = useCallback(() => {
    disconnect();
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRefreshToken');
    setIsAuthenticated(false);
    setIsWalletRegistered(false);
  }, [disconnect]);

  // Efecto para manejar cambios en la wallet conectada
  useEffect(() => {
    const handleWalletChange = async () => {
      if (!address) {
        disconnectWallet();
        return;
      }

      try {
        setIsLoading(true);
        await checkWalletRegistration();
        
        const storedToken = localStorage.getItem('userToken');
        if (!storedToken) {
          setIsAuthenticated(false);
          return;
        }

        try {
          const verifyResponse = await axiosUserAPI.verifyToken(storedToken);
          const isValid = verifyResponse.data.valid && 
                         verifyResponse.data.wallet.toLowerCase() === address.toLowerCase();
          
          setIsAuthenticated(isValid);
          
          if (!isValid) {
            console.log("Token inválido o no coincide con la wallet");
            disconnectWallet();
          }
        } catch (error) {
          console.error("Token verification failed:", error);
          setIsAuthenticated(false);
          disconnectWallet();
        }
      } catch (error) {
        console.error("Error during wallet change:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
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