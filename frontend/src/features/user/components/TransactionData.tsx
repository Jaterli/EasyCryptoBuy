import { useState, useEffect } from 'react';
import { 
  Text, 
  IconButton, 
  Card,
  Stack,
  Flex,
  Tag,
  Dialog,
  Portal,
  CloseButton
} from '@chakra-ui/react';
import { toaster } from "@/shared/components/ui/toaster";
import { 
  FaCopy, 
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaTruck,
  FaLink,
  FaUnlink,
  FaSearchPlus 
} from 'react-icons/fa';

import formatScientificToDecimal from "@/shared/utils/formatScientificToDecimal";
import { Transaction, OrderItem } from '@/shared/types/types';
import { authUserAPI } from '../services/userApi';
import { PurchaseSummary } from './PurchaseSummary';
import { useDisclosure } from '@chakra-ui/react';
import WalletAddress from '@/shared/components/TruncatedAddress';

interface TransactionDataProps {
  tx: Transaction;
}

export default function TransactionData({ tx }: TransactionDataProps) {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { open, onOpen, onClose } = useDisclosure();

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
        });
    }
  }, [tx.id, tx.status]);

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
        return 'Procesado, pendiente de ser enviado';
      case 'pending':
        return 'Registrado, pendiente de ser procesado';
      case 'shipped':
        return 'Enviado';
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

  const showSummary = tx.status === 'confirmed';

  return (
    <>
      <Dialog.Root open={open} onOpenChange={(e) => {
        if (!e.open) onClose();
      }}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content minW={{ base: "100%", md: "xl" }}>
              <Dialog.Header>
                <Dialog.Title>
                    <Text>Detalles de la Transacción</Text>
                    <Text fontSize={'0.9em'} fontWeight={'normal'}><WalletAddress address={tx.transaction_hash} /></Text>
                </Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size="sm" />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body>
                <PurchaseSummary
                  orderItems={orderItems}
                  transactionId={tx.id}
                  loading={loading}
                  getStatusColor={getStatusColor}
                  getStatusIcon={getStatusIcon}
                  getStatusLabel={getStatusLabel}
                />
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <Card.Root key={tx.id}>
        <Card.Body>
          <Stack align="stretch" spaceY={3}>
            <Stack 
              direction={{ base: "column", md: "row" }} 
              justify="space-between" 
              spaceX={{ base: 1, md: 2 }}
            >
              <Flex direction={{ base: "column", md: "row" }} align="flex-start" gap={2}>
                <Tag.Root 
                  size="sm" 
                  colorPalette={getStatusColor(tx.status)}
                >
                  <Tag.StartElement as={getStatusIcon(tx.status)} />
                  <Tag.Label>{getStatusLabel(tx.status)}</Tag.Label>
                </Tag.Root>                            
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

              {showSummary && (
                <IconButton
                  size="sm"
                  variant="ghost"
                  onClick={onOpen}
                  aria-label="Ver detalles"
                >
                  <FaSearchPlus />
                </IconButton>
              )}                    
            </Stack>
          </Stack>
        </Card.Body>
      </Card.Root>
    </>
  );
}