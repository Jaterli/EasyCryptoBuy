import React, { useState } from "react";
import {
  Button,
  Field,
  Fieldset,
  Input,
  NumberInput,
  Stack,
} from "@chakra-ui/react";
import { Product } from "../types/Product";

interface Props {
  initialData?: Product;
  onSubmit: (product: Product) => void;
  onCancel: () => void;
}

export const ProductForm: React.FC<Props> = ({ initialData, onSubmit, onCancel }) => {
  const [product, setProduct] = useState<Product>(
    initialData || { id: '', name: '', description: '', amountUSD: 0, quantity: 0 }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleNumberChange = (name: keyof Product, value: string) => {
    setProduct({ ...product, [name]: parseFloat(value) || 0 });
  };

  const handleSubmit = () => {
    onSubmit(product);
  };

  return (
    <Fieldset.Root maxW="md">
      <Stack spaceX={4}>
        <Fieldset.Legend fontSize="xl">{initialData ? "Editar Producto" : "Nuevo Producto"}</Fieldset.Legend>
        
        <Field.Root>
          <Field.Label>Nombre</Field.Label>
          <Input 
            name="name" 
            value={product.name} 
            onChange={handleChange} 
          />
        </Field.Root>

        <Field.Root>
          <Field.Label>Descripción</Field.Label>
          <Input 
            name="description" 
            value={product.description} 
            onChange={handleChange} 
          />
        </Field.Root>

        <Field.Root>
          <Field.Label>Monto (USD)</Field.Label>
          <NumberInput.Root
            value={product.amountUSD.toString()}
            onValueChange={(details) => handleNumberChange("amountUSD", details.value)}
            min={0}
            step={0.01}
            formatOptions={{
              style: "currency",
              currency: "USD"
            }}
          >
            <NumberInput.Control />
            <NumberInput.Input name="amountUSD" />
          </NumberInput.Root>
        </Field.Root>

        <Field.Root>
          <Field.Label>Cantidad</Field.Label>
          <NumberInput.Root
            value={product.quantity.toString()}
            onValueChange={(details) => handleNumberChange("quantity", details.value)}
            min={0}
          >
            <NumberInput.Control />
            <NumberInput.Input name="quantity" />
          </NumberInput.Root>
        </Field.Root>

        <Stack direction="row" spaceX={4} mt={4}>
          <Button colorScheme="blue" onClick={handleSubmit}>
            {initialData ? "Actualizar" : "Guardar"}
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </Stack>
      </Stack>
    </Fieldset.Root>
  );
};