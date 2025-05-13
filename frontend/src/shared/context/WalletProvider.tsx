import { createContext, useState, useEffect, ReactNode } from "react";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import { toaster } from "@/shared/components/ui/toaster";
import { authAPI } from "@/features/user/services/api";
import { ApiError } from "../types/types";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  wallet: string | null;
}

export interface WalletContextType {
  address: string | undefined;
  isConnected: boolean;
  isAuthenticated: boolean;
  isWalletRegistered: boolean | null;
  isLoading: boolean;
  authState: AuthState;
  refreshWalletStatus: () => Promise<void>;
  authenticate: () => Promise<boolean>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();

  const [authState, setAuthState] = useState<AuthState>({
    accessToken: null,
    refreshToken: null,
    wallet: null
  });
  const [isWalletRegistered, setIsWalletRegistered] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Verificar autenticación al cargar o cambiar wallet
  useEffect(() => {
    const checkAuth = async () => {
      if (address) {
        await checkWalletRegistration();
        await trySilentAuth();
      } else {
        clearAuth();
      }
    };
    checkAuth();
  }, [address]);

  const checkWalletRegistration = async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      const response = await authAPI.checkWallet(address);
      setIsWalletRegistered(response.data.isRegistered);
    } catch (error) {
      console.error("Error: "+error);
      setIsWalletRegistered(false);
    } finally {
      setIsLoading(false);
    }
  };

  const trySilentAuth = async () => {
    if (!address) return false;
    const storedToken = localStorage.getItem('userToken');
    if (!storedToken) return false;

    try {
      // Verificar token con el backend
      console.log("Verificando token con el backend...")
      const response = await authAPI.verifyToken(storedToken);
      
      if (response.data.isValid && response.data.wallet.toLowerCase() === address.toLowerCase()) {
        console.log("Token validado.")
        setAuthState({
          accessToken: storedToken,
          refreshToken: localStorage.getItem('userRefreshToken'),
          wallet: address
        });
        return true;
      }
    } catch (error) {
      console.error("Error: "+error);
      clearAuth();
    }
    return false;
  };

  const authenticate = async (): Promise<boolean> => {
    if (!address) return false;
    setIsLoading(true);
    
    try {
      // 1. Obtener nonce del backend
      const nonceResponse = await authAPI.getNonce(address);
      const nonce = nonceResponse.data.nonce;

      // 2. Crear mensaje estructurado
      const authMessage = JSON.stringify({
        texto: "Estas firmando este mensaje para hacer la transacción segura.",
        nonce: nonce,
        timestamp: Date.now(),
        context: "login",
        domain: window.location.hostname
      });

      // 3. Firmar el mensaje
      const signature = await signMessageAsync({ message: authMessage });

      // 4. Autenticar con el backend
      const authResponse = await authAPI.authenticate({
        wallet_address: address,
        signature,
        message: authMessage // Enviamos el JSON completo
      });
      // 5. Guardar tokens
      const { access_token, refresh_token } = authResponse.data;
      localStorage.setItem('userToken', access_token);
      localStorage.setItem('userRefreshToken', refresh_token);
      
      setAuthState({
        accessToken: access_token,
        refreshToken: refresh_token,
        wallet: address
      });

      return true;
    } catch (error) {

      const apiError = error as ApiError;
      const errorMessage = apiError.response.data.message;
      
      toaster.create({
        title: "Error de autenticación [Provider]",
        description: errorMessage ? errorMessage : "No se pudo autenticar",
        type: "error",
        duration: 3000
      });
      console.error("Error en transacción:", errorMessage);

      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuth = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userRefreshToken');
    setAuthState({
      accessToken: null,
      refreshToken: null,
      wallet: null
    });
  };

  const disconnectWallet = () => {
    disconnect();
    clearAuth();
    setIsWalletRegistered(null);
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        isAuthenticated: !!authState.accessToken,
        isWalletRegistered,
        isLoading,
        authState,
        refreshWalletStatus: checkWalletRegistration,
        authenticate,
        disconnectWallet
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export default WalletContext;