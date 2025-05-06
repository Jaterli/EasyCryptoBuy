import { createContext, useContext, useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { API_PATHS } from "@/config/paths";
import { ApiCartItem, CartItem, Product } from "@/shared/types/types";

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  setCart: (items: CartItem[]) => void;
  cartLoading: boolean;
  setCartLoading: (loading: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState<boolean>(true);
  const { address } = useAccount();

  // Función para guardar el carrito en el backend
  useEffect(() => {
    if (!address || cart.length === 0) return;

    const saveCart = async () => {
      const payload = {
        wallet: address,
        items: cart.map((item: CartItem) => ({
          product_id: item.product.id,
          quantity: item.quantity
        }))
      };

      try {
        await fetch(`${API_PATHS.payments}/save-cart`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch (error) {
        console.error("Error sincronizando carrito:", error);
      }
    };

    saveCart();
  }, [cart, address]);

  // Función para cargar el carrito desde el backend
  useEffect(() => {
    const loadCart = async () => {
      if (!address) return;
      setCartLoading(true);
      try {
        const res = await fetch(`${API_PATHS.payments}/get-cart/${address}`);
        const data = await res.json();

        if (Array.isArray(data?.items)) {
            const restored = data.items.map((item: ApiCartItem) => ({
                product: {
                  id: item.product_id,
                  name: item.product_name,
                  description: item.product_description,
                  amount_usd: item.product_price
                },
                quantity: item.quantity
              }));
          setCart(restored);
        } else {
          setCart([]);
        }
      } catch (err) {
        console.error("Error cargando carrito:", err);
        setCart([]);
      } finally {
        setCartLoading(false);
      }
    };

    loadCart();
  }, [address, setCart, setCartLoading]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity < product.quantity) {
          return prev.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          alert("Has alcanzado el máximo disponible de este producto");
          return prev;
        }
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.product.id !== id));
  };

  const clearCart = async () => {
    if (!address) return;
    
    try {
      await fetch(`${API_PATHS.payments}/clear-cart/${address}`, {
        method: "DELETE"
      });
      setCart([]);
    } catch (err) {
      console.error("Error limpiando carrito en backend:", err);
    }
  };

  
  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        setCart,
        cartLoading,
        setCartLoading
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};