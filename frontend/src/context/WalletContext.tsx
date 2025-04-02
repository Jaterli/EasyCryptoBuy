import { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import { toaster } from "@/components/ui/toaster";

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isSigned: boolean;
  isWalletRegistered: boolean | null;
  isLoading: boolean;
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

  const signMessage = async () => {
    if (!address) return null;
    try {
      const message = "Confirma tu identidad para usar la plataforma.";
      const signature = await signMessageAsync({ message });
      setIsSigned(true);
      return signature;
    } catch (error) {
      toaster.create({ title: "Firma cancelada. "+error, type: "error", duration: 3000 });
      return null;
    }
  };

  const disconnectWallet = () => {
    disconnect();
    setIsSigned(false);
    setIsWalletRegistered(null);
  };

  return (
    <WalletContext.Provider value={{ address, isConnected, isSigned, isWalletRegistered, isLoading, signMessage, disconnectWallet }}>
      {children}
    </WalletContext.Provider>
  );
}

// ✅ Agregamos este hook para evitar el error en UserForm.tsx
export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet debe usarse dentro de un WalletProvider");
  }
  return context;
}
