import { Text, Spinner, Button } from '@chakra-ui/react';
import { useState } from 'react';
import { toaster } from "@/shared/components/ui/toaster";
import { authCompanyAPI } from "../services/companyApi";
import { FaListCheck } from "react-icons/fa6";

interface CheckTransactionsProps {
  transactionHash?: string;
  onCheckComplete?: () => void;
}

interface TransactionStatus {
  status: string;
  processed?: number;
  failed?: number;
  message?: string;
  lastChecked?: string;
}

export const CheckTransactions = ({ 
  transactionHash,
  onCheckComplete 
}: CheckTransactionsProps) => {

  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({
    status: 'pending',
    message: 'No se ha verificado el estado aún'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckTransactions = async () => {
    try {
      setIsLoading(true);
      setTransactionStatus({
        status: 'pending',
        message: 'Se está verificando el estado en la Blockchain...'
      });

      // Llama a tu función API
      const result = await authCompanyAPI.runCheckPendingTransaction(transactionHash || '');

      // Actualiza el estado basado en la respuesta
      const newStatus: TransactionStatus = {
        status: result.status === 'success' && result.processed > 0 ? 'confirmed' : result.failed > 0 ? 'failed' : 'No procesada',
        processed: result.processed,
        failed: result.failed,
        message: result.message,
        lastChecked: new Date().toLocaleTimeString()
      };

      setTransactionStatus(newStatus);

      // Muestra notificación
      toaster.create({  
        title: result.status === 'success' && result.processed > 0 ? 'Éxito' : 'Error',
        description: result.message != null ? result.message : 'Procesadas: '+result.processed+', Fallidas: '+result.failed,
        type: result.status === 'success' && result.processed > 0 ? 'success' : 'error',
        duration: 5000,
       });

        // Llamar al callback después de una verificación exitosa
        if (result.status === 'success' && onCheckComplete) {
            onCheckComplete();
        }

    } catch (err: unknown) {
      let errorMessage = "Ocurrió un error al iniciar sesión";
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }

      setTransactionStatus({
        status: 'failed',
        message: errorMessage || 'Error durante la verificación',
        lastChecked: new Date().toLocaleTimeString()
      });

      toaster.create({  
        title: 'Error',
        description: errorMessage || 'Error desconocido',
        type: 'error',
        duration: 5000,
       });

    } finally {
      setIsLoading(false);
    }
  };

  // Estilos condicionales basados en el estado
  const getStatusColor = () => {
    switch (transactionStatus.status) {
      case 'confirmed': return 'green';
      case 'failed': return 'red';
      case 'pending': return 'orange';
      default: return 'gray';
    }
  };

  return (
    <>
        <Text>
            Estado: <Text as='span' color={`${getStatusColor()}.500`}> {transactionStatus.status.toUpperCase()}</Text>
        </Text>
        <Text opacity={0.7}>{transactionStatus.message}</Text>
        {transactionStatus.lastChecked && (
            <Text fontSize="sm" opacity={0.7}>
            Última verificación: {transactionStatus.lastChecked}
            </Text>
        )}
        
        {transactionStatus.status != 'confirmed' && (
            <Button
                size={'xs'}            
                onClick={handleCheckTransactions}
                loading={isLoading}
                loadingText="Verificando..."
                my={2}
            >
                <FaListCheck />
                {isLoading ? <Spinner size="sm" /> : undefined}
                Verificar en la Blockchain
            </Button>
        )}

    </>
  );
};