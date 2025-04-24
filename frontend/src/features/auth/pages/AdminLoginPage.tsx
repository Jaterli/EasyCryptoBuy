import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Field, Fieldset, Heading, Input, Stack } from "@chakra-ui/react";
import { adminLogin } from "../api/login";
import { toaster } from "@/shared/components/ui/toaster";
import { useAdminAuth } from "@/shared/context/AdminAuthContext";


const AdminLoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAdminAuth();

  const handleLogin = async () => {
    try {
      setLoading(true);
      const { token, is_staff } = await adminLogin(username, password);
      if (is_staff) {
        login(token);
        navigate("/company/products");
      } else {
        throw new Error("Usuario no autorizado");
      }
    } catch (err: unknown) {
        let errorMessage = "Ocurrió un error desconocido";        
        if (err instanceof Error) {
            errorMessage = err.message;
          } else if (typeof err === 'string') {
            errorMessage = err;
        }        
        toaster.create({ title: "Error de login", type: "error", description: errorMessage, duration: 2000});

    } finally {
      setLoading(false);
    }
  };

  return (
    <Fieldset.Root 
      maxW="md" 
      mx="auto" 
      mt={20} 
      p={6} 
    >
      <Stack spaceX={6}>
        <Fieldset.Legend>
          <Heading size="md">Login de Administrador</Heading>
        </Fieldset.Legend>
        
        <Field.Root>
          <Field.Label>Usuario</Field.Label>
          <Input 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            placeholder="Ingrese su usuario"
          />
        </Field.Root>
        
        <Field.Root>
          <Field.Label>Contraseña</Field.Label>
          <Input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            placeholder="Ingrese su contraseña"
          />
        </Field.Root>
        
        <Button 
          colorPalette="blue" 
          onClick={handleLogin} 
          loading={loading}
          loadingText="Iniciando sesión..."
          width="full"
        >
          Iniciar sesión
        </Button>
      </Stack>
    </Fieldset.Root>
  );
};

export default AdminLoginPage;