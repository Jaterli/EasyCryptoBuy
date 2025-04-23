import { useCallback } from "react";
import { toaster } from "@/components/ui/toaster";

interface FormData {
  name: string;
  email: string;
}

export function useRegisterWallet(address: string | undefined) {
  const registerWallet = useCallback(async (formData: FormData) => {
    if (!address) return;

    try {
      const response = await fetch("http://localhost:8000/users/register-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: address,
          name: formData.name,
          email: formData.email,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toaster.create({
          title: "Wallet registrada",
          description: data.message,
          type: "success",
          duration: 3000,
        });
        return { success: true };
      } else {
        toaster.create({
          title: "Registro fallido",
          description: data.message,
          type: "error",
          duration: 4000,
        });
        return { success: false };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      toaster.create({
        title: "Error en registro",
        description: message,
        type: "error",
        duration: 4000,
      });
      return { success: false };
    }
  }, [address]);

  return { registerWallet };
}
