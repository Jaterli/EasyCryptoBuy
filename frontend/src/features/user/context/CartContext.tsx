import { createContext, useContext, useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { API_PATHS } from "@/config/paths";
import { ApiCartItem, CartContextType, CartItem, Product, Transaction } from "@/shared/types/types";
import { useWallet } from "@/shared/context/useWallet";
import { authUserAxios } from "../auth/authUserAxios";

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isWalletRegistered } = useWallet();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState<boolean>(true);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [cartError, setCartError] = useState<boolean>(false);
  const { address } = useAccount();

  // Verificar transacciones pendientes
  const checkPendingTransactions = async () => {
    if (!address || !isWalletRegistered) {
      setPendingTransactions([]);
      return;
    }
    
    try {
      const { data } = await authUserAxios.get(`${API_PATHS.payments}/check-pending-transactions/${address}`);
      
      if (data.success) {
        setPendingTransactions(data.transactions || []);
      } else {
        console.error("Error checking pending transactions:", data.message);
        setPendingTransactions([]);
      }
    } catch (err) {
      console.error("Error verificando transacciones pendientes:", err);
      setPendingTransactions([]);
    }
  };

  // Verificar transacciones pendientes al cambiar de cuenta
  useEffect(() => {
    checkPendingTransactions();
  }, [address]);

  // Función genérica para verificar transacciones antes de operaciones
  const verifyBeforeCartOperation = async (): Promise<boolean> => {
    if (cartError) {
      console.error("Cannot perform cart operations due to previous cart loading error");
      return false;
    }
    
    await checkPendingTransactions();
    
    if (pendingTransactions.length > 0) {
      alert(`No puedes modificar el carrito mientras tengas transacciones pendientes. 
             Por favor, completa o cancela las transacciones pendientes primero.`);
      return false;
    }
    return true;
  };

  // Función para guardar el carrito en el backend
  useEffect(() => {
    if (!address || !isWalletRegistered || cart.length === 0 || cartError) return;

    const saveCart = async () => {
      if (!await verifyBeforeCartOperation()) return;

      const payload = {
        wallet: address,
        items: cart.map((item: CartItem) => ({
          product_id: item.product.id,
          quantity: item.quantity
        }))
      };

      try {
        await authUserAxios.post(`${API_PATHS.payments}/save-cart`, payload);
      } catch (error) {
        console.error("Error sincronizando carrito:", error);
      }
    };

    saveCart();
  }, [cart, address, cartError]);


  // Operaciones del carrito
  const addToCart = async (product: Product) => {
    if (cartError || !await verifyBeforeCartOperation()) return;

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

  const removeFromCart = async (id: string) => {
    if (cartError || !await verifyBeforeCartOperation()) return;
    setCart(prev => prev.filter(item => item.product.id !== id));
  };

  const clearCart = async () => {
    if (!address || cartError) return;
    if (!await verifyBeforeCartOperation()) return;

    try {
      await authUserAxios.delete(`${API_PATHS.payments}/clear-cart/${address}`);
      setCart([]);
    } catch (err) {
      console.error("Error limpiando carrito en backend:", err);
    }
  };

  // Función para cargar el carrito desde el backend
  useEffect(() => {
    const loadCart = async () => {
      if (!address || !isWalletRegistered) return;
      
      setCartLoading(true);
      setCartError(false);
      try {
        const { data } = await authUserAxios.get(`${API_PATHS.payments}/get-cart/${address}`);

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
          if (data.error) {
            console.error("Error loading cart:", data.error);
            setCartError(true);
          }
        }
      } catch (err) {
        console.error("Error cargando carrito:", err);
        setCartError(true);
        setCart([]);
      } finally {
        setCartLoading(false);
      }
    };

    loadCart();
  }, [address, setCart, setCartLoading, isWalletRegistered]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        setCart,
        cartLoading,
        setCartLoading,
        pendingTransactions,
        checkPendingTransactions,
        cartError
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