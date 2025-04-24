import { Button, Input, Stack, Flex, Field, Fieldset, Box } from "@chakra-ui/react";
import { useForm } from "react-hook-form";

interface FormValues {
  name: string;
  email: string;
}

interface UserFormProps {
  onSubmit: (data: FormValues) => void;
}

const UserForm = ({ onSubmit }: UserFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)} className="user-form">
      <Fieldset.Root size="lg" maxW="md">
        <Stack spaceY={3}>
          {/* Campo para el nombre */}
          <Fieldset.Content>
          <Field.Root invalid={!!errors.name} className="field">
            <Field.Label className="field-label">Nombre</Field.Label>
            <Input
              variant="outline" 
              placeholder="Ingresa tu nombre"
              {...register("name", { required: "El nombre es obligatorio" })}
            />
            <Field.ErrorText className="field-error">{errors.name?.message}</Field.ErrorText>
            </Field.Root>
            </Fieldset.Content>

          {/* Campo para el correo electrónico */}
          <Fieldset.Content>
          <Field.Root invalid={!!errors.email}>
            <Field.Label className="field-label">Correo electrónico</Field.Label>
            <Input
              variant="outline"
              placeholder="Ingresa tu correo electrónico"
              {...register("email", {
                required: "El correo es obligatorio",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Correo electrónico no válido",
                },
              })}            
            />
            <Field.ErrorText className="field-error">{errors.email?.message}</Field.ErrorText>
          </Field.Root>
          </Fieldset.Content>
          {/* Botones de envío y cancelación */}
          <Flex justify="center" gap={4}>
            <Button type="submit" colorPalette="blue" size="lg" px={8}>
              Registrar
            </Button>
          </Flex>
        </Stack>
      </Fieldset.Root>
    </Box>
  );
};

export default UserForm;
