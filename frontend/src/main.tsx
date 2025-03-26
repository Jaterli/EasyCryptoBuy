import './index.css'
import App from './App.tsx'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { config } from './config/wagmi.ts'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChakraProvider, defaultSystem  } from '@chakra-ui/react';
import { ThemeProvider } from 'next-themes'; // Importa ThemeProvider

// Crea un cliente de React Query
const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider value={defaultSystem}>        
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </ChakraProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
)
