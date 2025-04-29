import { useEffect } from "react";
import { useAccount } from "wagmi";
import { API_PATHS } from "@/config/paths";
import { useCart } from "../context/CartContext";
import { CartItem } from "@/shared/types/CartItem";

interface ApiCartItem {
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
}

export const useCartSync = () => {
  const { cart, setCart } = useCart();
  const { address } = useAccount();

  // Guardar carrito
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

  // Restaurar carrito al cargar
  useEffect(() => {
    const loadCart = async () => {
      if (!address) return;

      try {
        const res = await fetch(`${API_PATHS.payments}/get-cart/${address}`);
        const data = await res.json();

        if (data && data.items) {
          const restored = data.items.map((item: ApiCartItem) => ({
            product: {
              id: item.product_id,
              name: item.product_name,
              amount_usd: item.product_price
            },
            quantity: item.quantity
          }));

          setCart(restored);
        }
      } catch (err) {
        console.error("Error cargando carrito:", err);
      }
    };

    loadCart();
  }, [address, setCart]);
};