// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.0;

// // Lineas comentadas para evitar los warnings en la consola
// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// contract PaymentContract {
//     using SafeERC20 for IERC20;

//     event PaymentReceived(
//         address indexed sender,
//         uint256 amount,
//         address token,
//         string currency,
//         uint256 indexed transactionId
//     );
//     event Withdrawn(address indexed receiver, uint256 amount, address token);
//     event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

//     address public owner;
    
//     address public constant USDT = 0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0; // Sepolia
//     address public constant USDC = 0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8; // Sepolia
//     address public constant LINK = 0x779877A7B0D9E8603169DdbD7836e478b4624789; // Sepolia

//     constructor() {
//         owner = msg.sender;
//     }

//     // Función para pagar con ETH
//     function payETH(uint256 transactionId) external payable {
//         require(msg.value > 0, "Amount must be > 0");
//         emit PaymentReceived(msg.sender, msg.value, address(0), "ETH", transactionId);
//     }

//     // Funciones específicas para cada token
//     function payUSDT(uint256 amount, uint256 transactionId) external {
//         _processPayment(USDT, amount, "USDT", transactionId);
//     }

//     function payUSDC(uint256 amount, uint256 transactionId) external {
//         _processPayment(USDC, amount, "USDC", transactionId);
//     }

//     function payLINK(uint256 amount, uint256 transactionId) external {
//         _processPayment(LINK, amount, "LINK", transactionId);
//     }

//     function _processPayment(address token, uint256 amount, string memory currency, uint256 transactionId) private {
//         require(amount > 0, "Amount must be > 0");
//         IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
//         emit PaymentReceived(msg.sender, amount, token, currency, transactionId);
//     }
    
//     // Retiro de fondos con mejoras
//     function withdraw(address token, uint256 amount) external onlyOwner {
//         if (token == address(0)) {
//             require(address(this).balance >= amount, "Insufficient ETH balance");
//             (bool success, ) = owner.call{value: amount}("");
//             require(success, "ETH transfer failed");
//         } else {
//             uint256 balance = IERC20(token).balanceOf(address(this));
//             require(balance >= amount, "Insufficient token balance");
//             IERC20(token).safeTransfer(owner, amount);
//         }
//         emit Withdrawn(owner, amount, token);
//     }

//     // Bloquea transferencias ETH directas sin usar payETH()
//     receive() external payable {
//         revert("Use payETH function");
//     }

//     // Gestión de ownership
//     function transferOwnership(address newOwner) external onlyOwner {
//         require(newOwner != address(0), "Invalid address");
//         emit OwnershipTransferred(owner, newOwner);
//         owner = newOwner;
//     }

//     modifier onlyOwner() {
//         require(msg.sender == owner, "Unauthorized");
//         _;
//     }

//     function getBalance(address token) external view returns (uint256) {
//         return token == address(0) 
//             ? address(this).balance
//             : IERC20(token).balanceOf(address(this));
//     }

//     function getAllowance(address token, address user) external view returns (uint256) {
//         return IERC20(token).allowance(user, address(this));
//     }

//     function isApproved(address token, address user, uint256 amount) external view returns (bool) {
//         return IERC20(token).allowance(user, address(this)) >= amount;
//     }    
// }
