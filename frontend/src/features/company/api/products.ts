import { Product } from "../types/Product";

let mockProducts: Product[] = [];

export async function fetchProducts(): Promise<Product[]> {
  return new Promise((resolve) => setTimeout(() => resolve(mockProducts), 300));
}

export async function createProduct(product: Product): Promise<void> {
  mockProducts.push({ ...product, id: crypto.randomUUID() });
}

export async function updateProduct(id: string, updated: Product): Promise<void> {
  mockProducts = mockProducts.map((p) => (p.id === id ? { ...updated, id } : p));
}

export async function deleteProduct(id: string): Promise<void> {
  mockProducts = mockProducts.filter((p) => p.id !== id);
}

