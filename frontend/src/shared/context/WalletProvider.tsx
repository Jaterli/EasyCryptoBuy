import { createContext, useState, useEffect, ReactNode } from "react";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import { toaster } from "@/shared/components/ui/toaster";

export interface WalletContextType {
  address: string | undefined;
  isConnected: boolean;
  isSigned: boolean;
  isWalletRegistered: boolean | null;
  isLoading: boolean;
  refreshWalletStatus: () => void; 
  signMessage: () => Promise<string | null>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();

  const [isSigned, setIsSigned] = useState(false);
  const [isWalletRegistered, setIsWalletRegistered] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (address) {
      // siempre resetear estado firmado si la wallet cambia o se reconecta
      setIsSigned(false);
      setIsLoading(true);
      fetch(`http://localhost:8000/users/check-wallet?wallet_address=${address}`)
        .then((res) => res.json())
        .then((data) => {
          setIsWalletRegistered(data.isRegistered);
        })
        .catch(() => setIsWalletRegistered(false))
        .finally(() => setIsLoading(false));
    } else {
      setIsWalletRegistered(null);
      setIsSigned(false);
    }
  }, [address]);

  const refreshWalletStatus = () => {
    if (!address) return;
    setIsLoading(true);
    fetch(`http://localhost:8000/users/check-wallet?wallet_address=${address}`)
      .then(res => res.json())
      .then(data => {
        setIsWalletRegistered(data.isRegistered);
      })
      .catch(() => setIsWalletRegistered(false))
      .finally(() => setIsLoading(false));
  }
  

  const signMessage = async () => {
    if (!address) return null;
    try {
      const message = "Confirma tu identidad para usar la plataforma.";
      const signature = await signMessageAsync({ message });
      setIsSigned(true);
      return signature;
    } catch (error) {
      toaster.create({
        title: "Firma cancelada. " + error,
        type: "error",
        duration: 3000
      });
      return null;
    }
  };

  const disconnectWallet = () => {
    disconnect();
    setIsSigned(false);
    setIsWalletRegistered(null);
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        isSigned,
        isWalletRegistered,
        isLoading,
        refreshWalletStatus,
        signMessage,
        disconnectWallet
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export default WalletContext;
