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
  Center,
  Spinner,
  Alert,
  Input,
  HStack,
  VStack,
  Button,
} from "@chakra-ui/react";
import { ProductForm } from "./ProductForm";
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
import { Product } from "@/shared/types/types";
import { authCompanyAPI } from "../services/companyApi";

const itemsPerPageOptions = createListCollection({
  items: [
    { label: "10 por página", value: "10" },
    { label: "20 por página", value: "20" },
    { label: "30 por página", value: "30" },
  ],
});

export const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { open: isDialogOpen, onOpen, onClose } = useDisclosure();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);

  // Productos paginados (usando filteredProducts en lugar de products)
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Crear colección para Select de categorías
  const categoryCollection = createListCollection({
    items: categories.map((cat) => ({
      label: cat === "all" ? "Todas las categorías" : cat,
      value: cat,
    })),
  });

  const loadProducts = async () => {
    setIsLoading(true);
    try{ 
      const data = await authCompanyAPI.getProducts();
      setProducts(data);
      setFilteredProducts(data);
      
      // Extraer categorías únicas
      const uniqueCategories = Array.from(
        new Set(data.map((p) => p.category).filter(Boolean))
      ).sort();
      setCategories(["all", ...uniqueCategories]);
      
      setSelectedProducts([]);

      if (currentPage > Math.ceil(data.length / itemsPerPage)) {
        setCurrentPage(1);
      }
    } catch(err) {
      setError(err instanceof Error ? err.message : "Error al cargar los productos");
    } finally {
      setIsLoading(false);
   }   
  };

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...products];

    // Filtrar por categoría
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    // Filtrar por término de búsqueda
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(term) ||
          product.description?.toLowerCase().includes(term)
      );
    }

    setFilteredProducts(filtered);
    setCurrentPage(1); // Resetear a primera página cuando cambian los filtros
    setSelectedProducts([]); // Limpiar selección al filtrar
  }, [searchTerm, selectedCategory, products]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
  };

  const handleSave = async (formData: FormData) => {
    try {
      if (editingProduct) {
        await authCompanyAPI.updateProduct(editingProduct.id, formData);
      } else {
        await authCompanyAPI.createProduct(formData);
      }
      onClose();
      setEditingProduct(undefined);
      await loadProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      setError(error instanceof Error ? error.message : "Error al guardar el producto");
    }
  };

  const handleDelete = async (id: string) => {
    await authCompanyAPI.deleteProduct(id);
    loadProducts();
  };

  const handleDeleteSelected = async () => {
    await Promise.all(selectedProducts.map(id => authCompanyAPI.deleteProduct(id)));
    loadProducts();
  };

  const hasSelection = selectedProducts.length > 0;
  const isIndeterminate = hasSelection && selectedProducts.length < filteredProducts.length;

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
        direction={{ base: "column", md: "row" }} 
        justify="space-between" 
        align={{ base: "stretch", md: "center" }} 
        mb={4}
        gap={3}
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

      {/* Barra de filtros */}
      <VStack align="stretch" mb={6} gap={4}>
        <HStack gap={4} flexWrap="wrap">
          <Box flex="2" minW="200px">
            <Input
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Box>

          <Box flex="1" minW="200px">
            <Select.Root
              collection={categoryCollection}
              value={[selectedCategory]}
              onValueChange={(e) => setSelectedCategory(e.value[0])}
              size="md"
            >
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder="Filtrar por categoría" />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content>
                    {categoryCollection.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        {item.label}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
          </Box>

          {(searchTerm || selectedCategory !== "all") && (
            <Button onClick={handleResetFilters} variant="ghost" size="sm">
              Limpiar filtros
            </Button>
          )}
        </HStack>

        {/* Resultados encontrados */}
        <Text fontSize="sm" color="gray.500">
          {filteredProducts.length} producto(s) encontrado(s)
        </Text>
      </VStack>
      
      {isLoading ? (
        <Center py={10}>
          <Spinner size="xl" color="blue.500" />
        </Center>
      ) : error ? (
        <Alert.Root status="error" mb={4}>
          <Alert.Indicator />
          <Alert.Title>{error}</Alert.Title>
        </Alert.Root>
      ) : filteredProducts.length === 0 ? (
        <Box textAlign="center" py={10}>
          <Text fontSize="lg" color="gray.500" mb={4}>
            No se encontraron productos con los filtros seleccionados.
          </Text>
          <Button onClick={handleResetFilters} variant="outline">
            Ver todos los productos
          </Button>
        </Box>
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
                        ${product.amount_usd.toLocaleString('en-US', {
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

          <Flex justify="space-between" align="center" mt={4} flexWrap="wrap" gap={2}>
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
                Página {currentPage} de {totalPages || 1}
              </Text>
              <IconButton
                aria-label="Página siguiente"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
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