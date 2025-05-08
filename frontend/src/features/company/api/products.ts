import { API_PATHS } from "@/config/paths";
import { Product } from "@/shared/types/types";
import { authAxios } from "../auth/api/authAdminAxios";

const API_PRODUCTS = `${API_PATHS.company}/products/`;

export async function fetchProducts(): Promise<Product[]> {
  try {
    const { data } = await authAxios.get(API_PRODUCTS);
    return data;
  } catch (error) {
    throw new Error("Error al obtener productos. "+error);
  }
}

export async function createProduct(product: Omit<Product, "id">): Promise<void> {
  try {
    await authAxios.post(API_PRODUCTS, product);
  } catch (error) {
    throw new Error("Error al crear producto. "+error);
  }
}

export async function updateProduct(id: string, product: Product): Promise<void> {
  try {
    await authAxios.put(`${API_PRODUCTS}${id}/`, product);
  } catch (error) {
    throw new Error("Error al actualizar producto. "+error);
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    await authAxios.delete(`${API_PRODUCTS}${id}/`);
  } catch (error) {
    throw new Error("Error al eliminar producto. "+error);
  }
}