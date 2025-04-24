// Este wrapper envuelve componentes que pueden ser reseteados desde dentro
// Para ello, al componente hijo se le ha de pasar la prop onReset a la que se le ha de llamar desde dentro para hacer el reset
import { useState, ReactElement, cloneElement, isValidElement } from 'react';

interface ResettableComponentProps {
  children: ReactElement<{ onReset: () => void }>;
}

export default function ResettableComponent({ children }: ResettableComponentProps) {
  const [resetKey, setResetKey] = useState(Date.now());

  const handleReset = () => {
    setResetKey(Date.now());
  };

  if (isValidElement<{ onReset: () => void }>(children)) {
    return cloneElement(children, { key: resetKey, onReset: handleReset });
  }

  return children;
}
