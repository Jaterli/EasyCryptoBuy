import { useState } from 'react';
import { validateTransaction } from '../utils/validateTransaction';
import { registerTransaction } from '../api/registerTransaction';

export function RegisterTransaction() {
  const [walletAddress, setWalletAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [status, setStatus] = useState<'pending' | 'verified' | 'failed'>('pending');
  const [message, setMessage] = useState('');

  const handleRegister = async () => {
    if (!walletAddress || !amount || !transactionHash) {
      setMessage('Todos los campos son obligatorios.');
      return;
    }

    const amountNum = parseFloat(amount);
    const isValid = await validateTransaction(transactionHash, walletAddress, amountNum);

    if (!isValid) {
      setStatus('failed');
      setMessage('❌ Transacción no válida.');
    } else {
      setStatus('verified');
      setMessage('✅ Transacción válida.');
    }

    const response = await registerTransaction(walletAddress, amountNum, transactionHash, status);
    if (response.success) {
      setMessage(`🎉 ${response.message}`);
    } else {
      setMessage(`❌ Error: ${response.message}`);
    }
  };

  return (
    <div>
      <h2>Registrar Transacción</h2>
      <input type="text" placeholder="Wallet Address" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} />
      <input type="text" placeholder="Amount (ETH)" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <input type="text" placeholder="Transaction Hash" value={transactionHash} onChange={(e) => setTransactionHash(e.target.value)} />
      <button onClick={handleRegister}>Registrar</button>
      <p>{message}</p>
    </div>
  );
}
