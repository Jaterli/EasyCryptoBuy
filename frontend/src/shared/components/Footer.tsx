import { Box, Text } from '@chakra-ui/react'

export default function Footer() {
  return (
    <Box as="footer" py={5} mt={5} minW="100%" position="absolute" bottom="0" bg={{ _dark: "blue.900", base: "blue.100" }} textAlign="center">
      <Text fontSize="sm">
        © {new Date().getFullYear()} EasyCryptoBuy. Todos los derechos reservados.
      </Text>
    </Box>
  )
}
