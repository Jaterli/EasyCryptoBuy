import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Field, Fieldset, Input, Stack, Box } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { adminLogin } from "../api/login";
import { toaster } from "@/shared/components/ui/toaster";
import { useAdminAuth } from "@/shared/context/AdminAuthContext";

interface LoginFormValues {
  username: string;
  password: string;
}

const AdminLoginPage: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>();
  
  const navigate = useNavigate();
  const { login } = useAdminAuth();

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const { token, refresh, is_staff, username } = await adminLogin(data.username, data.password);
      
      if (is_staff) {
        login(token, refresh, username);
        toaster.create({
          title: "Login exitoso",
          type: "success",
          description: "Bienvenido al panel de administración",
          duration: 2000,
        });
        navigate("/company/products");
      } else {
        throw new Error("Usuario no autorizado");
      }
    } catch (err: unknown) {
      let errorMessage = "Ocurrió un error al iniciar sesión";
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      toaster.create({ 
        title: "Error de login", 
        type: "error", 
        description: errorMessage, 
        duration: 2000 
      });
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)}>
      <Fieldset.Root size="lg" maxW="md" mx="auto" mt={20} p={6}>
        <Stack>
          <Fieldset.Legend>Login de administrador</Fieldset.Legend>
          <Fieldset.HelperText>
            Por favor, ingresa tu usuario y contraseña.
          </Fieldset.HelperText>
        </Stack>
          <Fieldset.Content>
            <Field.Root invalid={!!errors.username}>
              <Field.Label>Usuario</Field.Label>
              <Input 
                placeholder="Ingrese su usuario"
                {...register("username", { 
                  required: "El usuario es requerido" 
                })}
              />
              <Field.ErrorText>{errors.username?.message}</Field.ErrorText>
            </Field.Root>
          </Fieldset.Content>
          
          <Fieldset.Content>
            <Field.Root invalid={!!errors.password}>
              <Field.Label>Contraseña</Field.Label>
              <Input 
                type="password"
                placeholder="Ingrese su contraseña"
                {...register("password", { 
                  required: "La contraseña es requerida",
                  minLength: {
                    value: 6,
                    message: "La contraseña debe tener al menos 6 caracteres"
                  }
                })}
              />
              <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
            </Field.Root>
          </Fieldset.Content>
          
          <Button 
            type="submit"
            colorPalette="blue" 
            loading={isSubmitting}
            loadingText="Iniciando sesión..."
            width="full"
          >
            Iniciar sesión
          </Button>
      </Fieldset.Root>
    </Box>
  );
};

export default AdminLoginPage;