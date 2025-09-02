import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { API_PATHS } from "@/config/paths";

// Extendemos la interfaz para añadir _retry
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

const companyApi: AxiosInstance = axios.create({
  baseURL: API_PATHS.base,
  headers: {
    "Content-Type": "application/json",
  },
});

async function refreshCompanyToken(): Promise<string> {
  const refresh = localStorage.getItem("companyRefreshToken");

  try {
    console.log("Intentando refrescar token");
    const { data } = await companyApi.post(`${API_PATHS.base}/token/refresh/`, { refresh });
    localStorage.setItem("companyToken", data.access);
    return data.access;
  } catch (error) {
    throw new Error("No se pudo refrescar el token de company. "+error);
  }
}

// Interceptor para añadir token - ahora usando InternalAxiosRequestConfig
companyApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem("companyToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores 401
companyApi.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const newToken = await refreshCompanyToken();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return companyApi(originalRequest);
      } catch (refreshError) {
        console.error("Refresh fallido o sesión caducada, cerrando sesión", refreshError);
        localStorage.removeItem("companyToken");
        localStorage.removeItem("companyRefreshToken");
        localStorage.removeItem("companyUsername");
        window.location.href = "company-login";
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const authCompanyAxios = companyApi;