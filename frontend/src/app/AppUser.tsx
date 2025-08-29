import { Route, Routes } from "react-router-dom";
import { Box, Container, useBreakpointValue } from "@chakra-ui/react";
import { Toaster } from "@/shared/components/ui/toaster";
import { Navbar } from "@/features/user/components/NavbarUser";
import { WalletProvider } from "@/features/user/context/WalletProvider";
import RegisterWalletPage from "@/features/user/pages/RegisterWalletPage";
import Footer from "@/shared/components/Footer";
import { Payment } from "@/features/user/Payment/Payment";
import { PurchaseHistory } from "@/features/user/components/PurchaseHistory";
import Home from "@/features/user/pages/UserDashboard";
import RequireWallet from "@/features/user/guards/RequireWallet";
import RequireRegistration from "@/features/user/guards/RequireRegistration";
import NotFoundPage from "@/features/user/pages/NotFoundPage";
import { ProductCatalogPage } from "@/features/user/pages/ProductCatalogPage";
import { CartProvider } from "@/features/user/context/CartContext";
import { CartSummaryPage } from "@/features/user/pages/CartSummaryPage";
import ProfilePage from "@/features/user/pages/ProfilePage";
import { AuthDialogProvider } from "@/features/user/context/AuthDialogContext";
import { RequireAuthentication } from "@/features/user/guards/RequireAuthentication";

export const AppUser = () => {
  const minHeight = useBreakpointValue({ base: "100vh", md: "auto" });
  return (
    <WalletProvider>
      <CartProvider>
        <AuthDialogProvider> 
        <Navbar />
        <Box minH={minHeight} pt={{ base: 4, md: 10 }} pb={"100px"}>
          <Container px={{ base: 0, md: 4, lg: 8 }} maxW={{ base: "100%", md: "container.md", lg: "container.lg", xl: "container.xl" }}>
            <Routes>
              <Route path="/dashboard" element={<Home />} />
              <Route path="/products-catalog" element={<ProductCatalogPage />} />
              <Route path="/cart-sumary" element={<CartSummaryPage />} />
              <Route path="/purchase-history" element={<RequireWallet><RequireRegistration><RequireAuthentication><PurchaseHistory /></RequireAuthentication></RequireRegistration></RequireWallet>} />
              <Route path="/payment" element={<RequireWallet><RequireRegistration><Payment /></RequireRegistration></RequireWallet>} />
              <Route path="/register-wallet" element={<RequireWallet><RegisterWalletPage /></RequireWallet>} />
              <Route path="/profile" element={<RequireWallet><RequireRegistration><RequireAuthentication><ProfilePage /></RequireAuthentication></RequireRegistration></RequireWallet>} />
              <Route path="/" element={<Home />} />                            
              <Route path="*" element={<NotFoundPage />} />              
            </Routes>
          </Container>
        </Box>
        <Footer />
        <Toaster />
        </AuthDialogProvider>
        </CartProvider> 
    </WalletProvider>
  );
};

export default AppUser;