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
    [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/gUwAJM2B5XvYHm4Bqbkx5FT3bdGa9bcj'),      // Usa el proveedor por defecto de Sepolia
  },
});