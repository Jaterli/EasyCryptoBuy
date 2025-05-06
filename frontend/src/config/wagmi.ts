import { metaMask } from 'wagmi/connectors';

import { 
  createConfig, 
  http
} from '@wagmi/core'
import { mainnet, sepolia } from '@wagmi/core/chains'

export const config = createConfig({
  chains: [mainnet, sepolia], // Soporta mainnet y testnet Sepolia
  connectors: [metaMask()],   // Conector para MetaMask
  transports: {
    [mainnet.id]: http(),      // Usa el proveedor por defecto de Ethereum
    [sepolia.id]: http('https://ethereum-sepolia-rpc.publicnode.com'),      // Usa el proveedor por defecto de Sepolia
  },
});