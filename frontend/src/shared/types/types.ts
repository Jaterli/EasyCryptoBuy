export interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  setCart: (items: CartItem[]) => void;
  cartLoading: boolean;
  setCartLoading: (loading: boolean) => void;
  pendingTransactions: Transaction[];
  checkPendingTransactions: () => Promise<void>;
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
    amount: string;
    created_at: string;
    token: string;
    status: string;
    purchase_summary?: {
      products: Array<{
        id: string;
        name: string;
        description: string;
        price_usd: string;
        quantity: number;
        subtotal: string;
      }>;
      total_usd: string;
      items_count: number;
    };
  }
  