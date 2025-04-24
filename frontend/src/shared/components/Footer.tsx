import { Box, Text } from '@chakra-ui/react'

export default function Footer() {
  return (
    <Box as="footer" py={5} mt={10} bg={{ _dark: "blue.900", base: "blue.100" }} textAlign="center">
      <Text fontSize="sm">
        © {new Date().getFullYear()} Blockchain Payments. Todos los derechos reservados.
      </Text>
    </Box>
  )
}
