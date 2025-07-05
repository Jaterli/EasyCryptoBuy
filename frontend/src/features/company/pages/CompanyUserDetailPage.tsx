import {
  Box,
  Heading,
  Text,
  Table,
  Flex,
  IconButton,
  Link,
  Button,
  Alert,
  Spinner
} from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { authCompanyAPI } from "../services/companyApi";
import { Transaction, UserProfile } from "@/shared/types/types";
import { toaster } from "@/shared/components/ui/toaster";
import { FaCopy, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import TruncateAddress from "@/shared/components/TruncatedAddress";

export const UserDetailPage = () => {
  const { wallet_address } = useParams<{ wallet_address: string }>();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const copyToClipboard = (hash: string) => {
      navigator.clipboard.writeText(hash);
      toaster.create({ title: "Hash copiado", type: "success", duration: 2000 });
  };

  const loadData = async () => {
    try {
      const userData = await authCompanyAPI.getUserByWallet(wallet_address!);
      if (userData.data){
          setUser(userData.data);
      } else {
          setUser(null);
          setError("Usuario no encontrado");   
     }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar los datos del usuario");
    } finally {
      setLoading(false);
    }

    try {
      setLoading(true);
      const response = await authCompanyAPI.getTransactionsByWallet(wallet_address!);
      if (response.data) {
        setTransactions(response.data);
      } else {
        setError("No se encontraron transacciones para esta wallet");
        setTransactions([]);
      }   
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar las transacciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [wallet_address]);

  const countByStatus = (status: string) =>
    transactions.filter((t) => t.status === status).length;

  return (
    <Box p={{ base: 4, md: 6 }}>
      <Button size={"xs"} float={"right"} onClick={() => navigate(-1)}>Volver</Button>
      
      <Heading size="lg" mb={4}>
        Detalles del Usuario
      </Heading>

      {loading ? (
        <Flex justify="center" py={10}>
          <Spinner size="lg" />
        </Flex>
      ) : error ? (
        <Alert.Root status="error" mb={4}>
          <Alert.Indicator />
          <Alert.Title>{error}</Alert.Title>
        </Alert.Root>
      ) : user && (
        <>
        <Box mb={6} fontSize={{base:"0.9em", md: "inherit"}}>
          <Text truncate><strong>Wallet:</strong> {user.wallet_address}</Text>
          <Text><strong>Nombre:</strong> {user.name || "No especificado"}</Text>
          <Text><strong>Email:</strong> {user.email || "No especificado"}</Text>
          <Text><strong>Dirección:</strong> {user.address || "No especificado"}</Text>
          <Text><strong>Teléfono:</strong> {user.phone_number || "No especificado"}</Text>  
          <Text><strong>Fecha de nacimiento:</strong> {user.birth_date || "No especificado"}</Text>              
          <Text><strong>Creado:</strong> {new Date(user.created_at).toLocaleString()}</Text>
          <Text><strong>Actualizado:</strong> {new Date(user.updated_at).toLocaleString()}</Text>        
        </Box>

        <Box mb={6}>
          <Heading size="md" mb={2}>Resumen de transacciones</Heading>
          <Flex gap={{ base: 2, md: 6 }} flexDirection={{ base: "column", md: "row" }}>
            <Text color="green.600">✔️ Confirmadas: {countByStatus("confirmed")}</Text>
            <Text color="orange.500">⏳ Pendientes: {countByStatus("pending")}</Text>
            <Text color="red.500">❌ Fallidas: {countByStatus("failed")}</Text>
          </Flex>
        </Box>
        { transactions.length === 0 ? (
          <Text fontSize="md" color="gray.500" textAlign="center" py={6}>
            No hay transacciones registradas para este usuario.
          </Text>
        ) : (
          <Box overflowX="auto" mb="6">
            <Table.Root variant="line" size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Hash</Table.ColumnHeader>
                  <Table.ColumnHeader>Monto</Table.ColumnHeader>
                  <Table.ColumnHeader>Estado</Table.ColumnHeader>
                  <Table.ColumnHeader>Fecha</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign={'center'}>Detalle</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {transactions.map((tx) => (
                  <Table.Row key={tx.id}>
                    <Table.Cell>
                      <TruncateAddress address={tx.transaction_hash} />
                      <IconButton
                          aria-label="Copiar hash"                                 
                          size="xs"
                          variant="ghost"
                          onClick={() => copyToClipboard(tx.transaction_hash)}
                      >
                          <FaCopy />
                      </IconButton>
                    </Table.Cell>
                    <Table.Cell>{Number(tx.amount).toFixed(2)} {tx.token} / {tx.amount_usd} USD</Table.Cell>
                    <Table.Cell
                      color={
                        tx.status === 'confirmed' ? 'green.600' :
                        tx.status === 'pending' ? 'orange.500' :
                        tx.status === 'failed' ? 'red.500' : 
                        'inherit' // color por defecto si hay un estado desconocido
                      }
                    >{tx.status} 
                    </Table.Cell>
                    <Table.Cell>{new Date(tx.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</Table.Cell>
                    <Table.Cell maxW={"35px"} textAlign={'center'}><Link href={`/company/transaction-detail/${tx.transaction_hash}`}><FaEye /></Link></Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>


        ) 
        }
        </>
      )}
    </Box>
  );
};
