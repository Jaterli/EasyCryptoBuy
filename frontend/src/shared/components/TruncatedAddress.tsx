import { useState } from "react";
import { Text } from "@chakra-ui/react";

const truncateAddress = (address: string, startLength = 6, endLength = 4): string => {
  if (!address) return "";
  if (address.length <= startLength + endLength) return address;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

const WalletAddress = ({ address }: { address: string }) => {
  const [isTruncated, setIsTruncated] = useState(true);

  return (
      <Text fontFamily="mono" as={"span"} truncate fontSize={{ base: "sm", md: "lg" }} onClick={() => setIsTruncated(!isTruncated)}>
        {isTruncated ? truncateAddress(address) : address}
      </Text>
  );
};

export default WalletAddress;
