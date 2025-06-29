import { useState, useEffect } from 'react';
import { 
  Box, 
  Text, 
  IconButton, 
  Card,
  Collapsible,
  Stack,
  HStack,
  Icon,
  Heading,
  VStack,
  Spacer,
  Spinner,
  Flex,
  Tag
} from '@chakra-ui/react';
import { toaster } from "@/shared/components/ui/toaster";
import { 
  FaCopy, 
  FaFileInvoice, 
  FaChevronDown, 
  FaChevronUp, 
  FaShoppingCart,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaTruck,
  FaLink,
  FaUnlink
} from 'react-icons/fa';
import formatScientificToDecimal from "@/shared/utils/formatScientificToDecimal";
import { Transaction, OrderItem } from '@/shared/types/types';
import { API_PATHS } from '@/config/paths';
import { authUserAPI } from '../services/userApi';

interface TransactionDataProps {
    tx: Transaction;
}

export default function TransactionData({ tx }: TransactionDataProps) {
    const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);

    // Cargar orderItems cuando el componente se monta
    useEffect(() => {
        if (tx.status === 'confirmed') {
            setLoading(true);
            authUserAPI.getTransactionOrderItems(tx.id)
                .then(response => {
                    if (response.success && response.data) {
                        setOrderItems(response.data);
                    } else {
                        console.error("Error al cargar detalles de la compra. ", response.error);                 
                        toaster.create({ 
                            title: "Error al cargar detalles de la compra. "+response.error, 
                            type: "error" 
                        });
                    }
                })
                .finally(() => {
                    setLoading(false);
                    setInitialLoad(false);
                });
        }
    }, [tx.id, tx.status]);

    const toggleCardExpansion = (id: number) => {
        setExpandedCards(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Determinar el estado del pedido basado en los OrderItems
    const getOrderStatus = (items: OrderItem[]) => {
        if (items.length === 0) return 'no-items';
        
        const statusCounts = items.reduce((acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const uniqueStatuses = Object.keys(statusCounts);
        if (uniqueStatuses.length === 1) return uniqueStatuses[0];

        if (statusCounts['pending']) return 'pending';
        if (statusCounts['shipped']) return 'shipped';
        return 'processed';
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'confirmed':
            case 'processed':
                return 'green';
            case 'pending':
                return 'yellow';
            case 'failed':
                return 'red';
            case 'shipped':
                return 'blue';
            case 'no-items':
                return 'gray';
            default:
                return 'gray';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'confirmed':
                return FaLink;
            case 'processed':
                return FaCheckCircle;
            case 'pending':
                return FaClock;
            case 'shipped':
                return FaTruck;
            case 'failed':
                return FaTimesCircle;
            case 'no-items':
                return FaUnlink;
            default:
                return FaClock;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status.toLowerCase()) {
            case 'confirmed':
                return 'Confirmada en blockchain';
            case 'processed':
                return 'Pedido procesado';
            case 'pending':
                return 'Pedido pendiente';
            case 'shipped':
                return 'Pedido enviado';
            case 'failed':
                return 'Transacción fallida';
            case 'no-items':
                return 'Sin items registrados';
            default:
                return status;
        }
    };

    const copyToClipboard = (hash: string) => {
        navigator.clipboard.writeText(hash);
        toaster.create({ title: "Hash copiado", type: "success", duration: 2000 });
    };

    const handleDownloadInvoice = (transactionId: number) => {
        window.open(`${API_PATHS.payments}/generate-invoice/${transactionId}`, '_blank');
    };

    const getSummary = () => {
        let total_usd = 0;
        let items_count = 0;
        const products = orderItems.map(item => {
            const subtotal = item.price_at_sale * item.quantity;
            total_usd += subtotal;
            items_count += item.quantity;
            return {
                id: item.product.id,
                name: item.product.name,
                description: item.product.description,
                quantity: item.quantity,
                price_usd: item.price_at_sale,
                subtotal: subtotal.toFixed(2),
                status: item.status
            };
        });
        return {
            products,
            total_usd: total_usd.toFixed(2),
            items_count
        };
    };

    const showSummary = tx.status === 'confirmed';
    const summary = getSummary();
    const orderStatus = getOrderStatus(orderItems);

    return (
        <Card.Root key={tx.id}>
            <Card.Body>
                <Stack align="stretch" spaceY={3}>
                    <Stack 
                        direction={{ base: "column", md: "row" }} 
                        justify="space-between" 
                        spaceX={{ base: 1, md: 2 }}
                    >
                        <Flex direction={{ base: "column", md: "row" }} align="flex-start" gap={2}>
                            {/* Estado de la transacción en blockchain */}                            

                           <Tag.Root 
                                size="sm" 
                                colorPalette={getStatusColor(tx.status)}
                            >
                                <Tag.StartElement as={getStatusIcon(tx.status)} />
                                <Tag.Label>{getStatusLabel(tx.status)}</Tag.Label>
                            </Tag.Root>
                            
                            {/* Estado del pedido (order items) - Solo para transacciones confirmadas */}
                            {tx.status === 'confirmed' && (
                                <Tag.Root 
                                    size="sm" 
                                    colorPalette={getStatusColor(orderStatus)}
                                >
                                    {initialLoad ? (
                                        <Spinner size="xs" />
                                    ) : (
                                        <>
                                        <Tag.StartElement as={getStatusIcon(orderStatus)} />
                                        <Tag.Label>{getStatusLabel(orderStatus)}</Tag.Label>
                                        </>
                                    )}
                                </Tag.Root>
                            )}
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
                        </Flex>

                        <Text 
                            fontWeight="bold" 
                            textAlign="right"
                            pt={{ base: 1, md: 0 }}
                        >
                            {formatScientificToDecimal(tx.amount)} {tx.token}
                        </Text>
                    </Stack>
                    
                    <Stack direction={'row'} justify={'space-between'}>
                        <Text fontSize="sm" truncate>
                            {(tx.transaction_hash === tx.wallet_address) ? "Hash sin registrar" : tx.transaction_hash}
                            <IconButton
                                aria-label="Copiar hash"                                 
                                size="xs"
                                variant="ghost"
                                onClick={() => copyToClipboard(tx.transaction_hash)}
                            >
                                <FaCopy />
                            </IconButton>
                        </Text>
                        {tx.status === 'confirmed' && (
                            <IconButton
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleCardExpansion(tx.id)}
                            >
                                {expandedCards[tx.id] ? <FaChevronUp /> : <FaChevronDown />}
                                {expandedCards[tx.id] ? 'Ocultar' : 'Detalles'}
                            </IconButton>
                        )}                    
                    </Stack>
                </Stack>

                {showSummary && (
                    <Collapsible.Root open={expandedCards[tx.id]}>
                        <Collapsible.Content>
                            {loading ? (
                                <Spinner size="lg" />
                            ) : (
                                <Card.Root boxShadow="md">
                                    <Card.Header>
                                        <HStack>
                                            <Icon as={FaShoppingCart} color="green.500" />
                                            <Heading size="md">Resumen de la Compra</Heading>
                                        </HStack>
                                    </Card.Header>
                                    <Card.Body>
                                        <VStack align="stretch" gap={4}>
                                            {summary.products.map((product) => (
                                                <Box key={product.id} borderBottomWidth="1px" pb={4} _last={{ borderBottomWidth: 0 }}>
                                                    <Flex direction={{ base: "column", md: "row" }} justify="space-between">
                                                        <Text fontWeight="bold">{product.name}</Text>
                                                        <HStack>
                                                            <Text>x {product.quantity}</Text>
                                                            <Tag.Root 
                                                                size="sm" 
                                                                colorPalette={getStatusColor(product.status)}
                                                            >
                                                                <Tag.StartElement as={getStatusIcon(product.status)} />
                                                                <Tag.Label>{getStatusLabel(product.status)}</Tag.Label>
                                                            </Tag.Root>
                                                        </HStack>
                                                    </Flex>
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
                                                <Text fontSize="lg">{summary.items_count}</Text>
                                            </HStack>

                                            <HStack justify="space-between" mt={2}>
                                                <Text fontSize="lg" fontWeight="bold">Total USD:</Text>
                                                <Text fontSize="xl" fontWeight="bold" color="green.600">
                                                    ${summary.total_usd}
                                                </Text>
                                            </HStack>
                                        </VStack>
                                    </Card.Body>
                                    <Card.Footer justifyContent={'flex-end'}>                              
                                        <IconButton
                                            aria-label="Descargar factura"
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
                            )}
                        </Collapsible.Content>
                    </Collapsible.Root>
                )}
            </Card.Body>
        </Card.Root>
    );
}