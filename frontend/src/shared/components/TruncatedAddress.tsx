import { useState } from "react";
import { HStack, Text } from "@chakra-ui/react";

const truncateAddress = (address: string, startLength = 6, endLength = 4): string => {
  if (!address) return "";
  if (address.length <= startLength + endLength) return address;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

const WalletAddress = ({ address }: { address: string }) => {
  const [isTruncated, setIsTruncated] = useState(true);

  return (
    <HStack>
      <Text fontFamily="mono" truncate fontSize={{ base: "sm", md: "lg" }} onClick={() => setIsTruncated(!isTruncated)}>
        {isTruncated ? truncateAddress(address) : address}
      </Text>
    </HStack>
  );
};

export default WalletAddress;
