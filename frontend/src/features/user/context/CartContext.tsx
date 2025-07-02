import { createContext, useContext, useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ApiCartItem, CartContextType, CartItem, Product } from "@/shared/types/types";
import { useWallet } from "@/features/user/hooks/useWallet";
import { axiosUserAPI } from "../services/userApi";

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isWalletRegistered } = useWallet();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState<boolean>(true);
  const [cartError, setCartError] = useState<boolean>(false);
  const { address } = useAccount();

  // Verificar transacciones pendientes
  const checkPendingTransactions = async () => {
    if (!address || !isWalletRegistered) {
      return [];
    }
    
    try {
      console.log("Comprobando si hay transacciones pendientes...");
      const { data } = await axiosUserAPI.checkPendingTransactions(address);
      
      if (data.success) {
        return data.transactions || [];
      } else {
        console.error("Error checking pending transactions:", data.message);
      }
    } catch (err) {
      console.error("Error verificando transacciones pendientes:", err);
    }
    return [];
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
    
    const pending = await checkPendingTransactions();
    
    if (pending.length > 0) {
      alert(`No puedes modificar el carrito mientras tengas transacciones pendientes. 
             Por favor, completa o cancela las transacciones pendientes primero.`);
      return false;
    }
    return true;
  };

  // Guardar Carrito
  useEffect(() => {
    if (!address || !isWalletRegistered || cart.length === 0 || cartError) return;

     (async function () {
      const payload = {
        wallet: address,
        cart_items: cart.map((cart_item: CartItem) => ({
          product_id: cart_item.product.id,
          quantity: cart_item.quantity
        }))
      };

      console.log("Procediendo al guardado del carrito...");
      try {
        await axiosUserAPI.saveCart(payload);
      } catch (error) {
        console.error("Error sincronizando carrito:", error);
      }
    })();

  }, [cart, address]);


  // Operaciones del carrito
  const addToCart = async (product: Product) => {
    if (cartError || !await verifyBeforeCartOperation()) return;

    setCart(prev => {
      const existing = prev.find(cart_item => cart_item.product.id === product.id);
      if (existing) {
        if (existing.quantity < product.quantity) {
          return prev.map(cart_item =>
            cart_item.product.id === product.id
              ? { ...cart_item, quantity: cart_item.quantity + 1 }
              : cart_item
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
    const updatedCart = cart.filter(cart_item => cart_item.product.id !== id);
    if (updatedCart.length > 0){
      setCart(updatedCart);    
    } else {
      clearCart();
    }
  };

  const clearCart = async () => {
    if (!address || cartError) return;
    if (!await verifyBeforeCartOperation()) return;

    try {
      await axiosUserAPI.clearCart(address);
      setCart([]);
      console.log("Carrito limpiado.");
    } catch (err) {
      console.error("Error limpiando carrito en backend:", err);
    }
  };

  useEffect(() => {
    if (!isWalletRegistered || !address) {
      localStorage.setItem("guest_cart", JSON.stringify(cart));
    }
  }, [cart, isWalletRegistered, address]);

  // Función para cargar el carrito desde el backend
  useEffect(() => {
    const loadCart = async () => {
      if (!address || !isWalletRegistered) return;
      console.log("Cargando carrito...")
      // Si existe carrito local y no hay carrito cargado aún desde backend
      const guestCartString = localStorage.getItem("guest_cart");
      if (guestCartString) {
        try {
          const guestCart: CartItem[] = JSON.parse(guestCartString);
          if (guestCart.length > 0) {
            setCart(guestCart); // actualizamos el estado local
            // Luego sincronizamos con el backend
            const payload = {
              wallet: address,
              cart_items: guestCart.map((cart_item: CartItem) => ({
                product_id: cart_item.product.id,
                quantity: cart_item.quantity
              }))
            };
            await axiosUserAPI.saveCart(payload);
            localStorage.removeItem("guest_cart");
          }
        } catch (e) {
          console.error("Error sincronizando carrito de invitado:", e);
        }
      }

      setCartLoading(true);
      setCartError(false);
      try {
        const { data } = await axiosUserAPI.getCart(address);

        if (Array.isArray(data?.cart_items)) {
          const restored = data.cart_items.map((cart_item: ApiCartItem) => ({
            product: {
              id: cart_item.product.id,
              name: cart_item.product.name,
              description: cart_item.product.description,
              amount_usd: cart_item.product.amount_usd
            },
            quantity: cart_item.quantity
          }));
          console.log("Carrito cargado.");
          setCart(restored);
        } else {
          console.log("Carrito vacío.");
          setCart([]);
          if (data.error) {
            console.error("Error al cargar el carrito: ", data.error);
            setCartError(true);
          }
        }
      } catch (err) {
        console.error("Error al cargar el carrito: ", err);
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