import { API_PATHS } from '@/config/paths';
import axios from 'axios';
import { authCompanyAxios } from "../auth/api/authCompanyAxios";
import { Product, UserProfile, Transaction, ApiResponse, DashboardDataType, OrderItem, UserStats, UpdateResponseType } from "@/shared/types/types";

export const authCompanyAPI = {

  getCompanyDashboard: async (): Promise<DashboardDataType> => {
    try {
      const { data } = await authCompanyAxios.get(`${API_PATHS.company}/company-dashboard`);
      return data;
    } catch (error) {
      throw new Error("Error al obtener los datos para el dashboard. "+error);
    }
  },

  getAllUsers: async (): Promise<ApiResponse<UserProfile[]>> => {
    try {
      const { data } = await authCompanyAxios.get(`${API_PATHS.company}/get-all-users`);
      return { success: true, data: data.users || [] };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener los usuarios';
      console.error("API Error - getAllUsers:", error);
      return { success: false, error: errorMessage };
    }
  },


  getAllOrders: async (): Promise<ApiResponse<OrderItem[]>> => {
    try {
      const { data } = await authCompanyAxios.get(`${API_PATHS.company}/get-all-orders`);
      return { success: true, data: data.orders };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener obtener las órdenes';
      console.error("API Error - getAllOrders:", error);
      return { success: false, error: errorMessage };
    }
  },  


  getTransactionsByWallet: async (walletAddress: string): Promise<ApiResponse<Transaction[]>> => {
    try {
      const { data } = await authCompanyAxios.get(`${API_PATHS.company}/get-transactions-by-wallet/${walletAddress}`);
      return { success: true, data: data.transactions || [] };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener transacciones';
      console.error(`API Error - getTransactionsByWallet(${walletAddress}):`, error);
      return { success: false, error: errorMessage };
    }
  },


  getAllTransactions: async (): Promise<ApiResponse<Transaction[]>> => {
    try {
      const { data } = await authCompanyAxios.get(`${API_PATHS.company}/get-all-transactions`);
      return { success: true, data: data.transactions || [] };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener transacciones';
      console.error(`API Error - getAllTransactions():`, error);
      return { success: false, error: errorMessage };
    }
  },


  getTransactionOrderItems: async (id: number): Promise<ApiResponse<OrderItem[]>> => {
    try {
      const { data } = await authCompanyAxios.get(`${API_PATHS.company}/get-transaction-order-items/${id}`);
      return { success: true, data: data.orderItems || [] };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener los usuarios';
      console.error("API Error - getTransactionOrderItems:", error);
      return { success: false, error: errorMessage };
    }
  },

  getProducts: async (): Promise<Product[]> => {
    try {
      const { data } = await authCompanyAxios.get(`${API_PATHS.company}/products`);
      return data;
    } catch (error) {
      throw new Error("Error al obtener los productos. "+error);
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
  },

  getUserStats: async (): Promise<ApiResponse<UserStats[]>> => {
    try {
      const { data } = await authCompanyAxios.get(`${API_PATHS.company}/get-users-transactions-sumary`);
      return { success: true, data: data.users || [] };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener los usuarios';
      console.error(`API Error - getUserStats():`, error);
      return { success: false, error: errorMessage };
    }
  },

  getUserByWallet: async (wallet: string) => {
    return await authCompanyAxios.get(`${API_PATHS.company}/get-user-by-wallet/${wallet}`)
    .then(response => response.data)
    .catch(err => {
      throw new Error (err.response.data.error);
    })
  },

  getTransactionDetail: async (hash: string) => {
    return await authCompanyAxios.get(`${API_PATHS.company}/get-transaction-detail/${hash}`)
    .then(response => response.data)
    .catch(err => {
      throw new Error (err.response.data.error);
    })
  },

  updateOrderItemStatus: (orderItemId: number, newStatus: string): Promise<UpdateResponseType> => {
    return authCompanyAxios.patch(`${API_PATHS.company}/update-order-item-status/${orderItemId}/`, {status: newStatus})
    .then(response => response.data)
    .catch(err => {
      throw new Error (err.response.data.error);
    })
  },
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