import React, { useState, useRef } from "react";
import {
  Button,
  Field,
  Fieldset,
  Flex,
  Input,
  NumberInput,
  Stack,
  Textarea,
  Image,
  Box,
  Text,
} from "@chakra-ui/react";
import { Product } from "@/shared/types/types";

interface Props {
  initialData?: Product;
  onSubmit: (product: FormData) => void;
  onCancel: () => void;
}

export const ProductForm: React.FC<Props> = ({ initialData, onSubmit, onCancel }) => {
  const [product, setProduct] = useState<Partial<Product>>(
    initialData || { 
      name: '', 
      description: '', 
      amount_usd: 0, 
      stock_quantity: 0, 
      category: '',
      image: null 
    }
  );
  
  // Simplificado: un solo estado para strings de números
  const [numericFields, setNumericFields] = useState({
    amountStr: String(initialData?.amount_usd ?? '0'),
    quantityStr: String(initialData?.stock_quantity ?? '0')
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProduct(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Simplificado: función genérica para manejar cambios numéricos
  const handleNumericChange = (field: 'amount_usd' | 'stock_quantity', value: string, isFloat: boolean = false) => {
    setNumericFields(prev => ({
      ...prev,
      [`${field === 'amount_usd' ? 'amountStr' : 'quantityStr'}`]: value
    }));
    
    const numericValue = isFloat ? parseFloat(value) : parseInt(value, 10);
    if (!isNaN(numericValue)) {
      setProduct(prev => ({ ...prev, [field]: numericValue }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    const formData = new FormData();
    const fields: (keyof Omit<Product, 'image' | 'id'>)[] = ['name', 'description', 'category'];
    
    fields.forEach(field => {
      formData.append(field, product[field] as string || '');
    });
    
    formData.append('amount_usd', String(product.amount_usd ?? 0));
    formData.append('stock_quantity', String(product.stock_quantity ?? 0));
    
    if (imageFile) formData.append('image', imageFile);
    
    onSubmit(formData);
  };

  return (
    <Fieldset.Root maxW="md" className="form">
      <Stack spaceY={4}>
        <Fieldset.Legend fontSize="xl" mb="5">
          {initialData ? "Editar Producto" : "Nuevo Producto"}
        </Fieldset.Legend>
        
        {['name', 'description', 'category'].map((field) => (
          <Field.Root key={field}>
            <Field.Label>{field === 'name' ? 'Nombre' : field === 'description' ? 'Descripción' : 'Categoría'}</Field.Label>
          {field === 'description' ? (
              <Textarea
                name={field}
                value={product[field as keyof Product] as string || ''}
                onChange={handleInputChange}
                resize="vertical"
                rows={4}
              />
            ) : (
              <Input 
                name={field}
                value={product[field as keyof Product] as string || ''}
                onChange={handleInputChange}
              />
            )}
          </Field.Root>
        ))}
        
        <Field.Root>
          <Field.Label>Imagen del producto</Field.Label>
          <Box
            borderWidth={2}
            borderStyle="dashed"
            borderRadius="md"
            p={4}
            textAlign="center"
            cursor="pointer"
            onClick={() => fileInputRef.current?.click()}
            _hover={{ bg: "gray.50" }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
            {imagePreview ? (
              <Image
                src={imagePreview}
                alt="Preview"
                maxH="150px"
                mx="auto"
                objectFit="contain"
              />
            ) : (
              <Text color="gray.500">Haz clic para seleccionar una imagen</Text>
            )}
          </Box>
        </Field.Root>
        
        <Flex justifyContent="space-between" alignItems="center" gap={4} mb={4}>
          <Field.Root>
            <Field.Label>Monto (USD)</Field.Label>
            <NumberInput.Root
              value={numericFields.amountStr}
              onValueChange={(e) => handleNumericChange('amount_usd', e.value, true)}
              min={0}
              step={0.01}
              formatOptions={{
                style: "decimal",
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              }}
            >
              <NumberInput.Control />
              <NumberInput.Input name="amount_usd" />
            </NumberInput.Root>
          </Field.Root>        
          
          <Field.Root>
            <Field.Label>Cantidad</Field.Label>
            <NumberInput.Root
              value={numericFields.quantityStr}
              onValueChange={(e) => handleNumericChange('stock_quantity', e.value, false)}
              min={0}
              step={1}
            >
              <NumberInput.Control />
              <NumberInput.Input name="stock_quantity" />
            </NumberInput.Root>
          </Field.Root>
        </Flex>
        
        <Stack direction="row" spaceX={4} mt={4}>
          <Button colorPalette="blue" onClick={handleSubmit}>
            {initialData ? "Actualizar" : "Guardar"}
          </Button>
          <Button onClick={onCancel}>Cancelar</Button>
        </Stack>
      </Stack>
    </Fieldset.Root>
  );
};