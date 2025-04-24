export interface LoginResponse {
    token: string;
    is_staff: boolean;
  }
  
  export async function adminLogin(username: string, password: string): Promise<LoginResponse> {
    const res = await fetch("/api/admin-login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });
  
    if (!res.ok) {
      throw new Error("Login fallido o sin permisos de administrador");
    }
  
    return await res.json();
  }
  
  