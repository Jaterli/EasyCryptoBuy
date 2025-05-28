import { API_PATHS } from '@/config/paths';
import axios from 'axios';
import { authCompanyAxios } from "../auth/api/authCompanyAxios";
import { Product } from "@/shared/types/types";

export async function getProducts(): Promise<Product[]> {
  try {
    const { data } = await authCompanyAxios.get(`${API_PATHS.company}/products/`);
    return data;
  } catch (error) {
    throw new Error("Error al obtener productos. "+error);
  }
}


export const authCompanyAPI = {

  // Productos
  getProducts:(): Promise<Product[]> => {
    try {
      return authCompanyAxios.get(`${API_PATHS.company}/products`)
        .then(({ data }) => data);
    } catch (error) {
      throw new Error("Error al obtener productos. "+error);
    }
  },

  createProduct: (product: Omit<Product, "id">): Promise<void> => {
    try {
      return authCompanyAxios.post(`${API_PATHS.company}/products/`, product);
    } catch (error) {
      throw new Error("Error al crear producto. "+error);
    }
  },

  updateProduct: (id: string, product: Product): Promise<void> => {
    try {
      return authCompanyAxios.put(`${API_PATHS.company}/products/${id}/`, product);
    } catch (error) {
      throw new Error("Error al actualizar producto. "+error);
    }
  },

  deleteProduct: (id: string): Promise<void> => {
    try {
      return authCompanyAxios.delete(`${API_PATHS.company}/products/${id}/`);
    } catch (error) {
      throw new Error("Error al eliminar producto. "+error);
    }
  }
};


export const axiosAPI = {

  registerTransaction: (data: unknown) => 
    authCompanyAxios.post(`${API_PATHS.payments}/register-transaction`, data),
  
  updateTransaction: (id: number, data: unknown) => 
    authCompanyAxios.put(`${API_PATHS.payments}/update-transaction/${id}`, data),
  
  getTransactionDetails: (hash: `0x${string}` | undefined) => 
    axios.get(`${API_PATHS.payments}/get-transaction-by-hash/${hash}`),
  
  deleteTransaction: (id: number) => 
    authCompanyAxios.delete(`${API_PATHS.payments}/delete-transaction/${id}`),

  validateCart: (data: unknown) => 
    axios.post(`${API_PATHS.company}/validate-cart`, data),

  saveCart: (data: unknown) => 
    authCompanyAxios.post(`${API_PATHS.payments}/save-cart`, data),

  clearCart: (address: string) =>
    authCompanyAxios.delete(`${API_PATHS.payments}/clear-cart/${address}`),

  deleteCart: (address: string) =>
    authCompanyAxios.delete(`${API_PATHS.payments}/delete-cart/${address}`),  

  checkPendingTransactions: (address: string) =>
    authCompanyAxios.get(`${API_PATHS.payments}/check-pending-transactions/${address}`)
};

// Interceptor para manejar errores globalmente
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Manejar token expirado aquí
      console.log('Token expirado o inválido [Company]');
      console.log(error.message);
    }
    return Promise.reject(error);
  }
);