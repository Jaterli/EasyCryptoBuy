import { API_PATHS } from '@/config/paths';
import axios from 'axios';
import { authUserAxios } from '../auth/authUserAxios';

export const authUserAPI = {
  getNonce: (wallet: string) => 
    axios.get(`${API_PATHS.users}/get-wallet-nonce/${wallet}`),

  authenticate: (data: { 
    wallet_address: string; 
    signature: string; 
    message: string 
  }) => axios.post(`${API_PATHS.users}/wallet-auth`, data),
  
  verifyToken: (token: string) => 
    axios.get(`${API_PATHS.users}/verify-token`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  
  registerWallet: (data: { wallet_address: string; name: string; email: string }) => 
    axios.post(`${API_PATHS.users}/register-wallet`, data),

  checkWallet: (wallet: string) => 
    axios.get(`${API_PATHS.users}/check-wallet/${wallet}`),

  getUserTransactions: (wallet: string) =>
    authUserAxios.get(`${API_PATHS.payments}/get-user-transactions/${wallet}`),

  getTransactionOrderItems: (id: number) =>
    authUserAxios.get(`${API_PATHS.payments}/get-transaction-order-items/${id}`),

};

export const axiosAPI = {

  registerTransaction: (data: unknown) => 
    authUserAxios.post(`${API_PATHS.payments}/register-transaction`, data),
  
  updateTransaction: (id: number, data: unknown) => 
    authUserAxios.put(`${API_PATHS.payments}/update-transaction/${id}`, data),
  
  getTransactionDetails: (hash: `0x${string}` | undefined) => 
    authUserAxios.get(`${API_PATHS.payments}/get-transaction-by-hash/${hash}`),
  
  deleteTransaction: (id: number) => 
    authUserAxios.delete(`${API_PATHS.payments}/delete-transaction/${id}`),

  validateCart: (data: unknown) => 
    axios.post(`${API_PATHS.company}/validate-cart`, data),

  saveCart: (data: unknown) => 
    axios.post(`${API_PATHS.payments}/save-cart`, data),

  getCart: (address: string) =>
    axios.get(`${API_PATHS.payments}/get-cart/${address}`),

  clearCart: (address: string) =>
    authUserAxios.delete(`${API_PATHS.payments}/clear-cart/${address}`),

  deleteCart: (address: string) =>
    authUserAxios.delete(`${API_PATHS.payments}/delete-cart/${address}`),  

  checkPendingTransactions: (address: string) =>
    axios.get(`${API_PATHS.payments}/check-pending-transactions/${address}`)
};

// Interceptor para manejar errores globalmente
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Manejar token expirado aquí
      // Aquí no se debería manejar tokens, eso es en authUserAxios
      console.log('Token expirado o inválido [User]');
      console.log(error.message);
    }
    return Promise.reject(error);
  }
);