import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Heading,
  Stack,
  Table,
  useDisclosure,
  Text,
  Dialog,
  Portal,
  CloseButton,
  Flex,
  ActionBar,
  Checkbox,
  Kbd,
  IconButton,
  Select,
  createListCollection,
} from "@chakra-ui/react";
import { Product } from "../types/Product";
import * as api from "../api/products";
import { ProductForm } from "./ProductForm";


const itemsPerPageOptions = createListCollection({
  items: [
    { label: "5 por página", value: "5" },
    { label: "10 por página", value: "10" },
    { label: "20 por página", value: "20" },
  ],
});


export const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(2);
  const { open: isDialogOpen, onOpen, onClose } = useDisclosure();

  // Calcular productos para la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = products.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(products.length / itemsPerPage);

  const loadProducts = async () => {
    const data = await api.fetchProducts();
    setProducts(data);
    setSelectedProducts([]);
    // Resetear a primera página si la página actual ya no existe
    if (currentPage > Math.ceil(data.length / itemsPerPage)) {
      setCurrentPage(1);
    }
  };

  const handleSave = async (product: Product) => {
    if (product.id) {
      await api.updateProduct(product.id, product);
    } else {
      await api.createProduct(product);
    }
    onClose();
    loadProducts();
  };

  const handleDelete = async (id: string) => {
    await api.deleteProduct(id);
    loadProducts();
  };

  const handleDeleteSelected = async () => {
    await Promise.all(selectedProducts.map(id => api.deleteProduct(id)));
    loadProducts();
  };

  const hasSelection = selectedProducts.length > 0;
  const isIndeterminate = hasSelection && selectedProducts.length < products.length;

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <Box p={4}>
      <Stack spaceX={6}>
        <Dialog.Root
          open={isDialogOpen}
          onOpenChange={(e) => {
            if (!e.open) {
              setEditingProduct(undefined);
              onClose();
            }
          }}
        >
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content>
                <Dialog.Header>
                  <Dialog.Title>
                    {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                  </Dialog.Title>
                  <Dialog.CloseTrigger asChild>
                    <CloseButton size="sm" />
                  </Dialog.CloseTrigger>
                </Dialog.Header>
                <Dialog.Body>
                  <ProductForm
                    initialData={editingProduct}
                    onSubmit={handleSave}
                    onCancel={onClose}
                  />
                </Dialog.Body>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>

        <Flex justifyContent="space-between" alignItems="center" mb={4}>
          <Heading size="xl">Lista de Productos</Heading>
          <Button 
            onClick={() => { 
              setEditingProduct(undefined); 
              onOpen(); 
            }} 
            colorPalette="green"
          >
            Nuevo Producto
          </Button>
        </Flex>

        {products.length === 0 ? (
          <Text fontSize="lg" color="gray.500" textAlign="center" py={10}>
            No se han encontrado productos. Crea uno nuevo para empezar.
          </Text>
        ) : (
          <>
            <Table.Root size="md" variant="outline" striped interactive>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader w="8">
                    <Checkbox.Root
                      size="sm"
                      aria-label="Select all products"
                      checked={isIndeterminate ? "indeterminate" : hasSelection}
                      onCheckedChange={(changes) => {
                        setSelectedProducts(
                          changes.checked ? currentProducts.map(p => p.id) : []
                        );
                      }}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control />
                    </Checkbox.Root>
                  </Table.ColumnHeader>
                  <Table.ColumnHeader>Nombre</Table.ColumnHeader>
                  <Table.ColumnHeader>Descripción</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">Monto (USD)</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">Cantidad</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center">Acciones</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              
              <Table.Body>
                {currentProducts.map((product) => (
                  <Table.Row 
                    key={product.id}
                    data-selected={selectedProducts.includes(product.id) ? "" : undefined}
                  >
                    <Table.Cell>
                      <Checkbox.Root
                        size="sm"
                        aria-label="Select product"
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={(changes) => {
                          setSelectedProducts(prev =>
                            changes.checked
                              ? [...prev, product.id]
                              : prev.filter(id => id !== product.id)
                          );
                        }}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                      </Checkbox.Root>
                    </Table.Cell>
                    <Table.Cell fontWeight="medium">{product.name}</Table.Cell>
                    <Table.Cell>{product.description}</Table.Cell>
                    <Table.Cell textAlign="end">
                      {product.amount_usd.toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      })}
                    </Table.Cell>
                    <Table.Cell textAlign="end">{product.quantity}</Table.Cell>
                    <Table.Cell>
                      <Stack direction="row" spaceX={2} justifyContent="center">
                        <Button 
                          size="sm" 
                          colorPalette="blue"
                          variant="outline" 
                          onClick={() => { setEditingProduct(product); onOpen(); }}
                        >
                          Editar
                        </Button>
                        <Button 
                          size="sm" 
                          colorPalette="red" 
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

            {/* Controles de paginación */}
            <Flex justifyContent="space-between" alignItems="center" mt={4}>
              <Flex gap={2} alignItems="center">
                <IconButton
                  aria-label="Página anterior"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  size="sm"
                >
                  ←
                </IconButton>
                
                <Text fontSize="sm">
                  Página {currentPage} de {totalPages}
                </Text>

                <IconButton
                  aria-label="Página siguiente"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  size="sm"
                >
                  →
                </IconButton>
              </Flex>

              <Select.Root
                collection={itemsPerPageOptions}
                value={[itemsPerPage.toString()]}
                onValueChange={({ value }) => {
                  setItemsPerPage(Number(value[0]));
                  setCurrentPage(1);
                }}
                size="sm"
                width="140px"
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder="Items por página" />
                  </Select.Trigger>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {itemsPerPageOptions.items.map((option) => (
                        <Select.Item key={option.value} item={option}>
                          {option.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>            
              </Flex>
          </>
        )}
      </Stack>

      <ActionBar.Root open={hasSelection}>
        <Portal>
          <ActionBar.Positioner>
            <ActionBar.Content>
              <ActionBar.SelectionTrigger>
                {selectedProducts.length} seleccionados
              </ActionBar.SelectionTrigger>
              <ActionBar.Separator />
              <Button 
                variant="outline" 
                size="sm"
                colorPalette="red"
                onClick={handleDeleteSelected}
              >
                Eliminar <Kbd>⌫</Kbd>
              </Button>
            </ActionBar.Content>
          </ActionBar.Positioner>
        </Portal>
      </ActionBar.Root>
    </Box>
  );
};