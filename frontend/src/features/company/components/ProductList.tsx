import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Heading,
  Stack,
  Table,
  useDisclosure,
} from "@chakra-ui/react";
import { Product } from "../types/Product";
import * as api from "../api/products";
import { ProductForm } from "./ProductForm";

export const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const { open, onOpen, onClose } = useDisclosure();

  const loadProducts = async () => {
    const data = await api.fetchProducts();
    setProducts(data);
  };

  const handleSave = async (product: Product) => {
    if (product.id) {
      await api.updateProduct(product.id, product);
    } else {
      await api.createProduct(product);
    }
    setEditingProduct(undefined);
    onClose();
    loadProducts();
  };

  const handleDelete = async (id: string) => {
    await api.deleteProduct(id);
    loadProducts();
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <Box p={4}>
      <Stack spaceX={6}>
        <Heading size="xl">Lista de Productos</Heading>
        
        {open && (
          <ProductForm
            initialData={editingProduct}
            onSubmit={handleSave}
            onCancel={() => {
              setEditingProduct(undefined);
              onClose();
            }}
          />
        )}
        
        <Button 
          onClick={() => { setEditingProduct(undefined); onOpen(); }} 
          colorScheme="green"
          alignSelf="flex-start"
        >
          Nuevo Producto
        </Button>

        <Table.Root size="md" variant="outline" striped interactive>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Nombre</Table.ColumnHeader>
              <Table.ColumnHeader>Descripción</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Monto (USD)</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Cantidad</Table.ColumnHeader>
              <Table.ColumnHeader>Acciones</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          
          <Table.Body>
            {products.map((product) => (
              <Table.Row key={product.id}>
                <Table.Cell fontWeight="medium">{product.name}</Table.Cell>
                <Table.Cell>{product.description}</Table.Cell>
                <Table.Cell textAlign="end">
                  {product.amountUSD.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  })}
                </Table.Cell>
                <Table.Cell textAlign="end">{product.quantity}</Table.Cell>
                <Table.Cell>
                  <Stack direction="row" spaceX={2}>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => { setEditingProduct(product); onOpen(); }}
                    >
                      Editar
                    </Button>
                    <Button 
                      size="sm" 
                      colorScheme="red" 
                      variant="outline"
                      onClick={() => handleDelete(product.id)}
                    >
                      Eliminar
                    </Button>
                  </Stack>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Stack>
    </Box>
  );
};