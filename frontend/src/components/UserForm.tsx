import { Button, Input, Stack, Box, Flex } from "@chakra-ui/react";
import { Field } from "@chakra-ui/react";
import { useForm } from "react-hook-form";

interface FormValues {
  name: string;
  email: string;
}

interface UserFormProps {
  onSubmit: (data: FormValues) => void;
  onCancel: () => void; // Nueva prop para manejar la cancelación
}

const UserForm = ({ onSubmit, onCancel }: UserFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)} className="user-form">
      <Stack spaceY={4}>
        {/* Campo para el nombre */}
        <Field.Root invalid={!!errors.name} className="field">
          <Field.Label className="field-label">Nombre</Field.Label>
          <Input
            className={`field-input ${errors.name ? "field-input--error" : ""}`}
            placeholder="Ingresa tu nombre"
            {...register("name", { required: "El nombre es obligatorio" })}
          />
          <Field.ErrorText className="field-error">{errors.name?.message}</Field.ErrorText>
        </Field.Root>

        {/* Campo para el correo electrónico */}
        <Field.Root invalid={!!errors.email} className="field">
          <Field.Label className="field-label">Correo electrónico</Field.Label>
          <Input
            className={`field-input ${errors.email ? "field-input--error" : ""}`}
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

        {/* Botones de envío y cancelación */}
        <Flex justify="center" align="center" gap={4}>
          <Button type="submit" colorPalette="blue">
            Continuar
          </Button>
          <Button type="button" colorPalette="gray" onClick={onCancel}>
            Cancelar
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
};

export default UserForm;