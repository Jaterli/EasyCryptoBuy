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
  
 
  export interface TransactionProp {
    transaction_hash: string;
    amount: string;
    created_at: string;
    token: string;
    status: string;
  }