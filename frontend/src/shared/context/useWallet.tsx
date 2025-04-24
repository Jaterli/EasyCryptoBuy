import { useContext } from "react";
import WalletContext, { WalletContextType } from "./WalletProvider";

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet debe usarse dentro de un WalletProvider");
  }
  return context;
}
