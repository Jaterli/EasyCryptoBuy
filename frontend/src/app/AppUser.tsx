import { Route, Routes } from "react-router-dom";
import { Box, Container, useBreakpointValue } from "@chakra-ui/react";
import { Toaster } from "@/shared/components/ui/toaster";
import { Navbar } from "@/features/user/components/NavbarUser";
import { WalletProvider } from "@/shared/context/WalletProvider";
import RegisterWalletPage from "@/features/user/pages/RegisterWalletPage";
import Footer from "@/shared/components/Footer";
import { Payment } from "@/features/user/Payment/Payment";
import { PaymentHistory } from "@/features/user/components/PaymentHistory";
import ResettableComponent from "@/shared/components/ResettableComponent";
import Home from "@/features/user/pages/Dashboard";
import SignWalletPage from "@/features/user/pages/SignWalletPage";
import RequireWallet from "@/shared/guards/RequireWallet";
import RequireSignature from "@/shared/guards/RequireSignature";
import RequireRegistration from "@/shared/guards/RequireRegistration";
import NotFoundPage from "@/features/user/pages/NotFoundPage";
import { ProductCatalogPage } from "@/features/user/pages/ProductCatalogPage";
import { CartProvider } from "@/features/user/context/CartContext";
import { CartSummaryPage } from "@/features/user/pages/CartSummaryPage";

export const AppUser = () => {
  const minHeight = useBreakpointValue({ base: "100vh", md: "auto" });
  return (
    <WalletProvider>
        <Navbar />
        <Box minH={minHeight} py={{ base: 4, md: 10 }}>
          <Container px={{ base: 0, md: 4, lg: 8 }} maxW={{ base: "100%", md: "container.md", lg: "container.lg", xl: "container.xl" }}>
            <Routes>
              <Route path="/dashboard" element={<Home />} />
              <Route path="/products" element={<CartProvider><ProductCatalogPage /></CartProvider>} />
              <Route path="/cart-sumary" element={<CartProvider><CartSummaryPage /></CartProvider>} />
              <Route path="/payments-history" element={<RequireWallet><RequireRegistration><PaymentHistory /></RequireRegistration></RequireWallet>} />
              <Route path="/payment" element={<RequireWallet><RequireRegistration><RequireSignature><ResettableComponent><CartProvider><Payment onReset={() => {}} /></ CartProvider></ResettableComponent></RequireSignature></RequireRegistration></RequireWallet>} />
              <Route path="/register-wallet" element={<RegisterWalletPage />} />
              <Route path="/sign-wallet" element={<RequireWallet><SignWalletPage /></RequireWallet>} />
              <Route path="*" element={<NotFoundPage />} />              
            </Routes>
          </Container>
        </Box>
        <Footer />
        <Toaster />
    </WalletProvider>
  );
};
