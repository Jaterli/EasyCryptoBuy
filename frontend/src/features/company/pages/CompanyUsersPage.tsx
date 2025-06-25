import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Table,
  Text,
  Flex,
  IconButton,
  createListCollection,
  Select,
  Portal,
  Spinner,
  Center
} from "@chakra-ui/react";
import { FaUser } from "react-icons/fa";
import { authCompanyAPI } from "../services/companyApi";
import { UserStats } from "@/shared/types/types";
import { useNavigate } from "react-router-dom";

const itemsPerPageOptions = createListCollection({
  items: [
    { label: "10 por página", value: "10" },
    { label: "20 por página", value: "20" },
    { label: "30 por página", value: "30" },
  ],
});

export const CompanyUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserStats[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = users.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const navigate = useNavigate();

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await authCompanyAPI.getUserStats();
      
      if (response.success && response.data) {
        setUsers(response.data);
        if (currentPage > Math.ceil(response.data.length / itemsPerPage)) {
          setCurrentPage(1);
        }        
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <Box p={{ base: 3, md: 5 }}>
      <Heading size="xl" fontSize={{ base: "lg", md: "xl" }} mb={4}>
        Usuarios registrados
      </Heading>

      {isLoading ? (
        <Center py={10}>
          <Spinner size="xl" color="blue.500" />
        </Center>
      ) : users.length === 0 ? (
        <Text fontSize="md" color="gray.500" textAlign="center" py={6}>
          No hay usuarios registrados aún.
        </Text>
      ) : (
        <>
          <Box overflowX="auto">
            <Table.Root variant="outline" size={{ base: "sm", md: "md" }}>
              <Table.Header>
                <Table.Row fontSize={{ base: "xs", md: "sm" }}>
                  <Table.ColumnHeader>WALLET</Table.ColumnHeader>
                  <Table.ColumnHeader display={{ base: "none", md: "table-cell" }}>EMAIL</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center">CONFIRMADAS</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center">PENDIENTES</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center">FALLIDAS</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="center">DETALLES</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {currentUsers.map((user) => (
                  <Table.Row key={user.id} fontSize={{ base: "xs", md: "sm" }}>
                    <Table.Cell fontWeight="medium" maxW="150px" truncate>{user.username}</Table.Cell>
                    <Table.Cell display={{ base: "none", md: "table-cell" }} maxW="250px" truncate>{user.email}</Table.Cell>
                    <Table.Cell textAlign="center">{user.confirmed}</Table.Cell>
                    <Table.Cell textAlign="center">{user.pending}</Table.Cell>
                    <Table.Cell textAlign="center">{user.failed}</Table.Cell>
                    <Table.Cell textAlign="center">
                      <IconButton
                        aria-label="Ver detalles"
                        size={{ base: "xs", md: "sm" }}
                        variant="ghost"
                        onClick={() => navigate(`/company/users/${user.username}`)}
                      ><FaUser />
                      </IconButton>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>

          <Flex justify="space-between" align="center" mt={4}>
            <Flex gap={2} align="center">
              <IconButton
                aria-label="Página anterior"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                size="sm"
                variant="ghost"
              >
                ←
              </IconButton>
              <Text fontSize="sm">
                Página {currentPage} de {totalPages}
              </Text>
              <IconButton
                aria-label="Página siguiente"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                size="sm"
                variant="ghost"
              >
                →
              </IconButton>
            </Flex>

            <Select.Root
              collection={itemsPerPageOptions}
              value={[itemsPerPage.toString()]}
              onValueChange={({ value }) => {
                setItemsPerPage(Number(value[0]));
                setCurrentPage(1);
              }}
              size="sm"
              width="150px"
            >
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder="Items por página" />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content>
                    {itemsPerPageOptions.items.map((option) => (
                      <Select.Item key={option.value} item={option}>
                        {option.label}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
          </Flex>
        </>
      )}
    </Box>
  );
};