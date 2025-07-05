import { useState } from "react";
import { Text } from "@chakra-ui/react";
import { Tooltip } from "./ui/tooltip";

const truncateAddress = (address: string, startLength = 6, endLength = 4): string => {
  if (!address) return "";
  if (address.length <= startLength + endLength) return address;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

const TruncateAddress = ({ address }: { address: string }) => {
  const [isTruncated, setIsTruncated] = useState(true);

  return (
    <Tooltip content={isTruncated ? address : "Haga clic para truncar la dirección"}>
      <Text as={"span"} truncate onClick={() => setIsTruncated(!isTruncated)}>
      {isTruncated ? truncateAddress(address) : address}
      </Text>
    </Tooltip>
        

  );
};

export default TruncateAddress;
