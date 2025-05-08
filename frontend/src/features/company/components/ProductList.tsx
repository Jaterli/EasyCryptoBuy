import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Table,
  useDisclosure,
  Text,
  Dialog,
  Portal,
  CloseButton,
  Flex,
  ActionBar,
  Checkbox,
  IconButton,
  Select,
  createListCollection,
} from "@chakra-ui/react";
import * as api from "../api/products";
import { ProductForm } from "./ProductForm";
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
import { Product } from "@/shared/types/types";

const itemsPerPageOptions = createListCollection({
  items: [
    { label: "10 por página", value: "10" },
    { label: "20 por página", value: "20" },
    { label: "30 por página", value: "30" },
  ],
});

export const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { open: isDialogOpen, onOpen, onClose } = useDisclosure();

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = products.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(products.length / itemsPerPage);

  const loadProducts = async () => {
    const data = await api.fetchProducts();
    setProducts(data);
    setSelectedProducts([]);
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
    <Box p={{ base: 3, md: 5 }}>
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
                  Formulario de producto
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

      <Flex 
        direction="row" 
        justify="space-between" 
        align="center" 
        mb={4}
        gap={2}
      >
        <Heading size="xl" fontSize={{ base: "lg", md: "xl" }}>
          Lista de Productos
        </Heading>
        <IconButton
          aria-label="Nuevo Producto"
          colorPalette="green"
          variant="ghost"
          size={{ base: "sm", md: "md" }}
          onClick={() => {
            setEditingProduct(undefined);
            onOpen();
          }}
          >
          <FaPlus />
          </IconButton>
      </Flex>

      {products.length === 0 ? (
        <Text fontSize="md" color="gray.500" textAlign="center" py={6}>
          No se han encontrado productos.
        </Text>
      ) : (
        <>
          <Box overflowX="auto">
            <Table.Root variant="outline" className='products' size={{ base: "sm", md: "md" }}>
              <Table.Header>
                <Table.Row fontSize={{ base: "xs", md: "sm" }}>
                  <Table.ColumnHeader w="8">
                    <Checkbox.Root
                      size="sm"
                      aria-label="Select all"
                      variant="outline"
                      checked={isIndeterminate ? "indeterminate" : hasSelection}
                      onCheckedChange={(changes) => {
                        setSelectedProducts(changes.checked ? currentProducts.map(p => p.id) : []);
                      }}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control />
                    </Checkbox.Root>
                  </Table.ColumnHeader>
                  <Table.ColumnHeader>NOMBRE</Table.ColumnHeader>
                  <Table.ColumnHeader display={{ base: "none", md: "table-cell" }}>DESCRIPCIÓN</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">MONTO</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">CANTIDAD</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center">ACCIONES</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              
              <Table.Body>
                {currentProducts.map((product) => (
                  <Table.Row key={product.id} fontSize={{ base: "xs", md: "sm" }}>
                    <Table.Cell>
                      <Checkbox.Root
                        size="sm"
                        aria-label="Select product"
                        variant="outline"
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
                    <Table.Cell fontWeight="medium" maxW="150px" truncate>
                      {product.name}
                    </Table.Cell>
                    <Table.Cell display={{ base: "none", md: "table-cell" }} maxW="250px" truncate>
                      {product.description}
                    </Table.Cell>
                    <Table.Cell textAlign="end">
                      <Text fontSize={{ base: "sm", md: "md" }}>
                        {product.amount_usd.toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        })}
                      </Text>
                    </Table.Cell>
                    <Table.Cell textAlign="end">{product.quantity}</Table.Cell>
                    <Table.Cell>
                      <Flex justify="center" gap={2}>
                        <IconButton
                          aria-label="Editar"
                          size={{ base: "xs", md: "sm" }}
                          colorPalette="blue"
                          variant="ghost"
                          onClick={() => {
                            setEditingProduct(product);
                            onOpen();
                          }}
                          >
                          <FaEdit />
                        </IconButton>
                        <IconButton
                          aria-label="Eliminar"
                          size={{ base: "xs", md: "sm" }}
                          colorPalette="red"
                          variant="ghost"
                          onClick={() => handleDelete(product.id)}                          
                        >
                          <FaTrash />
                        </IconButton>
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>

          <Flex justify="space-between" align="center" mt={4}>
            <Flex gap={2} align="center">
              <IconButton
                aria-label="Página anterior"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                size="sm"
                variant="ghost"
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
                variant="ghost"
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
              width="150px"
            >
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder="Items por página" />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content>
                    {itemsPerPageOptions.items.map((option) => (
                      <Select.Item key={option.value} item={option}>
                        {option.label}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
          </Flex>
        </>
      )}

      <ActionBar.Root open={hasSelection}>
        <Portal>
          <ActionBar.Positioner>
            <ActionBar.Content>
              <ActionBar.SelectionTrigger>
                {selectedProducts.length} seleccionados
              </ActionBar.SelectionTrigger>
              <ActionBar.Separator />
              <IconButton
                aria-label="Eliminar selección"
                colorPalette="red"
                variant="ghost"
                size="sm"
                onClick={handleDeleteSelected}
              >
                <FaTrash />
              </IconButton>
            </ActionBar.Content>
          </ActionBar.Positioner>
        </Portal>
      </ActionBar.Root>
    </Box>
  );
};