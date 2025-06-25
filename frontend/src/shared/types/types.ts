export interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  setCart: (items: CartItem[]) => void;
  cartLoading: boolean;
  setCartLoading: (loading: boolean) => void;
  cartError: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
  
export interface ApiCartItem {
  product_id: string;
  product_name: string;
  product_description: string;
  product_price: number;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  amount_usd: number;
  quantity: number;
}
  
export interface UserProfile {
  id: number;
  user: {
    id: number;
    username: string;
    email?: string;
  };
  wallet_address: string;
  name?: string;
  email?: string;
  address?: string;
  phone_number?: string;
  birth_date?: string; // Formato ISO (YYYY-MM-DD)
  created_at: string;
  updated_at: string;
}  
 
export interface UpdateProfileData {
  name?: string;
  email?: string;
  address?: string;
  phone_number?: string;
  birth_date?: string;
}

export interface Transaction {
  id: number;
  transaction_hash: string;
  wallet_address: string;    
  amount: number;
  token: string;
  status: string;
  created_at: string;
  order_items?: OrderItem[];
}
  
export interface OrderItem {
  id: number;
  product: Product;
  quantity: number;
  price_at_sale: number;
  subtotal: number;
  created_at: string;
  status: string;
  transaction: Transaction
}  

export interface ApiError extends Error {
  response?: {
      status: number;
      data: {
        success?: boolean;
        message: string
      };
    };
}

export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}


export interface UpdateResponseType {
  success: boolean;
  message: string;
  error: string;
}

export interface DashboardDataType {
  success: boolean;
  total_revenue: number;
  active_users: number;
  total_transactions: number;
  inventory_value: number;
  top_products: Array<{
    id: number;
    name: string;
    units_sold: number;
    token: string;
    revenue: number;
  }>;
  recent_transactions: Array<{
    id: number;
    wallet_address: string;
    amount: number;
    token: string;
    status: string;
    created_at: string;
  }>;
  transaction_trend: Array<{
    date: string;
    amount: number;
    count: number;
  }>;
};

export interface UserTransactionsSumary{
  username: string,
  wallet_address: string,
  confirmed: number,
  pending: number,
  failed: number,
  total_spent: number,
  last_transaction: string,
};

export interface UserStats {
  id: string;
  username: string;
  email: string;
  confirmed: number;
  pending: number;
  failed: number;
};
