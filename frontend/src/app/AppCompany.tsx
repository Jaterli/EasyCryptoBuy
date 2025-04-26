import { Routes, Route } from "react-router-dom";
import { Container, Box, useBreakpointValue } from "@chakra-ui/react";
import { ProductList } from "@/features/company/components/ProductList";
import { AdminAuthProvider } from "@/shared/context/AdminAuthContext";
import RequireAdminAuth from "@/shared/context/RequireAdminAuth";
import { SalesHistory } from "@/features/company/components/SalesHistory";
import NotFoundPage from "@/features/company/pages/NotFoundPage";
import AdminLoginPage from "@/features/auth/pages/AdminLoginPage";
import { Toaster } from "@/shared/components/ui/toaster";
import Footer from "@/shared/components/Footer";
import { NavbarCompany } from "@/features/company/components/NavbarCompany";

export const AppCompany = () => {
  const minHeight = useBreakpointValue({ base: "100vh", md: "auto" });

  return (
    <AdminAuthProvider>
      <NavbarCompany />
        <Box minH={minHeight} p={6}>
          <Container maxW="container.lg">
            <Routes>
              <Route path="/company/admin-login" element={<AdminLoginPage />} /> 
              <Route path="/company/products" element={<RequireAdminAuth><ProductList /></RequireAdminAuth>} />
              <Route path="/company/sales" element={<RequireAdminAuth><SalesHistory /></RequireAdminAuth>} /> 
              <Route path="*" element={<NotFoundPage />} />              
            </Routes>
          </Container>
        </Box>
        <Footer />
        <Toaster />
    </AdminAuthProvider>
  );
};
