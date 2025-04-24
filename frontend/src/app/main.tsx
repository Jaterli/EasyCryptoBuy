import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChakraProvider } from "@chakra-ui/react";
import { ColorModeProvider } from "@/shared/components/ui/color-mode.tsx";
import { customSystem } from "@/theme/index.ts";
import { config } from "@/config/wagmi.ts";
import { AppUser } from "@/app/AppUser";
import { AppCompany } from "@/app/AppCompany";

const queryClient = new QueryClient();

export const AppRouterSelector = () => {
  const location = useLocation();
  const isCompanyPath = location.pathname.startsWith("/company");
  return isCompanyPath ? <AppCompany /> : <AppUser />;
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WagmiProvider config={config}> {/* Valorar si es necesario que envuelva a AppCompany */}
      <QueryClientProvider client={queryClient}>
        <ChakraProvider value={customSystem}>
          <ColorModeProvider>
            <BrowserRouter>
              <AppRouterSelector />
            </BrowserRouter>
          </ColorModeProvider>
        </ChakraProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);
