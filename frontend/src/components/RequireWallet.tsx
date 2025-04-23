// RequireWallet.tsx
import React from 'react';
import { useWallet } from '../context/useWallet';

interface RequireWalletProps {
  children: React.ReactNode;
}

const RequireWallet = ({ children }: RequireWalletProps) => {
  const { address } = useWallet(); // Obtén la dirección de la wallet desde el contexto

  if (!address) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h2 style={{ color: '#e74c3c' }}>¡Conecta tu wallet!</h2>
        <p>Para continuar, necesitas conectar tu wallet.</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireWallet;
