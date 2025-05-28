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
  
 
export interface Transaction {
    id: number;
    transaction_hash: string;
    wallet_address: string;    
    amount: number;
    created_at: string;
    token: string;
    status: string;
}
  
export interface OrderItem {
  product: Product;
  quantity: number;
  price_at_sale: number;
  created_at: string;
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