// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PaymentContract {
    event PaymentReceived(address indexed sender, uint256 amount);

    // Función para recibir pagos
    function pay() external payable {
        require(msg.value > 0, "El pago debe ser mayor que 0");
        emit PaymentReceived(msg.sender, msg.value);
    }

    // Función para obtener el balance del contrato
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}