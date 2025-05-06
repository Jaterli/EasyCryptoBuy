import React, { useState } from "react";
import {
  Button,
  Field,
  Fieldset,
  Flex,
  Input,
  NumberInput,
  Stack,
  Textarea,
} from "@chakra-ui/react";
import { Product } from "@/shared/types/types";

interface Props {
  initialData?: Product;
  onSubmit: (product: Product) => void;
  onCancel: () => void;
}

export const ProductForm: React.FC<Props> = ({ initialData, onSubmit, onCancel }) => {
  const [product, setProduct] = useState<Product>(
    initialData || { id: '', name: '', description: '', amount_usd: 0, quantity: 0 }
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProduct({ ...product, [e.target.name]: parseFloat(e.target.value) });
  };

  const handleSubmit = () => {
    onSubmit(product);
  };

  return (
    <Fieldset.Root maxW="md" className="form">
      <Stack spaceY={4}>
        <Fieldset.Legend fontSize="xl" mb="5">{initialData ? "Editar Producto" : "Nuevo Producto"}</Fieldset.Legend>
        
        <Field.Root>
          <Field.Label>Nombre</Field.Label>
          <Input 
            name="name" 
            value={product.name} 
            onChange={handleInputChange} 
          />
        </Field.Root>

        <Field.Root>
          <Field.Label>Descripción</Field.Label>
          <Textarea
            name="description"
            value={product.description}
            onChange={handleTextareaChange}
            resize="vertical"
            rows={4}
          />
        </Field.Root>
        
        <Flex justifyContent="space-between" alignItems="center" gap={4} mb={4}>
          <Field.Root>
            <Field.Label>Monto (USD)</Field.Label>
            <NumberInput.Root
              value={product.amount_usd.toString()}
              onChange={handleNumberChange}
              min={0}
              step={1.00}
              formatOptions={{
                style: "currency",
                currency: "USD",
                currencyDisplay: "code",
                currencySign: "accounting",
              }}
            >
              <NumberInput.Control />
              <NumberInput.Input name="amount_usd" />
            </NumberInput.Root>
          </Field.Root>        
          
          <Field.Root>
            <Field.Label>Cantidad</Field.Label>
            <NumberInput.Root
              value={product.quantity.toString()}
              onChange={handleNumberChange}
              min={0}
            >
              <NumberInput.Control />
              <NumberInput.Input name="quantity" />
            </NumberInput.Root>
          </Field.Root>
        </Flex>
        <Stack direction="row" spaceX={4} mt={4}>
          <Button colorPalette="blue" onClick={handleSubmit}>
            {initialData ? "Actualizar" : "Guardar"}
          </Button>
          <Button onClick={onCancel}>
            Cancelar
          </Button>
        </Stack>
      </Stack>
    </Fieldset.Root>
  );
};