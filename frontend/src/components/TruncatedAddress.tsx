import { useState } from "react";
import { HStack, Text, IconButton } from "@chakra-ui/react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const truncateAddress = (address: string, startLength = 6, endLength = 4): string => {
  if (!address) return "";
  if (address.length <= startLength + endLength) return address;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

const WalletAddress = ({ address }: { address: string }) => {
  const [isTruncated, setIsTruncated] = useState(true);

  return (
    <HStack>
      <Text fontFamily="mono" fontSize={{ base: "xs", md: "lg" }}>
        {isTruncated ? truncateAddress(address) : address}
      </Text>
      <IconButton
          aria-label={isTruncated ? "Mostrar completa" : "Ocultar"}
          size="xs"
          variant="ghost"
          onClick={() => setIsTruncated(!isTruncated)}
        >
          {isTruncated ? <FaEye /> : <FaEyeSlash />}
        </IconButton>
    </HStack>
  );
};

export default WalletAddress;
