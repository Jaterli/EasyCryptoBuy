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
  FaClock,
  FaTimesCircle,
  FaSearchPlus, 
  FaLink
} from 'react-icons/fa';
import formatScientificToDecimal from "@/shared/utils/formatScientificToDecimal";
import { Transaction } from '@/shared/types/types';
import { PurchaseSummary } from './PurchaseSummary';
import { useDisclosure } from '@chakra-ui/react';
import TruncateAddress from '@/shared/components/TruncatedAddress';

interface TransactionDataProps {
  tx: Transaction;
}

export default function TransactionData({ tx }: TransactionDataProps) {
  const { open, onOpen, onClose } = useDisclosure();

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

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return FaLink;
      case 'pending':
        return FaClock;
      case 'failed':
        return FaTimesCircle;
      default:
        return FaClock;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'Confirmada en blockchain';
      case 'pending':
        return 'Pendiente de confirmación';
      case 'failed':
        return 'Transacción fallida';
      default:
        return status;
    }
  };

  const copyToClipboard = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toaster.create({ title: "Hash copiado", type: "success", duration: 2000 });
  };

  const showSummary = tx.status != 'failed';

  return (
    <>
      <Dialog.Root open={open} onOpenChange={(e) => {
        if (!e.open) onClose();
      }}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>
                    <Text>Detalles de la Transacción</Text>
                    <Text fontSize={'0.9em'} fontWeight={'normal'}><TruncateAddress address={tx.transaction_hash} /></Text>
                </Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size="sm" />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body>
                {showSummary && (
                  <PurchaseSummary transactionId={tx.id} />
                )}
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