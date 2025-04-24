import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Box, Container } from "@chakra-ui/react";
import { Toaster } from "@/shared/components/ui/toaster";
import { Navbar } from "@/shared/components/Navbar";
import { WalletProvider } from "@/shared/context/WalletProvider";
import RegisterWalletPage from "@/features/user/pages/RegisterWalletPage";
import Footer from "@/shared/components/Footer";
import { Payment } from "@/features/user/Payment/Payment";
import { PaymentHistory } from "@/features/user/components/PaymentHistory";
import ResettableComponent from "@/shared/components/ResettableComponent";
import Home from "@/features/user/pages/home";
import SignWalletPage from "@/features/user/pages/SignWalletPage";
import RequireWallet from "@/shared/guards/RequireWallet";
import RequireSignature from "@/shared/guards/RequireSignature";
import RequireRegistration from "@/shared/guards/RequireRegistration";


function App() {
  return (
    <WalletProvider>
      <Router>
        <Navbar />
        <Box 
          minH="100vh" 
          spaceX={0} 
          py={{ base: 4, md: 10 }} // 4 unidades en móvil, 10 en desktop
          px={{ base: 0, md: 0 }}   // 0 unidades en móvil, 0 en desktop
        >
          <Container 
            spaceX={0} 
            px={{ base: 0, md: 4, lg: 8 }} // Padding horizontal responsivo
            maxW={{ 
              base: "100%",      // Pantallas pequeñas: ancho completo
              md: "container.md",// Breakpoint medio
              lg: "container.lg",// Breakpoint grande
              xl: "container.xl" // Breakpoint extra grande
            }}
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/payments-history" element={<RequireWallet><RequireRegistration><PaymentHistory /></RequireRegistration></RequireWallet>} />
              <Route path="/payment" element={<RequireWallet><RequireRegistration><RequireSignature><ResettableComponent><Payment onReset={() => {}} /></ResettableComponent></RequireSignature></ RequireRegistration></RequireWallet>} />
              <Route path="/register-wallet" element={<RegisterWalletPage />} />    
              <Route path="/sign-wallet" element={<RequireWallet><SignWalletPage /></RequireWallet>} />                        
            </Routes>            
          </Container>
        </Box>
        <Footer />        
        <Toaster />
      </Router>
    </WalletProvider>
  );
}

export default App;