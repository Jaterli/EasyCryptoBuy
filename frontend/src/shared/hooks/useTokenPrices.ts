// src/features/user/hooks/useTokenPrices.ts
import { useEffect, useState } from "react";

const SUPPORTED_TOKENS = ["ethereum", "usd-coin", "tether", "chainlink"];
const CACHE_KEY = "token_prices_cache";
const CACHE_TTL_MS = 5 * 60 * 1000; // se cachea 5 minutos

function getCachedPrices(): { prices: Record<string, number>, timestamp: number } | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

function setCachedPrices(prices: Record<string, number>) {
  const data = {
    prices,
    timestamp: Date.now()
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
}

export function useTokenPrices() {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = getCachedPrices();
    const isValid = cached && (Date.now() - cached.timestamp < CACHE_TTL_MS);

    if (isValid) {
      setPrices(cached.prices);
      setLoading(false);
      return;
    }

    fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${SUPPORTED_TOKENS.join(",")}&vs_currencies=usd`)
      .then((res) => res.json())
      .then((data) => {
        const newPrices = {
          ETH: data["ethereum"].usd,
          USDC: data["usd-coin"].usd,
          USDT: data["tether"].usd,
          LINK: data["chainlink"].usd,
        };
        setCachedPrices(newPrices);
        setPrices(newPrices);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { prices, loading };
}
