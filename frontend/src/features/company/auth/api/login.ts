import { API_PATHS } from "@/config/paths";

export interface LoginResponse {
  token: string;
  refresh: string;
  is_staff: boolean;
  username: string;
}

export async function adminLogin(username: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_PATHS.accounts}/admin-login/`, {
    method: "POST",      
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    // Intentamos obtener el mensaje de error del backend
    let errorMessage = "Login fallido o sin permisos de administrador";
    try {
      const errorData = await res.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (e) {
      errorMessage = "Error en el login. "+e;
    }
    throw new Error(errorMessage);
  }

  return await res.json();
}