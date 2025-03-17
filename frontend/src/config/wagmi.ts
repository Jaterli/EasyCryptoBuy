import { createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { metaMask } from 'wagmi/connectors';

export const config = createConfig({
  chains: [mainnet, sepolia], // Soporta mainnet y testnet Sepolia
  connectors: [metaMask()],   // Conector para MetaMask
  transports: {
    [mainnet.id]: http(),      // Usa el proveedor por defecto de Ethereum
    [sepolia.id]: http(),      // Usa el proveedor por defecto de Sepolia
  },
});