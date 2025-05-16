import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { API_PATHS } from "@/config/paths";

// Extendemos la interfaz para añadir _retry
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

const userApi: AxiosInstance = axios.create({
  baseURL: API_PATHS.base,
  headers: {
    "Content-Type": "application/json",
  },
});

async function refreshUserToken(): Promise<string> {
  const refresh = localStorage.getItem("userRefreshToken");

  try {
    console.log("Intentando refrescar token");
    const { data } = await userApi.post("/api/token/refresh/", { refresh });
    localStorage.setItem("userToken", data.access);
    return data.access;
  } catch (error) {
    throw new Error("No se pudo refrescar el token de usuario. "+error);
  }
}

// Interceptor para añadir token de usuario
userApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem("userToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores 401
userApi.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const newToken = await refreshUserToken();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return userApi(originalRequest);
      } catch (refreshError) {
        console.error("Refresh fallido o sesión caducada, cerrando sesión", refreshError);
        localStorage.removeItem("userToken");
        localStorage.removeItem("userRefreshToken");
        localStorage.removeItem("userData");
        //window.location.href = "/sign-wallet";
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const authUserAxios = userApi;