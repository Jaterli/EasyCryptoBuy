export async function registerTransaction(
    walletAddress: string,
    amount: number,
    transactionHash: string,
    status: 'verified' | 'failed' | 'pending'
  ) {
    const response = await fetch('http://localhost:8000/payments/api/register-transaction/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_address: walletAddress, amount, transaction_hash: transactionHash, status }),
    });
  
    return await response.json();
  }
  