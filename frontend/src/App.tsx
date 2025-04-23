import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Box, Container } from "@chakra-ui/react";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/Navbar";
import { PaymentHistory } from '@/components/PaymentHistory';
import { Payment } from "@/components/Payment/Payment";
import { WalletProvider } from "@/context/WalletProvider";
import RequireWallet from '@/components/RequireWallet'; 
import Home from "./pages/home";
import ResettableComponent from "./components/ResettableComponent";
import RegisterWalletPage from "@/pages/RegisterWalletPage";
import Footer from "@/components/Footer";


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
              <Route path="/payments-history" element={<RequireWallet><PaymentHistory /></RequireWallet>} />
              <Route path="/payment" element={<RequireWallet><ResettableComponent><Payment onReset={() => {}} /></ResettableComponent></RequireWallet>} />
              <Route path="/register" element={<RequireWallet><RegisterWalletPage /></RequireWallet>} />              
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