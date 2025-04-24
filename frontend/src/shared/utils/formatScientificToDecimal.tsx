// Función utilitaria para formatear un número en notación científica a decimal
export default function formatScientificToDecimal(num: string | number): string {
    // Convertir a número para asegurarnos
    const n = Number(num);
    // Usar toFixed con alta precisión (aquí 20 decimales, ajustar según necesidad)
    const fixed = n.toFixed(20);
    // Eliminar ceros innecesarios y, si corresponde, el punto decimal final
    return fixed.replace(/(\.\d*?[1-9])0+$/,'$1').replace(/\.0+$/,'');
  }
  
