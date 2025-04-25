// Refresco de token cuando se recibe un 401
import { API_PATHS } from "@/config/paths";

export async function refreshAccessToken(): Promise<string> {
  const refresh = localStorage.getItem("adminRefreshToken");

  const res = await fetch(`${API_PATHS.base}/api/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    throw new Error("No se pudo refrescar el token");
  }

  const data = await res.json();
  localStorage.setItem("adminToken", data.access);
  return data.access;
}

export async function authFetch(
  input: RequestInfo,
  init: RequestInit = {}
): Promise<Response> {
  let token = localStorage.getItem("adminToken");

  let res = await fetch(input, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status === 401) {
    try {
      token = await refreshAccessToken();
      res = await fetch(input, {
        ...init,
        headers: {
          ...(init.headers || {}),
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      console.error("Refresh fallido, cerrando sesión", err);
      throw err;
    }
  }

  return res;
}
