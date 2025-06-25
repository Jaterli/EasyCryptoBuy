import { authUserAPI } from "@/features/user/services/userApi";
import { toaster } from "@/shared/components/ui/toaster";
import { useSignMessage } from "wagmi";

export const useWalletAuth = () => {
  const { signMessageAsync } = useSignMessage();

  const generateAuthMessage = (nonce: string) => {
    return JSON.stringify({
      texto: "Estas firmando este mensaje para hacer la transacción segura.",
      nonce,
      timestamp: Date.now(),
      context: "login",
      domain: window.location.hostname,
    });
  };

  const authenticateWallet = async (address: string) => {
    try {
      // 1. Obtener nonce del backend
      const nonceResponse = await authUserAPI.getNonce(address);
      const nonce = nonceResponse.data.nonce;

      // 2. Crear y firmar mensaje
      const authMessage = generateAuthMessage(nonce);
      const signature = await signMessageAsync({ message: authMessage });

      // 3. Autenticar con backend
      const authResponse = await authUserAPI.authenticate({
        wallet_address: address,
        signature: signature,
        message: authMessage // Enviamos el mensaje completo
      });

      // 4. Guardar tokens
      const { data } = authResponse;
      
      if (data.success){
        localStorage.setItem('userToken', data.access_token);
        localStorage.setItem('userRefreshToken', data.refresh_token);
        return {success: true}
      } else {
        return {success: false, error: data.error};
      }

    } catch (error) {
      console.error("Authentication error:", error);
      toaster.create({
        title: "Error en la autenticación",
        description: "No se pudo completar la autenticación con la wallet",
        type: "error",
        duration: 4000
      });
      return { success: false, error };
    }
  };

  return { authenticateWallet };
};