import { Routes, Route } from "react-router-dom";
import { Container, Box, useBreakpointValue } from "@chakra-ui/react";
import { ProductList } from "@/features/company/components/ProductList";
import { CompanyAuthProvider } from "@/shared/context/CompanyAuthContext";
import RequireAdminAuth from "@/shared/context/RequireCompanyAuth";
import { SalesHistory } from "@/features/company/components/SalesHistory";
import NotFoundPage from "@/features/company/pages/NotFoundPage";
import { Toaster } from "@/shared/components/ui/toaster";
import Footer from "@/shared/components/Footer";
import { NavbarCompany } from "@/features/company/components/NavbarCompany";
import CompanyLoginPage from "@/features/company/auth/pages/CompanyLoginPage";
import { CompanyDashboard } from "@/features/company/dashboard/CompanyDashboard";
import { CompanyUsersPage } from "@/features/company/pages/CompanyUsersPage";
import { UserDetailPage } from "@/features/company/pages/CompanyUserDetailPage";
import { TransactionDetail } from "@/features/company/components/TransactionDetail";
import { OrderHistoryPage } from '@/features/company/pages/OrderHistoryPage';

export const AppCompany = () => {
  const minHeight = useBreakpointValue({ base: "100vh", md: "auto" });

  return (
    <CompanyAuthProvider>
      <NavbarCompany />
        <Box minH={minHeight} py={{ base: 4, md: 10 }}>
          <Container px={{ base: 0, md: 4, lg: 8 }} maxW={{ base: "100%", md: "container.md", lg: "container.lg", xl: "container.xl" }}>
            <Routes>
              <Route path="/company/" element={<RequireAdminAuth><CompanyDashboard/></RequireAdminAuth>} /> 
              <Route path="/company/company-login" element={<CompanyLoginPage />} /> 
              <Route path="/company/products" element={<RequireAdminAuth><ProductList /></RequireAdminAuth>} />
              <Route path="/company/sales" element={<RequireAdminAuth><SalesHistory /></RequireAdminAuth>} /> 
              <Route path="/company/users" element={<RequireAdminAuth><CompanyUsersPage /></RequireAdminAuth>} /> 
              <Route path="/company/orders" element={<RequireAdminAuth><OrderHistoryPage /></RequireAdminAuth>} /> 
              <Route path="/company/users/:wallet_address" element={<RequireAdminAuth><UserDetailPage /></RequireAdminAuth>} /> 
              <Route path="/company/transaction-detail/:hash" element={<RequireAdminAuth><TransactionDetail /></RequireAdminAuth>} />               
              <Route path="*" element={<NotFoundPage />} />              
            </Routes>
          </Container>
        </Box>
        <Footer />
        <Toaster />
    </CompanyAuthProvider>
  );
};

export default AppCompany;