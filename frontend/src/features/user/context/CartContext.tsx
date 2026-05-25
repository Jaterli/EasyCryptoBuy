import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAccount } from "wagmi";
import { CartContextType, CartItem, Product } from "@/shared/types/types";
import { useWallet } from "@/features/user/hooks/useWallet";

const CART_STORAGE_KEY = "shopping_cart";

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isWalletRegistered } = useWallet();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState<boolean>(true);
  const [cartError, setCartError] = useState<boolean>(false);
  const { address } = useAccount();
  const isInitialLoadDone = useRef(false);

  // Función para guardar en localStorage
  const persistCart = useCallback((cartData: CartItem[]) => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
    } catch (error) {
      console.error("Error guardando carrito en localStorage:", error);
    }
  }, []);

  // Función para cargar desde localStorage
  const loadFromLocalStorage = useCallback((): CartItem[] => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (storedCart) {
        return JSON.parse(storedCart);
      }
    } catch (error) {
      console.error("Error cargando carrito desde localStorage:", error);
    }
    return [];
  }, []);


  const verifyBeforeCartOperation = useCallback(async (): Promise<boolean> => {
    if (cartError) {
      console.error("No se puede modificar el carrito por error previo");
      return false;
    }
    // Eliminamos la verificación de transacciones pendientes para el carrito local
    return true;
  }, [cartError]);

  const addToCart = useCallback(async (product: Product) => {
    if (!await verifyBeforeCartOperation()) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      const currentQty = existing?.quantity || 0;
      
      // Verificar stock disponible
      if (currentQty >= product.stock_quantity) {
        alert(`No hay suficiente stock. Máximo disponible: ${product.stock_quantity} unidades`);
        return prev;
      }
      
      let newCart;
      if (existing) {
        newCart = prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newCart = [...prev, { product, quantity: 1 }];
      }
      
      // Persistir en localStorage
      persistCart(newCart);
      return newCart;
    });
  }, [verifyBeforeCartOperation, persistCart]);

  const removeFromCart = useCallback(async (productId: string) => {
    if (!await verifyBeforeCartOperation()) return;
    
    setCart(prev => {
      const newCart = prev.filter(item => item.product.id !== productId);
      persistCart(newCart);
      return newCart;
    });
  }, [verifyBeforeCartOperation, persistCart]);

  const updateQuantity = useCallback(async (productId: string, newQuantity: number) => {
    if (!await verifyBeforeCartOperation()) return;
    
    if (newQuantity <= 0) {
      await removeFromCart(productId);
      return;
    }
    
    setCart(prev => {
      const item = prev.find(i => i.product.id === productId);
      if (!item) return prev;
      
      // Verificar que no exceda el stock disponible
      if (newQuantity > item.product.stock_quantity) {
        alert(`No puedes agregar más de ${item.product.stock_quantity} unidades de "${item.product.name}"`);
        const updatedCart = prev.map(i =>
          i.product.id === productId
            ? { ...i, quantity: item.product.stock_quantity }
            : i
        );
        persistCart(updatedCart);
        return updatedCart;
      }
      
      const updatedCart = prev.map(i =>
        i.product.id === productId
          ? { ...i, quantity: newQuantity }
          : i
      );
      persistCart(updatedCart);
      return updatedCart;
    });
  }, [verifyBeforeCartOperation, removeFromCart, persistCart]);

  const clearCart = useCallback(async () => {
    setCart([]);
    persistCart([]);
  }, [persistCart]);

  // Cargar carrito desde localStorage al iniciar
  useEffect(() => {
    const loadCart = async () => {
      setCartLoading(true);
      setCartError(false);
      
      try {
        const storedCart = loadFromLocalStorage();
        
        // Validar que los productos en el carrito aún tengan stock disponible
        // Esto es importante para evitar que el usuario compre productos sin stock
        const validatedCart = storedCart.filter(item => {
          if (item.product.stock_quantity <= 0) {
            console.warn(`Producto ${item.product.name} sin stock, eliminando del carrito`);
            return false;
          }
          if (item.quantity > item.product.stock_quantity) {
            console.warn(`Ajustando cantidad de ${item.product.name} de ${item.quantity} a ${item.product.stock_quantity}`);
            item.quantity = item.product.stock_quantity;
          }
          return true;
        });
        
        if (validatedCart.length !== storedCart.length) {
          persistCart(validatedCart);
        }
        
        setCart(validatedCart);
      } catch (err) {
        console.error("Error cargando carrito:", err);
        setCartError(true);
        setCart([]);
      } finally {
        setCartLoading(false);
        isInitialLoadDone.current = true;
      }
    };

    loadCart();
  }, [loadFromLocalStorage, persistCart]);

  // Opcional: Sincronizar carrito cuando cambia la wallet
  // Puedes decidir si quieres mantener el mismo carrito al cambiar de wallet
  // o preguntar al usuario si quiere migrar
  useEffect(() => {
    if (address && isWalletRegistered && isInitialLoadDone.current) {
      // Si quieres mantener el carrito al cambiar de wallet, no hagas nada
      // Si quieres cargar un carrito específico por wallet, puedes implementarlo aquí
      console.log(`Wallet conectada: ${address}, carrito actual:`, cart);
    }
  }, [address, isWalletRegistered, cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        setCart,
        updateQuantity,
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