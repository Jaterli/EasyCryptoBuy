import { authFetch } from "@/features/auth/api/authFetch";
import { Product } from "../types/Product";
import { API_PATHS } from "@/config/paths";

const API_PRODUCTS = `${API_PATHS.company}/products/`;

export async function fetchProducts(): Promise<Product[]> {
  const res = await authFetch(API_PRODUCTS);
  if (!res.ok) throw new Error("Error al obtener productos");
  return res.json();
}


export async function createProduct(product: Omit<Product, "id">): Promise<void> {
  const res = await authFetch(API_PRODUCTS, {
    method: "POST",
    body: JSON.stringify(product),
  });
  if (!res.ok) throw new Error("Error al crear producto");
}

export async function updateProduct(id: string, product: Product): Promise<void> {
  const res = await authFetch(`${API_PRODUCTS}${id}/`, {
    method: "PUT",
    body: JSON.stringify(product),
  });
  
  if (!res.ok) throw new Error("Error al actualizar producto");
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await authFetch(`${API_PRODUCTS}${id}/`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error al eliminar producto");
}
