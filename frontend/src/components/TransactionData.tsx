import { useState, useEffect } from "react"; // <-- Añadir imports
import { Text, Heading, Stack, HStack, VStack, Icon, Badge, Card, CardBody, CardHeader, IconButton, useBreakpointValue } from "@chakra-ui/react";
import { FaHistory, FaCopy } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import formatScientificToDecimal from "@/components/formatScientificToDecimal";
import { toaster } from "@/components/ui/toaster";
import WalletAddress from "@/components/TruncatedAddress";

interface TransactionProp {
    transaction_hash: string;
    amount: string;
    created_at: string;
    token: string;
    status: string;
}

interface TransactionDataProps {
    tx: TransactionProp;
}

export default function TransactionData({ tx }: TransactionDataProps) {
    // Estado para forzar re-renders periódicos
    const [, setTick] = useState(false); // Estado "tick" no utilizado
    const isMobile = useBreakpointValue({ base: true, md: false });
    
    useEffect(() => {
        const interval = setInterval(() => {
            // Forzar re-render alternando un estado booleano
            setTick(prev => !prev);
        }, 60000); // Cada 60 segundos
        
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: string) => {
        switch(status.toLowerCase()) {
            case 'completed': return 'green';
            case 'pending': return 'yellow';
            case 'failed': return 'red';
            default: return 'blue';
        }
    };  
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toaster.create({ title: "Dirección copiada", type: "success", duration: 2000});    
    };    

    return (
        <Card.Root boxShadow="md">
            <CardHeader>
                <HStack>
                    <Icon as={FaHistory} color="blue.500" />
                    <Heading size="md">Transacción</Heading>
                </HStack>
            </CardHeader>
            <CardBody>
                <Stack spaceY={4}>
                    <Card.Root variant="elevated">
                        <CardBody>
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
                                            {/* El tiempo se actualizará automáticamente */}
                                            {formatDistanceToNow(new Date(tx.created_at), { 
                                                addSuffix: true, 
                                                locale: es 
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
                                <HStack>
                                    <Text fontSize="sm" truncate flex={1}>
                                        {isMobile ? (
                                            <WalletAddress address={tx.transaction_hash} />
                                            ) : (tx.transaction_hash)
                                        }    
                                    </Text>
                                    <IconButton
                                        aria-label="Copiar hash"                                 
                                        size="xs"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(tx.transaction_hash)}
                                    ><FaCopy />
                                    </IconButton>
                                </HStack>
                            </VStack>
                        </CardBody>
                    </Card.Root>
                </Stack>
            </CardBody>
        </Card.Root>
    )
}