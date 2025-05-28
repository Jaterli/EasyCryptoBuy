import { API_PATHS } from "@/config/paths";
import { useEffect, useState } from "react";

export function useEthPrice(currency: string = "usd") {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_PATHS.payments}/eth-to-fiat/?currency=${currency}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPrice(data.price);
        }
      })
      .catch((err) => console.error("Error al obtener precio ETH:", err))
      .finally(() => setLoading(false));
  }, [currency]);

  return { price, loading };
}






