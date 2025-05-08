import { API_PATHS } from '@/config/paths';
import axios from 'axios';

export const authAPI = {
  getNonce: (wallet: string) => 
    axios.get(`${API_PATHS.users}/get-wallet-nonce/${wallet}`),

  authenticate: (data: { wallet_address: string; signature: string; message: string }) => 
    axios.post(`${API_PATHS.users}/wallet-auth`, data),
  
  verifyToken: (token: string) => 
    axios.get(`${API_PATHS.users}/verify-token`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  
  checkWallet: (wallet: string) => 
    axios.get(`${API_PATHS.users}/check-wallet/${wallet}`)
};

export const paymentsAPI = {

  validateCart: (data: any) => 
    axios.post(`${API_PATHS.company}/validate-cart`, data),

  registerTransaction: (data: any) => 
    axios.post(`${API_PATHS.payments}/register-transaction`, data),
  
  updateTransaction: (id: number, data: any) => 
    axios.post(`${API_PATHS.payments}/update-transaction/${id}`, data),
  
  getTransactionDetails: (hash: `0x${string}` | undefined) => 
    axios.get(`${API_PATHS.payments}/transaction-details/${hash}`),
  
  deleteTransaction: (id: number) => 
    axios.delete(`${API_PATHS.payments}/delete-transaction/${id}`)
};

// Interceptor para manejar errores globalmente
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Manejar token expirado aquí
      console.log('Token expirado o inválido');
      console.log(error.message);
    }
    return Promise.reject(error);
  }
);