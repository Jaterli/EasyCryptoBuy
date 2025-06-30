import { useCallback } from "react";
import { toaster } from "@/shared/components/ui/toaster";
import { useWallet } from "@/features/user/hooks/useWallet";
import { axiosUserAPI } from "@/features/user/services/userApi";

interface FormData {
  name: string;
  email: string;
}

export function useRegisterWallet() {
  const { address, authenticate } = useWallet();

  const registerWallet = useCallback(async (formData: FormData) => {
    if (!address) {
      toaster.create({
        title: "Error",
        description: "No hay wallet conectada",
        type: "error",
        duration: 3000,
      });
      return { success: false };
    }

    try {
      const response = await axiosUserAPI.registerWallet({
        wallet_address: address,
        name: formData.name,
        email: formData.email,
      });

      if (response.success) {       
        // Autenticar automáticamente después del registro
        const authResult = await authenticate();
        
        toaster.create({
          title: "Registro exitoso",
          description: "Tu wallet ha sido registrada correctamente",
          type: "success",
          duration: 3000,
        });
        
        return { 
          success: true,
          authenticated: authResult 
        };
      } else {
        toaster.create({
          title: "Registro fallido",
          description: response.error || "Error desconocido",
          type: "error",
          duration: 4000,
        });
        return { success: false };
      }
    } catch (err) {    
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      toaster.create({
        title: "Error en registro",
        description: errorMessage,
        type: "error",
        duration: 4000,
      });
      return { success: false };
    }
  }, [address, authenticate]);

  return { registerWallet };
}