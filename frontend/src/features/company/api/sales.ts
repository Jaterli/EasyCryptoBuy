import { Sale } from "../types/Sale";

export async function fetchSales(): Promise<Sale[]> {
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve([
          {
            id: "1",
            productId: "A1",
            productName: "Token Course",
            customerName: "Alice",
            customerWallet: "0x123...abcd",
            usdPrice: 49.99,
            tokenSymbol: "DAI",
            tokenAmount: 50,
            date: new Date().toISOString(),
          },
        ]),
      300
    )
  );
}
