import { useState } from 'react';
import { 
  Box, 
  Text, 
  IconButton, 
  Card,
  Collapsible,
  Stack,
  Badge,
  HStack,
  Icon,
  Heading,
  VStack,
  Spacer,
} from '@chakra-ui/react';
import { toaster } from "@/shared/components/ui/toaster";
import { FaCopy, FaFileInvoice, FaChevronDown, FaChevronUp, FaShoppingCart } from 'react-icons/fa';
import formatScientificToDecimal from "@/shared/utils/formatScientificToDecimal";
import { Transaction } from '@/shared/types/types';
import { API_PATHS } from '@/config/paths';


interface TransactionDataProps {
    tx: Transaction;
}

export default function TransactionData({ tx }: TransactionDataProps) {


    const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case 'confirmed':
        return 'green';
        case 'pending':
        return 'yellow';
        case 'failed':
        return 'red';
        default:
        return 'gray';
    }
    };

    const handleDownloadInvoice = (transactionId: number) => {
    window.open(`${API_PATHS.payments}/generate-invoice/${transactionId}/`, '_blank');
    };

    const copyToClipboard = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toaster.create({ title: "Hash copiado", type: "success", duration: 2000});
    };

    const toggleCardExpansion = (id: number) => {
    setExpandedCards(prev => ({
        ...prev,
        [id]: !prev[id]
    }));
    };
    

    const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});

    return (
        <Card.Root key={tx.id}>
        <Card.Body>
            <VStack align="stretch" spaceY={3}>
            <Stack 
                direction={{ base: "column", md: "row" }} 
                justify="space-between" 
                spaceX={{ base: 1, md: 2 }}
            >
                <HStack 
                justify={{ base: "space-between", md: "flex-start" }}
                spaceX={{ base: 0, md: 2 }}
                width={{ base: "100%", md: "auto" }}
                >
                <Badge 
                    colorPalette={getStatusColor(tx.status)} 
                    px={2} 
                    py={1} 
                    borderRadius="full"
                    minW="fit-content"
                >
                    {tx.status}
                </Badge>
                <Text 
                    fontSize="sm" 
                    color="gray.500"
                    textAlign={{ base: "right", md: "left" }}
                >
                    {new Date(tx.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: '2-digit',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric'
                        })}
                </Text>
                </HStack>
                <Text 
                fontWeight="bold" 
                textAlign="right"
                pt={{ base: 1, md: 0 }}
                >
                {formatScientificToDecimal(tx.amount)} {tx.token}
                </Text>
            </Stack>
            <HStack direction={'row'} justify={'space-between'}>
                <Text fontSize="sm" truncate>
                    {tx.transaction_hash}
                    <IconButton
                    aria-label="Copiar hash"                                 
                    size="xs"
                    variant="ghost"
                    onClick={() => copyToClipboard(tx.transaction_hash)}
                    >
                    <FaCopy />
                    </IconButton>
                </Text>
                {tx.purchase_summary && (
                    <IconButton
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleCardExpansion(tx.id)}
                    >
                    {expandedCards[tx.id] ? <FaChevronUp /> : <FaChevronDown />}
                    {expandedCards[tx.id] ? 'Ocultar' : 'Detalles'}
                    </IconButton>
                )}                    
            </HStack>
            </VStack>
            
            {tx.purchase_summary && (
                <Collapsible.Root open={expandedCards[tx.id]}>
                <Collapsible.Content>
                    <Card.Root boxShadow="md">
                    <Card.Header>
                        <HStack>
                        <Icon as={FaShoppingCart} color="green.500" />
                        <Heading size="md">Resumen de la Compra</Heading>
                        </HStack>
                    </Card.Header>
                    <Card.Body>
                        <VStack align="stretch" gap={4}>
                        {tx.purchase_summary.products.map((product) => (
                            <Box key={product.id} borderBottomWidth="1px" pb={4} _last={{ borderBottomWidth: 0 }}>
                            <HStack justify="space-between">
                                <Text fontWeight="bold">{product.name}</Text>
                                <Text>x {product.quantity}</Text>
                            </HStack>
                            {product.description && (
                                <Text fontSize="sm" opacity={0.5} mt={1}>
                                {product.description}
                                </Text>
                            )}
                            <HStack justify="space-between" mt={2}>
                                <Text fontSize="sm">Precio unitario: ${product.price_usd}</Text>
                                <Text fontWeight="bold">Subtotal: ${product.subtotal}</Text>
                            </HStack>
                            </Box>
                        ))}
        
                        <Spacer my={2} />
        
                        <HStack justify="space-between">
                            <Text fontSize="lg" fontWeight="bold">Total Items:</Text>
                            <Text fontSize="lg">{tx.purchase_summary.items_count}</Text>
                        </HStack>
        
                        <HStack justify="space-between" mt={2}>
                            <Text fontSize="lg" fontWeight="bold">Total USD:</Text>
                            <Text fontSize="xl" fontWeight="bold" color="green.600">
                            ${tx.purchase_summary.total_usd}
                            </Text>
                        </HStack>
                        </VStack>
                    </Card.Body>
                    <Card.Footer justifyContent={'flex-end'}>                              
                        <IconButton
                        aria-label="Copiar hash"
                        title='Descargar factura'
                        size={{ base: "xs", md: "md" }}
                        onClick={() => handleDownloadInvoice(tx.id)}
                        variant="solid"
                        >
                        <FaFileInvoice />
                        Descargar factura
                        </IconButton>
                    </Card.Footer>
                    </Card.Root>
                
                    </Collapsible.Content>
                </Collapsible.Root>
            )}
        </Card.Body>
        </Card.Root>
    
    )

}