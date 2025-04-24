import { VStack, Heading, Text, Button, Box } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Box minH="50vh" display="flex" alignItems="center" justifyContent="center">
      <VStack spaceX={6} textAlign="center">
        <Heading as="h1" size="2xl" color="red.500">
          404
        </Heading>
        <Heading as="h2" size="lg">
          Página no encontrada - Company
        </Heading>
        <Text fontSize="lg">
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </Text>
        <Button
          colorPalette="blue"
          size="lg"
          onClick={() => navigate('/dashboard')}
          mt={4}
        >
          Volver al inicio
        </Button>
      </VStack>
    </Box>
  );
};

export default NotFoundPage;