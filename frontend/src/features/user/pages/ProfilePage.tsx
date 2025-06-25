import { useState, useEffect } from 'react';
import { 
  Box, 
  Heading, 
  Button, 
  Stack, 
  Flex,
  Spinner,
  Text,
  Field,
  Fieldset,
  Input,
  Textarea,
  Alert
} from '@chakra-ui/react';
import { toaster } from "@/shared/components/ui/toaster";
import { useForm } from 'react-hook-form';
import { useWallet } from '@/features/user/hooks/useWallet';
import { authUserAPI } from "@/features/user/services/userApi";
import { UserProfile, UpdateProfileData } from "@/shared/types/types";


export default function ProfilePage() {
  const { isAuthenticated, address } = useWallet();
  const [isLoading, setIsLoading] = useState(true);
  const [customError, setCustomError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserProfile>();

  // Cargar datos del perfil
  useEffect(() => {
    setCustomError(null);

    const fetchProfile = async () => {
        
      if (!isAuthenticated) return;
      
      try {
        setIsLoading(true);
        const response = await authUserAPI.getProfile();
        
        if (response.success && response.data) {
          reset({
            name: response.data.name || '',
            email: response.data.email || '',
            address: response.data.address || '',
            phone_number: response.data.phone_number || '',
            birth_date: response.data.birth_date?.split('T')[0] || '',
          });
        } else {
          setCustomError(response.error || 'No se pudo cargar el perfil.');
        }
      } catch (error) {
        setCustomError("No se pudo cargar el perfil. "+error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, reset]);

  // Actualizar perfil
  const onSubmit = async (data: UserProfile) => {

    const response = await authUserAPI.updateProfile(data);
    
    if (response.success && response.data) {
      toaster.create({
        title: 'Perfil actualizado',
        description: 'Tus datos se han guardado correctamente',
        type: 'success',
        duration: 3000,
      });
    } else {
      toaster.create({
        title: 'Error',
        description: 'No se pudo actualizar el perfil',
        type: 'error',
        duration: 5000,
      });

      // Manejar errores de validación del backend
      if (response.fieldErrors) {
        Object.entries(response.fieldErrors).forEach(([field, message]) => {
            console.log("Error -> "+field+': '+message);
          setError(field as keyof UpdateProfileData, {
            type: 'server',
            message,
          });
        });
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <Box p={6}>
        <Heading marginBottom="4">Perfil de Usuario</Heading>
        <Text>Debes firmar en tu wallet para ver tu perfil</Text>
      </Box>
    );
  }

  if (customError) {
    return (
        <Alert.Root status="error" mb={4}>
            <Alert.Indicator />
            <Alert.Title>{customError}</Alert.Title>
        </Alert.Root>
    );
  }

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="200px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box p={{ base: 4, md: 6 }} mb="6">
      <Heading marginBottom="4">Perfil de Usuario ({address})</Heading>

        {/* Formulario de actualización */}
        <Box as="form" mt={4} onSubmit={handleSubmit(onSubmit)}>
          <Fieldset.Root size="lg" className="form">
            <Stack spaceY={4}>
            <Fieldset.Legend fontSize="xl" mb="5">Actualizar datos</Fieldset.Legend>            
            <Fieldset.Content>
              <Field.Root invalid={!!errors.name}>
                <Field.Label>Nombre completo</Field.Label>
                <Input
                  placeholder="Tu nombre"
                  {...register('name', {
                    maxLength: {
                      value: 100,
                      message: 'El nombre no puede tener más de 100 caracteres',
                    },
                  })}
                />
                {errors.name && (
                  <Field.ErrorText>{errors.name.message}</Field.ErrorText>
                )}
              </Field.Root>

              <Field.Root invalid={!!errors.email}>
                <Field.Label>Correo electrónico</Field.Label>
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  {...register('email', {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Correo electrónico inválido',
                    },
                  })}
                />
                {errors.email && (
                  <Field.ErrorText>{errors.email.message}</Field.ErrorText>
                )}
              </Field.Root>

              <Field.Root invalid={!!errors.phone_number}>
                <Field.Label>Teléfono</Field.Label>
                <Input
                  type="tel"
                  placeholder="+1234567890"
                  {...register('phone_number')}
                />
                {errors.phone_number && (
                  <Field.ErrorText>{errors.phone_number.message}</Field.ErrorText>
                )}
              </Field.Root>

              <Field.Root invalid={!!errors.birth_date}>
                <Field.Label>Fecha de nacimiento</Field.Label>
                <Input
                  type="date"
                  {...register('birth_date')}
                />
                {errors.birth_date && (
                  <Field.ErrorText>{errors.birth_date.message}</Field.ErrorText>
                )}                
              </Field.Root>

              <Field.Root>
                <Field.Label>Dirección</Field.Label>
                <Textarea
                  placeholder="Tu dirección completa"
                  rows={3}
                  {...register('address')}
                />
              </Field.Root>
            </Fieldset.Content>

            <Button
              type="submit"
              colorPalette="blue"
              loading={isSubmitting}
              loadingText="Guardando..."
              mt={4}
            >
              Guardar Cambios
            </Button>
            </Stack>
          </Fieldset.Root>
        </Box>
    </Box>
  );
}