import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChakraProvider } from "@chakra-ui/react";
import { ColorModeProvider } from "@/shared/components/ui/color-mode.tsx";
import { customSystem } from "@/theme/index.ts";
import { config } from "@/config/wagmi.ts";

const AppUser = lazy(() => import("@/app/AppUser"));
const AppCompany = lazy(() => import("@/app/AppCompany"));

const queryClient = new QueryClient();

export const AppRouterSelector = () => {
  const location = useLocation();
  const isCompanyPath = location.pathname.startsWith("/company");

  return (
    <Suspense fallback={<div>Cargando app...</div>}>
      {isCompanyPath ? (
        <AppCompany />
      ) : (
        <WagmiProvider config={config}>
          <AppUser />
        </WagmiProvider>
      )}
    </Suspense>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={customSystem}>
        <ColorModeProvider>
          <BrowserRouter>
            <AppRouterSelector />
          </BrowserRouter>
        </ColorModeProvider>
      </ChakraProvider>
    </QueryClientProvider>
  </StrictMode>
);
