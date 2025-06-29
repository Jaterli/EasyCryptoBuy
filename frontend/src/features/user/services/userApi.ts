import { API_PATHS } from '@/config/paths';
import axios from 'axios';
import { authUserAxios } from '../auth/authUserAxios';
import { ApiResponse, UserProfile, OrderItem, Transaction } from '@/shared/types/types';


// Función auxiliar para manejar errores de API
function handleApiError<T>(error: unknown): ApiResponse<T> {
  let errorMessage = 'Ocurrió un error desconocido';
  let fieldErrors: Record<string, string> = {};

  if (axios.isAxiosError(error)) {
    // Error de validación de Django (400 con serializer.errors)
    if (error.response?.status === 400 && error.response.data) {
      if (typeof error.response.data === 'object') {
        // Procesar errores de campo del serializer
        fieldErrors = Object.entries(error.response.data).reduce((acc, [field, messages]) => {
          acc[field] = Array.isArray(messages) ? messages.join(' ') : String(messages);
          return acc;
        }, {} as Record<string, string>);
        
        errorMessage = 'Por favor corrige los errores en el formulario';
      } else {
        errorMessage = error.response.data.message || errorMessage;
      }
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return { 
    success: false, 
    error: errorMessage,
    fieldErrors 
  };
}

export const authUserAPI = {
 
  getNonce: (wallet: string) => 
    axios.get(`${API_PATHS.users}/get-wallet-nonce/${wallet}`),


  authenticate: (payload: { 
    wallet_address: string; 
    signature: string; 
    message: string 
  }) => axios.post(`${API_PATHS.users}/wallet-auth`, payload),
  

  getTransactionsByWallet: (wallet: string) =>
    authUserAxios.get(`${API_PATHS.payments}/get-transactions-by-wallet/${wallet}`),


  getTransactionOrderItems: async (id: number): Promise<ApiResponse<OrderItem[]>> => {
    try {
      const { data } = await authUserAxios.get(`${API_PATHS.payments}/get-transaction-order-items/${id}`);
      return { success: true, data: data.orderItems || [] };
    } catch (err) {
      let errorMessage = 'Ocurrió un error';
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }      
      return { success: false, error: errorMessage };
    }
  },

  getProfile: async (): Promise<ApiResponse<UserProfile>> => {
    try {
      const { data } = await authUserAxios.get(`${API_PATHS.users}/user-profile`);
      return { success: true, data };
    } catch (error) {
      return handleApiError<UserProfile>(error);
    }
  },


  updateProfile: async (data: UserProfile): Promise<ApiResponse<UserProfile>> => {
    try {
      const { data: responseData } = await authUserAxios.patch(`${API_PATHS.users}/user-profile`, data);
      return { success: true, data: responseData };
    } catch (err) {
      return handleApiError<UserProfile>(err);
    }
  },
};

export const axiosUserAPI = {

  verifyToken: (token: string) => 
    axios.get(`${API_PATHS.users}/verify-token`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  
  registerWallet: async (
    payload: { wallet_address: string; name: string; email: string }
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const { data } = await axios.post(`${API_PATHS.users}/register-wallet`, payload);
      return  data;
    } catch (err) {
      let errorMessage = 'Error de red o del servidor';
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      console.error("API Error - registerWallet:", err);
      return { success: false, error: errorMessage };
    }
  },

  checkWallet: (wallet: string) => 
    axios.get(`${API_PATHS.users}/check-wallet/${wallet}`),

  registerTransaction: (payload: unknown) => 
    authUserAxios.post(`${API_PATHS.payments}/register-transaction`, payload),
  
  updateTransaction: (id: number, payload: unknown) => 
    authUserAxios.put(`${API_PATHS.payments}/update-transaction/${id}`, payload),
  
  // getTransactionDetail: (hash: `0x${string}` | undefined) => 
  //   authUserAxios.get(`${API_PATHS.payments}/get-transaction-detail/${hash}`),
  
  getTransactionDetail: async (hash: `0x${string}` | undefined): Promise<ApiResponse<Transaction>> => {
    try {
      const { data } = await authUserAxios.get(`${API_PATHS.payments}/get-transaction-detail/${hash}`);
      return data;
    } catch (err) {
      return handleApiError<Transaction>(err);
    }
  },
  
  // getTransactionDetail: async (hash: string) => {
  //   return await authUserAxios.get(`${API_PATHS.payments}/get-transaction-detail/${hash}`)
  //   .then(response => response.data)
  //   .catch(err => {
  //     throw new Error (err.response.data.error);
  //   })
  // },

  deleteTransaction: (id: number) => 
    authUserAxios.delete(`${API_PATHS.payments}/delete-transaction/${id}`),

  validateCart: (payload: unknown) => 
    axios.post(`${API_PATHS.company}/validate-cart`, payload),

  saveCart: (payload: unknown) => 
    axios.post(`${API_PATHS.payments}/save-cart`, payload),

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