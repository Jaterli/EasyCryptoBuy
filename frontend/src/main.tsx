import App from './App.tsx';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { config } from './config/wagmi.ts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChakraProvider } from '@chakra-ui/react';
import { ColorModeProvider } from "@/components/ui/color-mode";
import { customSystem } from "./theme"; // Nueva importación

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider value={customSystem}> {/* Usar customSystem aquí */}
          <ColorModeProvider>
            <App />
          </ColorModeProvider>
        </ChakraProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);