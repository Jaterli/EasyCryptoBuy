import App from './App.tsx';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChakraProvider } from '@chakra-ui/react';
import { ColorModeProvider } from "@/shared/components/ui/color-mode.tsx";
import { customSystem } from '@/theme/index.ts';
import { config } from '@/config/wagmi.ts';

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